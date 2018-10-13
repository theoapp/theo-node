import sqlite3 from 'sqlite3';

let _instance;

class SqliteHelper {
  constructor(settings, sqliteManager) {
    this.sqliteManager = sqliteManager;
    this.db = new sqlite3.Database(settings.path);
    this.db.run('PRAGMA foreign_keys = ON');
  }

  async init() {
    try {
      await this.checkDb();
    } catch (e) {
      throw e;
    }
  }

  getDb() {
    return this.db;
  }

  closeDb() {
    this.db.close();
  }

  checkDb() {
    const sqlCheck = 'select value from _version';
    return new Promise((resolve, reject) => {
      this.db.get(sqlCheck, (err, row) => {
        if (err) {
          return resolve(false);
        }
        return resolve(row.value);
      });
    })
      .then(version => {
        if (version === false) {
          return this._createTableVersion();
        }
        return version;
      })
      .then(version => {
        if (version === 0) {
          return this._initDb();
        }
        if (this.sqliteManager.dbVersion === version) {
          return Promise.resolve(true);
        }
        if (this.sqliteManager.dbVersion > version) {
          return this._upgradeDb(version);
        }
      })
      .catch(error => {
        console.error('checkDb failed', error.message);
        process.exit(99);
      });
  }

  async _createTableVersion() {
    const sqlCreateTable = 'create table _version (value text)';
    return new Promise((resolve, reject) => {
      this.db.run(sqlCreateTable, err => {
        if (err) {
          console.error('Unable to create _version table', err.message);
          return reject(err);
        }
        this.db.run('insert into _version values (0)', err => {
          if (err) {
            console.error('Unable to insert 0 version in _version table', err.message);
            return reject(err);
          }
          return resolve(0);
        });
      });
    });
  }

  _updateVersion() {
    const sql = 'update _version set value = ' + this.sqliteManager.dbVersion;
    return this.sqliteManager.runSql(this.db, sql);
  }

  _initDb() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.sqliteManager.initDb(this.db);
        return this._updateVersion();
      } catch (err) {
        reject(err);
      }
    });
  }

  _upgradeDb(version) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.sqliteManager.upgradeDb(this.db, version);
        return this._updateVersion();
      } catch (err) {
        reject(err);
      }
    });
  }

}

const getInstance = (settings, sqliteManager) => {
  if (!_instance) {
    if (!sqliteManager) {
      throw Error('You need to pass a sqliteManager object to initialize SqliteHelper');
    }
    _instance = new SqliteHelper(settings, sqliteManager);
    _instance.init();
  }
  return _instance;
};

export default getInstance;

export const releaseSHInstance = () => {
  _instance = null;
};
