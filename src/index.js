import './appenv';
import packageJson from '../package';
import AppHelper from './lib/helpers/AppHelper';

import DbHelper from './lib/helpers/DbHelper';
import { loadPlugins } from './lib/helpers/PluginHelper';
import { common_debug, common_error, common_info, common_warn, initLogger } from './lib/utils/logUtils';

import TheoServer from './theoserver';
import initCache from './cacheInitiator';
import initSettings from './settingsInitiator';

initLogger();

const { DB_CONN_MAX_RETRY: _DB_CONN_MAX_RETRY } = process.env;
const DB_CONN_MAX_RETRY =
  typeof _DB_CONN_MAX_RETRY !== 'undefined' && !isNaN(_DB_CONN_MAX_RETRY) ? Number(_DB_CONN_MAX_RETRY) : 10;

process.on('SIGINT', async () => {
  console.log('Caught interrupt signal');
  if (theoServer) {
    try {
      await theoServer.stop();
    } catch (e) {
      console.error('Failed to stop server', e.message);
    }
  }
  if (dh) {
    try {
      dh.close();
    } catch (e) {
      console.error('Failed to close db', e);
    }
  }
  process.exit();
});

const settings = initSettings();

let subscribe_core_token = false;

if (settings.core) {
  common_info(' !!! INFO !!! ');
  common_info(' Using core mode ');
  common_info(' !!! INFO !!! \n');
  if (settings.cache && settings.cache.type === 'redis') {
    if (settings.cluster_mode === '1') {
      subscribe_core_token = true;
    }
  }
} else if (!settings.admin.token && settings.admin.tokens.length === 0 && settings.client.tokens.length === 0) {
  common_warn(' !!! WARNING !!!');
  common_warn(' No admin token nor client tokens found ');
  common_warn(' !!! WARNING !!!');
}

if (process.env.MODE !== 'test') {
  console.log(`

          _   _   ___   _____
         | | | | |  _| |  _  |
   ______| |_| |_| |___| | | |
 (_)_   _   _   _   ___  | | |
     | | | | | | | |_  | |_| |
     |_| |_| |_| |___| |_____|v${packageJson.version}

`);
  common_info('Theo starts');
}
const ah = AppHelper(settings);
if (process.env.LOAD_PLUGINS) {
  loadPlugins(process.env.LOAD_PLUGINS).catch(e => console.error('Failed to load plugins!', e.message));
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
const initDb = async () => {
  try {
    await dh.init();
    common_info('Db %s initiated', dm.getEngine());
    if (settings.core && settings.core.token) {
      // Load tokens..
      let client;
      try {
        client = dm.getClient();
        await client.open();
        await ah.loadAuthTokens(client);
      } catch (e) {
        common_error('Unable to load auth tokens... bye bye %s', e.message);
        console.error(e);
        process.exit(4);
      } finally {
        if (client) {
          client.close();
        }
      }
    }
    startServer();
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
    throw e;
  }
};

initCache(subscribe_core_token, dm, ah);

let theoServer;

const startServer = () => {
  // Theo server
  theoServer = new TheoServer(process.env, dm);
  theoServer
    .start()
    .then(() => {
      common_info('Theo Server started, listening on :%s', settings.server.http_port);
    })
    .catch(err => console.error('Uops...', err.message));
};

const startTestDb = async retry => {
  if (retry >= DB_CONN_MAX_RETRY) {
    common_error("Givin' it up, failed to connect to db after %s retries", DB_CONN_MAX_RETRY);
    process.exit(90);
  }
  common_debug('DB Connection check #%s ', retry);
  try {
    await testDB();
    initDb().catch(e => {
      common_error(util.format('Failed to execute initDB', e.message));
      process.exit(80);
    });
  } catch (e) {
    const nextRetry = retry + 1;
    const to = Math.min(nextRetry * nextRetry * 50, 15000);
    common_error('DB ERROR: %s. Retrying in %d ms', e.message, to);

    setTimeout(() => {
      startTestDb(nextRetry).finally();
    }, to);
  }
};

if (settings.cluster_mode === '1') {
  const timeout = Math.round(Math.random() * 2000);
  common_debug('CLUSTER_MODE: waiting %s ms to start node', timeout);
  setTimeout(function() {
    startTestDb(0).finally();
  }, timeout);
} else {
  startTestDb(0).finally();
}
