import { getRdbmsModule } from '../rdbms/modules';

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
    const sqlCheck = 'select value from _version';
    let currentVersion;
    const client = this.manager.getClient();
    try {
      await client.open();
      this.manager.setClient(client);
    } catch (e) {
      console.error('checkDb failed', e.message);
      console.error(e);
      process.exit(99);
    }
    try {
      const row = await client.get(sqlCheck);
      currentVersion = row.value;
    } catch (e) {
      currentVersion = false;
    }
    console.log('Check db: currentVersion %s targetVersion %s', currentVersion, this.manager.dbVersion);
    try {
      if (currentVersion === false) {
        currentVersion = await this.manager.createVersionTable();
      }
      if (currentVersion === 0) {
        const ret = await this.manager.initDb();
        await client.close();
        return ret;
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
      console.error('checkDb failed', e.message);
      console.error(e);
      process.exit(99);
    }
  }

  async _flush() {
    let done;
    try {
      done = await this.manager.flushDb();
      console.log('Flushed db!');
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
    return false;
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
