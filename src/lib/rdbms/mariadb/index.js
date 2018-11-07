import DbManager from '../../managers/DbManager';
import mysql from 'mysql2';


class MariadbManager extends DbManager {
  dbVersion = 5;

  CREATE_TABLE_ACCOUNTS =
    'create table accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, email varchar(128), name varchar(128), ' +
    'active INTEGER, updated_at INTEGER, created_at INTEGER, UNIQUE (email))';

  CREATE_TABLE_GROUPS =
    'create table groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name varchar(128), active INTEGER, ' +
    'updated_at INTEGER, created_at INTEGER, UNIQUE (name))';

  CREATE_TABLE_GROUPS_ACCOUNTS =
    'create table groups_accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
    'account_id INTEGER, ' +
    'group_id INTEGER, ' +
    'updated_at INTEGER, ' +
    'created_at INTEGER, ' +
    'UNIQUE (account_id, group_id), ' +
    'FOREIGN KEY(group_id) REFERENCES groups (id) ON DELETE CASCADE, ' +
    'FOREIGN KEY(account_id) REFERENCES accounts (id) ON DELETE CASCADE)';

  CREATE_TABLE_PUBLIC_KEYS =
    'create table public_keys (id INTEGER PRIMARY KEY AUTOINCREMENT, account_id INTEGER, ' +
    'public_key varchar(1024), created_at INTEGER, ' +
    'FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE)';

  CREATE_TABLE_PERMISSIONS =
    'create table permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
    'account_id INTEGER, ' +
    'group_id INTEGER, ' +
    'user varchar(512), ' +
    'host varchar(512), ' +
    'created_at INTEGER, ' +
    'FOREIGN KEY(group_id) REFERENCES groups (id) ON DELETE CASCADE, ' +
    'FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE)';

  constructor(settings) {
    super(settings);
    const { host, port, username, password, database } = settings;
    const defaultOptions = {
      host: host,
      user: username,
      password,
      database,
      port: port || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
    let options;
    if (settings.options) {
      options = Object.assign(defaultOptions, settings.options);
    } else {
      options = defaultOptions;
    }
    this.db = mysql.createPool(options);
  }

  getEngine() {
    return 'mariadb';
  }

  async createVersionTable() {
    const sqlCreateTable = 'create table _version (value text)';
    try {
      await this.run(sqlCreateTable);
    } catch (e) {
      console.error('Unable to create _version table', err.message);
      throw e;
    }
    try {
      const sqlInsertVersionZero = 'insert into _version values (0)';
      await this.run(sqlInsertVersionZero);
    } catch (e) {
      console.error('Unable to insert 0 version in _version table', err.message);
      throw e;
    }
    return 0;
  }

  all(sql, params) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          return reject(err);
        }
        return resolve(rows);
      });
    });
  }

  get(sql, params) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          return reject(err);
        }
        return resolve(row);
      });
    });
  }

  run(sql, params) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, err => {
        if (err) {
          return reject(err);
        }
        return resolve(true);
      });
    });
  }

  async initDb() {
    await this.run(this.CREATE_TABLE_ACCOUNTS);
    await this.run(this.CREATE_TABLE_PUBLIC_KEYS);
    await this.run(this.CREATE_TABLE_PERMISSIONS);
    await this.run(this.CREATE_TABLE_GROUPS);
    await this.run(this.CREATE_TABLE_GROUPS_ACCOUNTS);
    await this.updateVersion();
  }

  async updateVersion() {
    const sql = 'update _version set value = ' + this.dbVersion;
    return this.run(sql);
  }

  async upgradeDb(fromVersion) {
    if (fromVersion < 2) {
      await this.run(this.CREATE_TABLE_PUBLIC_KEYS);
      const updatePublicKeys =
        'insert into public_keys (id, account_id, public_key, created_at) select id, account_id, public_key, created_at from keys';
      await this.run(updatePublicKeys);
      await this.run('drop table keys');
    }
    if (fromVersion < 3) {
      await this.run(this.CREATE_TABLE_GROUPS);
      await this.run(this.CREATE_TABLE_GROUPS_ACCOUNTS);
    }
    if (fromVersion < 4) {
      await this.run('create table permissions_tmp as select * from permissions');
      await this.run('drop table permissions');
      await this.run(this.CREATE_TABLE_PERMISSIONS);
      await this.run(
        'insert into permissions (id, account_id, user, host, created_at) select id, account_id, user, host, created_at from permissions_tmp'
      );
      await this.run('drop table permissions_tmp');
    }
    if (fromVersion < 5) {
      try {
        await this.run('alter table groups add updated_at integer');
      } catch (err) {}
    }
    await this.updateVersion();
  }

  flushDb() {
    return false;
  }
}

export default MariadbManager;
