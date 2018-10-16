class SqliteManager {
  dbVersion = 2;
  CREATE_TABLE_ACCOUNTS =
    'create table accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, email varchar(128), name varchar(128), active INTEGER, updated_at INTEGER, created_at INTEGER, UNIQUE (email))';
  CREATE_TABLE_PUBLIC_KEYS =
    'create table public_keys (id INTEGER PRIMARY KEY AUTOINCREMENT, account_id INTEGER, public_key varchar(1024), created_at INTEGER, FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE)';
  CREATE_TABLE_PERMISSIONS =
    'create table permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, account_id INTEGER, user varchar(512), host varchar(512), created_at INTEGER, FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE)';

  async initDb(db) {
    await this.runSql(db, this.CREATE_TABLE_ACCOUNTS);
    await this.runSql(db, this.CREATE_TABLE_PUBLIC_KEYS);
    await this.runSql(db, this.CREATE_TABLE_PERMISSIONS);
  }

  allSql(db, sql, params) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          return reject(err);
        }
        return resolve(rows);
      });
    });
  }

  getSql(db, sql, params) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          return reject(err);
        }
        return resolve(row);
      });
    });
  }

  runSql(db, sql, params) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, err => {
        if (err) {
          return reject(err);
        }
        return resolve(true);
      });
    });
  }

  async upgradeDb(db, fromVersion) {
    if (fromVersion < 2) {
      await this.runSql(db, this.CREATE_TABLE_PUBLIC_KEYS);
      const updatePublicKeys =
        'insert into public_keys (id, account_id, public_key, created_at) select id, account_id, public_key, created_at from keys';
      await this.runSql(db, updatePublicKeys);
      await this.runSql(db, 'drop table keys');
    }
  }
}

export default SqliteManager;
