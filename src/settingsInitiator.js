import { common_error, common_warn } from './lib/utils/logUtils';
import { md5 } from './lib/utils/cryptoUtils';

const initSettings = function() {
  let settings = {
    admin: {
      token: undefined,
      tokens: {}
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

  settings.cluster_mode = cluster_mode;

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
    if (!settings.core || !settings.core.token) {
      const adminToken = process.env.ADMIN_TOKEN || false;
      const adminTokens = process.env.ADMIN_TOKENS || false;
      if (adminToken && adminTokens) {
        common_error('ADMIN_TOKEN && ADMIN_TOKENS must not be used together');
        process.exit(2);
      }
      if (adminToken) {
        settings.admin.token = adminToken;
      }
      if (settings.admin.token) {
        settings.admin.tokens[settings.admin.token] = 'admin';
        settings.admin.token = undefined;
      }
      if (adminTokens) {
        settings.admin.tokens = {};
        const _adminTokens = adminTokens.split(',');
        _adminTokens.forEach(_adminToken => {
          let [token, assignee] = _adminToken.split(':');
          if (!assignee) {
            console.warn('[WARN] ADMIN_TOKENS must be in the form: token:assignee. See documentation');
            console.warn('[WARN] We will use md5(token) as assignee');
            assignee = md5(token);
          }
          settings.admin.tokens[token] = assignee;
        });
      } else {
        if (typeof settings.admin.tokens.length === 'number') {
          const adminTokens = {};
          settings.admin.tokens.forEach(_adminToken => {
            let assignee;
            let token;
            if (typeof _adminToken === 'string') {
              console.warn('[WARN] settings.admin.tokens must be an object: { token, assignee }. See documentation');
              console.warn('[WARN] We will use md5(token) as assignee');
              assignee = md5(_adminToken);
              token = _adminToken;
            } else {
              assignee = _adminToken.assignee;
              token = _adminToken.token;
            }
            adminTokens[token] = assignee;
          });
          settings.admin.tokens = adminTokens;
        }
      }
      const clientTokens = process.env.CLIENT_TOKENS || false;
      if (clientTokens) {
        settings.client.tokens = clientTokens.split(',');
      }
    }

    if (process.env.PORT) {
      settings.server.http_port = Number(process.env.PORT);
    } else {
      if (process.env.HTTP_PORT) {
        common_warn('HTTP_PORT is deprecated. Please use PORT instead');
        settings.server.http_port = Number(process.env.HTTP_PORT);
      }
      process.env.PORT = settings.server.http_port;
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

  return settings;
};

export default initSettings;
