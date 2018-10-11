import KeyManager from './KeyManager';
import PermissionManager from './PermissionManager';

class AccountManager {
  constructor(db) {
    this.db = db;
  }

  getAll(limit, offset) {
    let sql = 'select id, email, name, active from accounts order by name';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, (err, rows) => {
        if (err) {
          return reject(err);
        }
        return resolve(rows);
      });
    });
  }

  async getFull(id) {
    const account = await this.get(id);
    const km = new KeyManager(this.db);
    account.public_keys = await km.getAll(id);
    const pm = new PermissionManager(this.db);
    account.permissions = await pm.getAll(id);
    return account;
  }

  get(id) {
    const sql = 'select id, name, email, active from accounts where id = ? ';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          return reject(err);
        }
        if (!row) {
          return reject(new Error('Account not found'));
        }
        return resolve(row);
      });
    });
  }

  create(account) {
    const sql = 'insert into accounts (email, name, active, created_at) values (?, ?, 1 , ?) ';

    return new Promise((resolve, reject) => {
      this.db.run(sql, [account.email, account.name, new Date().getTime()], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      });
    });
  }

  changeStatus(id, active) {
    const sql = 'update accounts set active = ?, updated_at = ? where id = ? ';
    active = !!active;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [active, new Date().getTime(), id], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);
      });
    });
  }

  setUpdatedAt(id) {
    const sql = 'update accounts set updated_at = ? where id = ? ';
    return new Promise((resolve, reject) => {
      this.db.run(sql, [new Date().getTime(), id], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);
      });
    });
  }

  delete(id) {
    const sql = 'delete from accounts where id = ? ';
    return new Promise((resolve, reject) => {
      this.db.run(sql, [id], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);
      });
    });
  }
}

export default AccountManager;
