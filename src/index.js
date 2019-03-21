import dotenv from 'dotenv';
import restify from 'restify';
import AppHelper from './lib/helpers/AppHelper';
import CacheHelper from './lib/helpers/CacheHelper';
import DbHelper from './lib/helpers/DbHelper';
import { loadPlugins } from './lib/helpers/PluginHelper';
import { initRoutes } from './routes';
import { authMiddleware } from './lib/middlewares/AuthMiddleware';
import packageJson from '../package';
import EventHelper from './lib/helpers/EventHelper';
import { common_debug, common_error, common_info, common_warn, initLogger } from './lib/utils/logUtils';

dotenv.config();

initLogger();

const DB_CONN_MAX_RETRY = 15;

let settings = {
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
  },
  keys: {
    sign: false
  }
};

const settingsJson = process.env.SETTINGS_FILE;
if (settingsJson) {
  const _settings = require(settingsJson);
  settings = Object.assign({}, settings, _settings);
}

const cluster_mode = process.env.CLUSTER_MODE || '0';

const setDbEnv = () => {
  if (process.env.DB_ENGINE) {
    settings.db.engine = process.env.DB_ENGINE;
  }
  if (settings.db.engine === 'sqlite') {
    if (cluster_mode === '1') {
      common_error('DB ERROR! Engine mariadb/mysql is required for CLUSTER_MODE');
      process.exit(1);
    }
    if (process.env.DB_STORAGE) {
      settings.db.storage = process.env.DB_STORAGE;
    } else {
      const sqlite_path = process.env.DATA_PATH || false;
      if (sqlite_path) {
        console.warn('DB WARNING! DATA_PATH has been deprecated, please use DB_STORAGE');
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
  const coreToken = process.env.CORE_TOKEN || false;
  if (coreToken) {
    settings.core = {
      token: coreToken
    };
  }
  if (!settings.core || settings.core.token) {
    const adminToken = process.env.ADMIN_TOKEN || false;
    if (adminToken) {
      settings.admin.token = adminToken;
    }
    const clientTokens = process.env.CLIENT_TOKENS || false;
    if (clientTokens) {
      settings.client.tokens = clientTokens.split(',');
    }
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
  const keySign = process.env.REQUIRE_SIGNED_KEY || '0';
  if (keySign === '1') {
    settings.keys.sign = true;
  }
  setDbEnv();
};

setEnv();

let subscribe_core_token = false;

if (settings.core) {
  common_info(' !!! INFO !!! ');
  common_info(' Using core mode ');
  common_info(' !!! INFO !!! \n');
  if (settings.cache && settings.cache.type === 'redis') {
    if (cluster_mode === '1') {
      subscribe_core_token = true;
    }
  }
} else if (!settings.admin.token && settings.client.tokens.length === 0) {
  common_warn('\n !!! WARNING !!! ');
  common_warn(' No admin token nor client tokens found ');
  common_warn(' !!! WARNING !!! \n');
}

if (process.env.MODE !== 'test') {
  console.log(`
          _   _   ___   _____
         | | | | |  _| |  _  |
    _____| |_| |_| |___| | | |
   0_   _   _   _   ___  | | |
     | | | | | | | |_  | |_| |
     |_| |_| |_| |___| |_____|

`);
  common_info('Theo starts');
}
const ah = AppHelper(settings);
if (process.env.LOAD_PLUGINS) {
  loadPlugins(process.env.LOAD_PLUGINS);
}
let dh;
let dm;
try {
  dh = DbHelper(ah.getSettings('db'));
  dm = dh.getManager();
  if (!dm) {
    common_error('Unable to load DB Manager!!!');
    process.exit(99);
  }
} catch (e) {
  common_error('Failed to load DB Manager!!! %s', e.message);
  console.error(e);
  process.exit(99);
}
const initDb = () => {
  try {
    dh.init()
      .then(async () => {
        common_info('Db %s initiated', dm.getEngine());
        if (settings.core && settings.core.token) {
          // Load tokens..
          try {
            const client = dm.getClient();
            await client.open();
            await ah.loadAuthTokens(client);
          } catch (e) {
            common_error('Unable to load auth tokens... bye bye %s', e.message);
            console.error(e);
            process.exit(4);
          }
        }
        startServer();
      })
      .catch(e => {
        common_error('Failed to initialize db %s', e.message);
        console.error(e);
        process.exit(99);
      });
  } catch (e) {
    common_error('Failed to load DB Manager!!! %s', e.message);
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
    if (e.code && e.code === 'ER_NOT_SUPPORTED_AUTH_MODE') {
      common_error('This mysql client does not support server version.');
      process.exit(91);
    }
    console.error('testDB err', e);
    return false;
  }
};
const redisSubscribe = () => {
  return new Promise(async (resolve, reject) => {
    const client = await cm.open();
    client.on('message', async (channel, message) => {
      if (message === 'flush_tokens') {
        console.log('Flushing tokens!');
        const client = dm.getClient();
        await client.open();
        await ah.loadAuthTokens(client);
      }
    });
    client.subscribe('core_tokens');
  });
};
let ch;
let cm;
try {
  ch = CacheHelper(ah.getSettings('cache'));
} catch (err) {
  common_error('Unable to create CacheHelper %s', err.message);
}
if (ch) {
  cm = ch.getManager();
  if (cm) {
    if (!subscribe_core_token) {
      common_info('Flushing CacheManager');
      cm.flush().catch(er => {
        common_error('Failed to initialize CacheManager: %s', er.message);
      });
    } else {
      redisSubscribe().finally();
    }
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
  server.use(requestLogger);
  server.use(authMiddleware);
  server.use(async (req, res, next) => {
    const client = dm.getClient();
    try {
      await client.open();
    } catch (err) {
      // Ops..
      res.status(500);
      res.json({ status: 500, reason: 'A problem occured, please retry' });
      return;
    }
    req.db = client;
    res.on('finish', () => {
      client.close();
    });
    next();
  });
  initRoutes(server);
  server.listen(settings.server.http_port, function() {
    common_info('%s listening at %s', server.name, server.url);
  });
};
const requestLogger = function(req, res, next) {
  const startAt = new Date();
  const weblog = {
    data: startAt,
    userAgent: req.header('User-Agent'),
    url: req.url,
    method: req.method,
    component: 'web'
  };
  const { connection } = req;
  const { end } = res;
  req.log = weblog;
  req.dontLog = false;
  res.end = function(chunk, encoding) {
    const endAt = new Date();
    res.end = end;
    res.end(chunk, encoding);
    if (!req.dontLog) {
      weblog.client = connection.remoteAddress;
      weblog.responseStatus = res.statusCode;
      weblog.executionTime = endAt.getTime() - startAt.getTime();
      const done = EventHelper.emit('theo:http-request', weblog, req, res);
      if (!done) {
        return console.info(JSON.stringify(weblog));
      }
      return done;
    }
  };
  setImmediate(next);
};
process.on('SIGINT', async () => {
  common_debug('Caught interrupt signal');
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
    common_error("Givin' it up, failed to connect to db after %s retries", DB_CONN_MAX_RETRY);
    process.exit(90);
  }
  common_debug('DB Connection check #%s ', retry);
  const ret = await testDB();
  if (ret) {
    initDb();
  } else {
    setTimeout(() => {
      startTestDb(retry + 1).finally();
    }, retry * 1000);
  }
};
if (cluster_mode === '1') {
  const timeout = parseInt(Math.random() * 1000);
  common_debug('CLUSTER_MODE: waiting %s ms to start node', timeout);
  setTimeout(function() {
    startTestDb(0).finally();
  }, timeout);
} else {
  startTestDb(0).finally();
}
