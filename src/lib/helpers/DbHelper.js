import EventHelper from './EventHelper';
import { getRdbmsModule } from '../rdbms/modules';
import { common_debug, common_error, common_info } from '../utils/logUtils';

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
    let client;
    try {
      client = this.manager.getClient();
      await client.open();
      await this.checkDb(client);
    } finally {
      try {
        if (client) {
          client.close();
        }
      } catch (e) {
        //
      }
    }
  }

  async checkDb(client) {
    let currentVersion;
    try {
      const dbversion = await client.getServerVersion();
      common_info('Db Version', dbversion);
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
        return true;
      }
    }

    try {
      if (currentVersion === 0) {
        return this.manager.initDb();
      }
      if (currentVersion < 0) {
        const cluster_mode = process.env.CLUSTER_MODE || '0';
        if (cluster_mode === '1') {
          // Some other nodes are creating the tables..
          return false;
        }
      }
      if (this.manager.dbVersion === currentVersion) {
        return true;
      }
      if (this.manager.dbVersion > currentVersion) {
        return this.manager.upgradeDb(currentVersion);
      }
    } catch (e) {
      common_error('checkDb failed %s', e.message);
      console.error(e);
      process.exit(99);
    }
    return true;
  }

  async _flush(client) {
    const done = await this.manager.flushDb();
    if (done) {
      EventHelper.emit('theo:flushdb');
      try {
        await this.checkDb(client);
        common_debug('check db done');
        return true;
      } catch (e) {
        common_error('Failed to check db', e);
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
