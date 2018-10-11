class SqliteManager {
  dbVersion = 1;
  CREATE_TABLE_ACCOUNTS =
    'create table accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, email text, name text, active int, updated_at INTEGER, created_at INTEGER, UNIQUE (email))';
  CREATE_TABLE_KEYS =
    'create table keys (id INTEGER PRIMARY KEY AUTOINCREMENT, account_id INTEGER, public_key text, created_at INTEGER, FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE)';
  CREATE_TABLE_PERMISSIONS =
    'create table permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, account_id INTEGER, user text, host text, created_at INTEGER, FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE)';

  async initDb(db) {
    await this.runSql(db, this.CREATE_TABLE_ACCOUNTS);
    await this.runSql(db, this.CREATE_TABLE_KEYS);
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

  async upgradeDb(db, fromVersion) {}
}

export default SqliteManager;
