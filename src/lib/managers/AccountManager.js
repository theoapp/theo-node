import KeyManager from './KeyManager';
import PermissionManager from './PermissionManager';
import GroupAccountManager from './GroupAccountManager';
import BaseCacheManager from './BaseCacheManager';

const MAX_ROWS = 100;

class AccountManager extends BaseCacheManager {
  getAllCount(where = false, whereArgs = []) {
    const sql = 'select count(*) total from accounts ' + (where || '');
    return new Promise((resolve, reject) => {
      this.db.get(sql, whereArgs, (err, row) => {
        if (err) {
          return reject(err);
        }
        return resolve(row.total);
      });
    });
  }

  async getAll(limit = 10, offset = 0) {
    if (limit > MAX_ROWS) {
      limit = MAX_ROWS;
    }
    if (!limit || limit < 1) {
      limit = 10;
    }
    if (!offset || offset < 0) {
      offset = 0;
    }
    const total = await this.getAllCount();
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
        const ret = {
          rows,
          limit,
          offset,
          total
        };
        return resolve(ret);
      });
    });
  }

  async search(name, email, limit = 10, offset = 0) {
    if (limit > MAX_ROWS) {
      limit = MAX_ROWS;
    }
    if (!limit || limit < 1) {
      limit = 10;
    }
    if (!offset || offset < 0) {
      offset = 0;
    }
    let where = '';
    let whereArgs = [];
    if (name && email) {
      where = 'where name like ? and email like ?';
      whereArgs.push(`%${name}%`);
      whereArgs.push(`%${email}%`);
    } else if (name) {
      where = 'where name like ?';
      whereArgs.push(`%${name}%`);
    } else if (email) {
      where = 'where email like ?';
      whereArgs.push(`%${email}%`);
    }
    const total = await this.getAllCount(where, whereArgs);
    let sql = 'select id, email, name, active from accounts ' + where + ' order by name';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    return new Promise((resolve, reject) => {
      this.db.all(sql, whereArgs, (err, rows) => {
        if (err) {
          return reject(err);
        }
        const ret = {
          rows,
          limit,
          offset,
          total
        };
        return resolve(ret);
      });
    });
  }

  async getFullByEmail(email) {
    const account = await this.getByEmail(email);
    return this.getFull(account.id);
  }

  async getFull(id) {
    const account = await this.get(id);
    const km = new KeyManager(this.db);
    account.public_keys = await km.getAll(id);
    const pm = new PermissionManager(this.db);
    account.permissions = await pm.getAll(id);
    const gam = new GroupAccountManager(this.db);
    account.groups = await gam.getAllByAccount(id);
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

  getByEmail(email) {
    const sql = 'select id, name, email, active from accounts where email = ? ';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [email], (err, row) => {
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

  getIdByEmail(email) {
    const sql = 'select id from accounts where email = ? ';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [email], (err, row) => {
        if (err) {
          return reject(err);
        }
        if (!row) {
          return reject(new Error('Account not found'));
        }
        return resolve(row.id);
      });
    });
  }

  create(account) {
    const sql = 'insert into accounts (email, name, active, created_at) values (?, ?, 1 , ?) ';
    return new Promise((resolve, reject) => {
      const that = this;
      this.db.run(sql, [account.email, account.name, new Date().getTime()], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        that.invalidateCache();
        resolve(this.lastID);
      });
    });
  }

  changeStatus(id, active) {
    const sql = 'update accounts set active = ?, updated_at = ? where id = ? ';
    active = !!active;
    return new Promise((resolve, reject) => {
      const that = this;
      this.db.run(sql, [active, new Date().getTime(), id], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        that.invalidateCache();
        resolve(this.changes);
      });
    });
  }

  setUpdatedAt(id) {
    const sql = 'update accounts set updated_at = ? where id = ? ';
    return new Promise((resolve, reject) => {
      const that = this;
      this.db.run(sql, [new Date().getTime(), id], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        that.invalidateCache();
        resolve(this.changes);
      });
    });
  }

  delete(id) {
    const sql = 'delete from accounts where id = ? ';
    return new Promise((resolve, reject) => {
      const that = this;
      this.db.run(sql, [id], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        that.invalidateCache();
        resolve(this.changes);
      });
    });
  }
}

export default AccountManager;
