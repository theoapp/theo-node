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

import EventHelper from './EventHelper';
import { getRdbmsModule } from '../rdbms/modules';
import { setTimeout } from 'node:timers/promises';
import { getLogger } from '@fluidware-it/saddlebag';

let _instance;

class DbHelper {
  settings;

  manager;

  constructor(settings) {
    if (!settings) {
      throw new Error('DbHelper() needs settings.db');
    }
    if (!settings.engine) {
      throw new Error('DbHelper() needs settings.db.engine');
    }
    this.settings = settings;
  }

  getManager() {
    if (!this.manager) {
      const ManagerClass = getRdbmsModule(this.settings.engine);
      if (!ManagerClass) {
        throw new Error('Invalid rdbms module ' + this.settings.engine);
      }
      this.manager = new ManagerClass(this.settings);
    }
    return this.manager;
  }

  async init(client) {
    const gotClient = !!client;
    try {
      if (!client) {
        client = this.manager.getClient();
        await client.open();
      }
      await this.checkDb(client);
    } finally {
      if (!gotClient && client) {
        try {
          await client.close();
        } catch (_e) {
          //
        }
      }
    }
  }

  async checkDb(client) {
    let currentVersion;
    try {
      const serverVersion = await client.getServerVersion();
      getLogger().info('Db Version %s', serverVersion);
      this.manager.setClient(client);
    } catch (e) {
      getLogger().error('checkDb failed %s', e.message);
      process.exit(99);
    }
    try {
      const row = await this.manager.getCurrentVersion();
      if (row === false) {
        currentVersion = -999;
      } else if (row) {
        currentVersion = row.value;
      }
    } catch (e) {
      getLogger().error({ error_message: e.message }, 'Failed to read current version, exiting');
      process.exit(92);
    }

    getLogger().info('Check db: currentVersion %s targetVersion %s', currentVersion, this.manager.dbVersion);

    if (currentVersion === -999) {
      try {
        currentVersion = await this.manager.createVersionTable();
      } catch (e) {
        if (e.code === 'ER_TABLE_EXISTS_ERROR') {
          await setTimeout(2000);
          return this.checkDb(client);
        } else {
          getLogger().error('Unable to create _version table: [%s] %s', e.code, e.message);
          process.exit(90);
        }
      }
    } else if (currentVersion < 0) {
      getLogger().error('Db in initialization, exiting');
      process.exit(91);
    }

    try {
      if (currentVersion === 0) {
        await this.manager.initDb();
        getLogger().info('Db created');
        return true;
      }
      if (this.manager.dbVersion === currentVersion) {
        return true;
      }
      if (this.manager.dbVersion > currentVersion) {
        await this.manager.upgradeDb(currentVersion);
        getLogger().info('Db updated to %s', this.manager.dbVersion);
        return true;
      }
    } catch (e) {
      getLogger().fatal(e, '!!!!!!!! FATAL ERROR !!!!!!!! checkDb failed');
      process.exit(96);
    }
    return true;
  }

  async _flush(client) {
    const done = await this.manager.flushDb(client);
    if (done) {
      EventHelper.emit('theo:flushdb');
      try {
        await this.checkDb(client);
        getLogger().debug('check db done');
        return true;
      } catch (e) {
        getLogger().error(e, 'Failed to check db');
        throw e;
      }
    } else {
      throw new Error('Unable to flush db');
    }
  }

  close() {
    return this.manager.close();
  }
}

const getInstance = settings => {
  if (!_instance) {
    _instance = new DbHelper(settings);
  }
  return _instance;
};

export const releaseDHInstance = async () => {
  if (_instance !== null) {
    await _instance.close();
  }
};

export default getInstance;
