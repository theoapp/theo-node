// Copyright 2019 AuthKeys srl
// Copyright 2023 Fluidware srl
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import './appenv';
import { DB_CONN_MAX_RETRY as _DB_CONN_MAX_RETRY, LOAD_PLUGINS, LOG_LEVEL, MODE } from './const';
import packageJson from '../package';
import AppHelper from './lib/helpers/AppHelper';
import DbHelper from './lib/helpers/DbHelper';
import { loadPlugins } from './lib/helpers/PluginHelper';

import TheoServer from './theoserver';
import initCache from './cacheInitiator';
import initSettings from './settingsInitiator';
import { getLogger } from '@fluidware-it/saddlebag';

if (LOG_LEVEL) {
  getLogger().level = LOG_LEVEL.toLowerCase();
}

const DB_CONN_MAX_RETRY =
  typeof _DB_CONN_MAX_RETRY !== 'undefined' && !isNaN(_DB_CONN_MAX_RETRY) ? Number(_DB_CONN_MAX_RETRY) : 10;

process.on('SIGINT', async () => {
  getLogger().info('Caught interrupt signal');
  if (theoServer) {
    try {
      await theoServer.stop();
    } catch (e) {
      getLogger().error({ error_message: e.message }, 'Failed to stop server');
    }
  }
  if (dh) {
    try {
      dh.close();
    } catch (e) {
      getLogger().error(e, 'Failed to close db');
    }
  }
  process.exit();
});

const settings = initSettings();

let subscribe_core_token = false;

if (settings.core) {
  getLogger().info('Using core mode');
  if (settings.cache && settings.cache.type === 'redis') {
    if (settings.cluster_mode) {
      subscribe_core_token = true;
    }
  }
}

if (MODE !== 'test') {
  process.stdout.write(`

          _   _   ___   _____
         | | | | |  _| |  _  |
   ______| |_| |_| |___| | | |
 (_)_   _   _   _   ___  | | |
     | | | | | | | |_  | |_| |
     |_| |_| |_| |___| |_____|v${packageJson.version}

`);
  getLogger().info('Theo starts');
}
const ah = AppHelper(settings);
if (LOAD_PLUGINS) {
  loadPlugins(LOAD_PLUGINS).catch(e => getLogger().error({ error_message: e.message }, 'Failed to load plugins!'));
}
let dh;
let dm;
try {
  dh = DbHelper(ah.getSettings('db'));
  dm = dh.getManager();
  if (!dm) {
    getLogger().error('Unable to load DB Manager!!!');
    process.exit(99);
  }
} catch (e) {
  getLogger().error(e, 'Failed to load DB Manager!!!');
  process.exit(99);
}
const initDb = async () => {
  try {
    await dh.init();
    getLogger().info('Db %s initiated', dm.getEngine());
    if (settings.core && settings.core.token) {
      // Load tokens..
      let client;
      try {
        client = dm.getClient();
        await client.open();
        await ah.loadAuthTokens(client, true);
      } catch (e) {
        getLogger().error(e, 'Unable to load auth tokens... bye bye');
        process.exit(4);
      } finally {
        if (client) {
          client.close();
        }
      }
    }
    startServer();
  } catch (e) {
    getLogger().error(e, 'Failed to load DB Manager!!!');
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
      getLogger().error('This mysql client does not support server version.');
      process.exit(91);
    }
    throw e;
  }
};

initCache(subscribe_core_token, dm, ah);

let theoServer;

const startServer = () => {
  // Theo server
  theoServer = new TheoServer(settings.server.http_port, dm);
  theoServer
    .start()
    .then(() => {
      getLogger().info('Theo Server started, listening on :%s', settings.server.http_port);
    })
    .catch(err => {
      getLogger().error(err, 'Failed to start server');
      process.exit(1);
    });
};

const startTestDb = async retry => {
  if (retry >= DB_CONN_MAX_RETRY) {
    getLogger().error("Givin' it up, failed to connect to db after %s retries", DB_CONN_MAX_RETRY);
    process.exit(90);
  }
  getLogger().debug('DB Connection check #%s', retry);
  try {
    await testDB();
    initDb().catch(e => {
      getLogger().error({ error_message: e.message }, 'Failed to execute initDB');
      process.exit(80);
    });
  } catch (e) {
    const nextRetry = retry + 1;
    const to = Math.min(nextRetry * nextRetry * 50, 15000);
    getLogger().error('DB ERROR: %s. Retrying in %d ms', e.message, to);

    setTimeout(() => {
      startTestDb(nextRetry).finally();
    }, to);
  }
};

if (settings.cluster_mode) {
  const timeout = Math.round(Math.random() * 2000);
  getLogger().debug('CLUSTER_MODE: waiting %s ms to start node', timeout);
  setTimeout(function () {
    startTestDb(0).finally();
  }, timeout);
} else {
  startTestDb(0).finally();
}
