import dotenv from 'dotenv';
import restify from 'restify';
import AppHelper from './lib/helpers/AppHelper';
import SqliteHelper from './lib/helpers/SqliteHelper';
import CacheHelper from './lib/helpers/CacheHelper';
import SqliteManager from './lib/managers/SqliteManager';
import { initRoutes } from './routes';
import { authMiddleware } from './lib/middlewares/AuthMiddleware';
import packageJson from '../package';

dotenv.config();

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
    sqlite: {
      path: './data/theo.db'
    },
    server: {
      http_port: 9100
    }
  };
}

const setEnv = () => {
  const sqlite_path = process.env.DATA_PATH || false;
  if (sqlite_path) {
    settings.sqlite.path = sqlite_path;
  }
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
};

setEnv();

const ah = AppHelper(settings);

const ch = CacheHelper(ah.getSettings('cache'));
const cm = ch.getManager();
if (cm) {
  cm.flush().catch(er => {
    console.error('Failed to initialize CacheManager', er.message);
  });
}

const sm = new SqliteManager();
const sh = SqliteHelper(settings.sqlite, sm);

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

server.use((req, res, next) => {
  req.db = sh.getDb();
  next();
});

initRoutes(server);
server.listen(settings.server.http_port, function() {
  console.log('%s listening at %s', server.name, server.url);
});
