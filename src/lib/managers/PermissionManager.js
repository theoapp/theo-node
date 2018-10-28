import AccountManager from './AccountManager';
import GroupManager from './GroupManager';

class PermissionManager {
  constructor(db) {
    this.db = db;
    this.am = new AccountManager(this.db);
    this.gm = new GroupManager(this.db);
  }

  match(user, host) {
    const sql =
      'select k.public_key, k.account_id account_id ' +
      ' from accounts a, public_keys k, permissions p ' +
      'where ? like p.host and ? like p.user ' +
      'and a.active = 1 ' +
      'and a.id = k.account_id ' +
      'and a.id = p.account_id ' +
      ' union ' +
      'select k.public_key, k.account_id account_id ' +
      ' from accounts a, public_keys k, permissions p, groups g, groups_accounts ga ' +
      'where ' +
      '? like p.host and ? like p.user ' +
      'and g.active = 1 ' +
      'and g.id = p.group_id ' +
      'and g.id = ga.group_id ' +
      'and a.active = 1 ' +
      'and a.id = ga.account_id ' +
      'and a.id = k.account_id ' +
      'order by k.account_id asc';

    return new Promise((resolve, reject) => {
      this.db.all(sql, [host, user, host, user], (err, rows) => {
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

  getAllGroup(group_id, limit, offset) {
    let sql = 'select id, user, host, created_at from permissions where group_id = ? order by created_at ';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, [group_id], (err, rows) => {
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
      const am = this.am;
      this.db.run(sql, [account_id, user, host, new Date().getTime()], async function(err) {
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
    const sql = 'delete from permissions where id = ? and account_id = ?';
    const am = this.am;
    return new Promise((resolve, reject) => {
      this.db.run(sql, [id, account_id], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        await am.setUpdatedAt(account_id);
        resolve(this.changes);
      });
    });
  }

  createGroup(group_id, user, host) {
    const sql = 'insert into permissions (group_id, user, host, created_at) values (?, ?, ?, ?) ';
    return new Promise((resolve, reject) => {
      const gm = this.gm;
      this.db.run(sql, [group_id, user, host, new Date().getTime()], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        await gm.setUpdatedAt(group_id);
        resolve(this.lastID);
      });
    });
  }

  deleteGroup(group_id, id) {
    const sql = 'delete from permissions where id = ? and group_id = ?';
    return new Promise((resolve, reject) => {
      this.db.run(sql, [id, group_id], async err => {
        if (err) {
          reject(err);
          return;
        }
        await this.gm.setUpdatedAt(group_id);
        resolve(this.changes);
      });
    });
  }
}

export default PermissionManager;
