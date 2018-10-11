import AccountManager from './AccountManager';

class PermissionManager {
  constructor(db, am) {
    this.db = db;
    if (am) {
      this.am = am;
    } else {
      this.am = new AccountManager(this.db);
    }
  }

  match(user, host) {
    const sql =
      'select distinct public_key from accounts a, keys k, permissions p where a.id = k.account_id and a.id = p.account_id and ? glob p.host and ? glob p.user';
    return new Promise((resolve, reject) => {
      this.db.all(sql, [host, user], (err, rows) => {
        if (err) {
          return reject(err);
        }
        return resolve(rows);
      });
    });
  }

  getAll(account_id, limit, offset) {
    let sql = 'select id, user, host, created_at from permissions where account_id = ? order by created_at ';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, [account_id], (err, rows) => {
        if (err) {
          return reject(err);
        }
        return resolve(rows);
      });
    });
  }

  create(account_id, user, host) {
    const sql = 'insert into permissions (account_id, user, host, created_at) values (?, ?, ?, ?) ';

    return new Promise((resolve, reject) => {
      this.db.run(sql, [account_id, user, host, new Date().getTime()], async err => {
        if (err) {
          reject(err);
          return;
        }
        await this.am.setUpdatedAt(account_id);
        resolve(this.lastID);
      });
    });
  }

  delete(account_id, id) {
    const sql = 'delete from permissions where id = ? and account_id = ?';
    return new Promise((resolve, reject) => {
      this.db.run(sql, [id, account_id], async err => {
        if (err) {
          reject(err);
          return;
        }
        await this.am.setUpdatedAt(account_id);
        resolve(this.changes);
      });
    });
  }
}

export default PermissionManager;
