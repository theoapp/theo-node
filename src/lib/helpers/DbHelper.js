import EventHelper from './EventHelper';
import { getRdbmsModule } from '../rdbms/modules';
import { common_error, common_info } from '../utils/logUtils';

let _instance;

class DbHelper {
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

  async init() {
    try {
      await this.checkDb();
    } catch (e) {
      throw e;
    }
  }

  async checkDb() {
    let currentVersion;
    const client = this.manager.getClient();
    try {
      await client.open();
      this.manager.setClient(client);
    } catch (e) {
      common_error('checkDb failed %s', e.message);
      console.error(e);
      process.exit(99);
    }
    try {
      const row = await this.manager.getCurrentVersion();
      currentVersion = row.value;
    } catch (e) {
      common_error('Failed to read current version: ', e.message);
      currentVersion = false;
    }
    common_info('Check db: currentVersion %s targetVersion %s', currentVersion, this.manager.dbVersion);

    if (currentVersion === false) {
      try {
        currentVersion = await this.manager.createVersionTable();
      } catch (err) {
        // Concurrent creation..
        await client.close();
        return true;
      }
    }

    try {
      if (currentVersion === 0) {
        const ret = await this.manager.initDb();
        await client.close();
        return ret;
      }
      if (currentVersion < 0) {
        const cluster_mode = process.env.CLUSTER_MODE || '0';
        if (cluster_mode === '1') {
          // Some other nodes are creating the tables..
          await client.close();
          return false;
        }
      }
      if (this.manager.dbVersion === currentVersion) {
        await client.close();
        return true;
      }
      if (this.manager.dbVersion > currentVersion) {
        const ret = await this.manager.upgradeDb(currentVersion);
        await client.close();
        return ret;
      }
    } catch (e) {
      common_error('checkDb failed %s', e.message);
      console.error(e);
      process.exit(99);
    }
  }

  async _flush() {
    let done;
    try {
      done = await this.manager.flushDb();
      if (done) EventHelper.emit('theo:flushdb');
    } catch (e) {
      throw e;
    }
    if (done) {
      try {
        await this.checkDb();
        return true;
      } catch (e) {
        console.error('Failed to check db', e);
        throw e;
      }
    } else {
      throw new Error('Unable to flush db');
    }
  }

  close() {
    this.manager.close();
  }
}

const getInstance = settings => {
  if (!_instance) {
    _instance = new DbHelper(settings);
  }
  return _instance;
};

export const loadDbManager = function() {
  const dh = getInstance();
  const dm = dh.getManager();
  if (!dm) {
    return false;
  }
  return dm;
};

export const releaseDHInstance = () => {
  if (_instance !== null) {
    _instance.close();
  }
  _instance = null;
};

export default getInstance;
