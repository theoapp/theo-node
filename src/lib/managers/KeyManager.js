import AccountManager from './AccountManager';

class KeyManager {
  constructor(db, am) {
    this.db = db;
    if (am) {
      this.am = am;
    } else {
      this.am = new AccountManager(this.db);
    }
  }

  getAll(account_id, limit, offset) {
    let sql = 'select id, public_key, created_at from keys where account_id = ? order by created_at ';
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

  create(account_id, key) {
    const sql = 'insert into keys (account_id, public_key, created_at) values (?, ?, ?) ';

    return new Promise((resolve, reject) => {
      const am = this.am;
      this.db.run(sql, [account_id, key, new Date().getTime()], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        await am.setUpdatedAt(account_id);
        resolve(this.lastID);
      });
    });
  }

  delete(account_id, id) {
    const sql = 'delete from keys where id = ? and account_id = ?';
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

export default KeyManager;
