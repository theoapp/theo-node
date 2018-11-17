import dotenv from 'dotenv';
import restify from 'restify';
import AppHelper from './lib/helpers/AppHelper';
import CacheHelper from './lib/helpers/CacheHelper';
import DbHelper from './lib/helpers/DbHelper';
import { loadPlugins } from './lib/helpers/PluginHelper';
import { initRoutes } from './routes';
import { authMiddleware } from './lib/middlewares/AuthMiddleware';
import packageJson from '../package';

dotenv.config();

const DB_CONN_MAX_RETRY = 10;

let settings;
const settingsJson = process.env.SETTINGS_FILE;
if (settingsJson) {
  settings = require(settingsJson);
} else {
  settings = {
    admin: {
      token: ''
    },
    client: {
      tokens: []
    },
    server: {
      http_port: 9100
    },
    db: {
      engine: 'sqlite',
      storage: './data/theo.db'
    }
  };
}

const setDbEnv = () => {
  if (process.env.DB_ENGINE) {
    settings.db.engine = process.env.DB_ENGINE;
  }
  if (settings.db.engine === 'sqlite') {
    if (process.env.DB_STORAGE) {
      settings.db.storage = process.env.DB_STORAGE;
    } else {
      const sqlite_path = process.env.DATA_PATH || false;
      if (sqlite_path) {
        settings.db.storage = sqlite_path;
      }
    }
  } else {
    const { DB_USER, DB_PASSWORD, DB_HOST, DB_NAME, DB_PORT } = process.env;
    if (!DB_USER && !settings.db.user) {
      console.error('DB ERROR! Engine %s required DB_USER', settings.db.engine);
      process.exit(1);
    }
    if (!DB_PASSWORD && !settings.db.password) {
      console.error('DB ERROR! Engine %s required DB_PASSWORD', settings.db.engine);
      process.exit(1);
    }
    if (!DB_HOST && !settings.db.host) {
      console.error('DB ERROR! Engine %s required DB_HOST', settings.db.engine);
      process.exit(1);
    }
    if (!DB_NAME && !settings.db.name) {
      console.error('DB ERROR! Engine %s required DB_NAME', settings.db.engine);
      process.exit(1);
    }
    if (DB_USER) {
      settings.db.username = DB_USER;
    }
    if (DB_PASSWORD) {
      settings.db.password = DB_PASSWORD;
    }
    if (DB_NAME) {
      settings.db.database = DB_NAME;
    }
    if (DB_HOST) {
      settings.db.host = DB_HOST;
    }
    if (DB_PORT) {
      settings.db.port = Number(DB_PORT);
    }
  }
};

const setEnv = () => {
  const adminToken = process.env.ADMIN_TOKEN || false;
  if (adminToken) {
    settings.admin.token = adminToken;
  }
  const clientTokens = process.env.CLIENT_TOKENS || false;
  if (clientTokens) {
    settings.client.tokens = clientTokens.split(',');
  }
  const httpPort = process.env.HTTP_PORT || false;
  if (httpPort) {
    settings.server.http_port = Number(httpPort);
  }
  const cache = process.env.CACHE_ENABLED || false;
  if (cache) {
    settings.cache = {
      type: cache,
      settings: {
        uri: process.env.CACHE_URI || false,
        options: process.env.CACHE_OPTIONS || false
      }
    };
  }
  setDbEnv();
};

setEnv();

if (!settings.admin.token && settings.client.tokens.length === 0) {
  console.error('\n !!! WARNING !!! ');
  console.error(' No admin token nor client tokens found ');
  console.error(' !!! WARNING !!! \n');
}

console.log(`
    ________ ________ ____ _____
   /_______/____/___/____/_____/
    /   /  /   /   /  __/ _   /
   /   /  /   -   /  __/ /_/ /
  /___/  /___/___/____/_____/
  

      _______________
     /              /|
    /              / |
   /______________/  |
   |\\  |__________|  |
   | \\/  🔑 🔑 🔑 |  /
   |  \\🔑  🔑  🔑 | /
   |   |__________|/
   \\ \\ |
    \\  |
     \\ |
      \\|

`);
const ah = AppHelper(settings);
if (process.env.USE_PLUGINS && (process.env.USE_PLUGINS === '1' || process.env.USE_PLUGINS === 'true')) {
  loadPlugins();
}
let dh;
let dm;
try {
  dh = DbHelper(ah.getSettings('db'));
  dm = dh.getManager();
  if (!dm) {
    console.error('Unable to load DB Manager!!!');
    process.exit(99);
  }
} catch (e) {
  console.error('Failed to load DB Manager!!!', e.message);
  console.error(e);
  process.exit(99);
}
const initDb = () => {
  try {
    dh.init()
      .then(() => {
        console.log('Db %s initiated', dm.getEngine());
        startServer();
      })
      .catch(e => {
        console.error('Failed to initialize db', e.message);
        console.error(e);
        process.exit(99);
      });
  } catch (e) {
    console.error('Failed to load DB Manager!!!', e.message);
    console.error(e);
    process.exit(99);
  }
};
const testDB = async () => {
  try {
    const client = dm.getClient();
    await client.open();
    await client.close();
    return true;
  } catch (e) {
    return false;
  }
};
let ch;
let cm;
try {
  ch = CacheHelper(ah.getSettings('cache'));
} catch (err) {
  console.error('Unable to create CacheHelper', err);
}
if (ch) {
  cm = ch.getManager();
  if (cm) {
    console.log('Flushing CacheManager');
    cm.flush().catch(er => {
      console.error('Failed to initialize CacheManager', er.message);
    });
  }
}
const startServer = () => {
  // HTTP server
  const server = restify.createServer({
    name: packageJson.name + '/' + packageJson.version
  });
  server.use(restify.plugins.acceptParser(server.acceptable));
  server.use(restify.plugins.dateParser());
  server.use(restify.plugins.queryParser());
  server.use(restify.plugins.gzipResponse());
  server.use(restify.plugins.bodyParser());
  server.use(authMiddleware);
  server.use(async (req, res, next) => {
    const client = dm.getClient();
    await client.open();
    req.db = client;
    res.on('finish', () => {
      client.close();
    });
    next();
  });
  initRoutes(server);
  server.listen(settings.server.http_port, function() {
    console.log('%s listening at %s', server.name, server.url);
  });
};
process.on('SIGINT', async () => {
  console.log('Caught interrupt signal');
  try {
    await dh.close();
    if (cm) {
      cm.close();
    }
  } catch (e) {}
  process.exit();
});
const startTestDb = async retry => {
  if (retry >= DB_CONN_MAX_RETRY) {
    console.error("Givin' it up, failed to connect to db after %s retries", DB_CONN_MAX_RETRY);
    process.exit(90);
  }
  console.log('DB Check #%s ', retry);
  const ret = await testDB();
  if (ret) {
    initDb();
  } else {
    setTimeout(() => {
      startTestDb(retry + 1);
    }, retry * 1000);
  }
};
startTestDb(0);
