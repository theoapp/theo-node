import GroupAccountManager from './GroupAccountManager';
import PermissionManager from './PermissionManager';
import BaseCacheManager from './BaseCacheManager';

class GroupManager extends BaseCacheManager {
  getAll(limit, offset) {
    let sql = 'select id, name, created_at from groups order by name asc';
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

  get(id) {
    const sql = 'select id, name, active from groups where id = ? ';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          return reject(err);
        }
        if (!row) {
          const error = new Error('Group not found');
          error.t_code = 404;
          return reject(error);
        }
        return resolve(row);
      });
    });
  }

  getIdByName(name) {
    const sql = 'select id from groups where name = ? ';
    return new Promise((resolve, reject) => {
      this.db.get(sql, [name], (err, row) => {
        if (err) {
          return reject(err);
        }
        if (!row) {
          const error = new Error('Group not found');
          error.t_code = 404;
          return reject(error);
        }
        return resolve(row.id);
      });
    });
  }

  create(name) {
    const sql = 'insert into groups (name, active, created_at) values (?, 1, ?) ';
    return new Promise((resolve, reject) => {
      this.db.run(sql, [name, new Date().getTime()], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      });
    });
  }

  delete(id) {
    const sql = 'delete from groups where id = ?';
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

  changeStatus(id, active) {
    const sql = 'update groups set active = ?, updated_at = ? where id = ? ';
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
    const sql = 'update groups set updated_at = ? where id = ? ';
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

  async getFull(id) {
    const group = await this.get(id);
    const gam = new GroupAccountManager(this.db);
    group.accounts = await gam.getAllAccounts(id);
    const pm = new PermissionManager(this.db);
    group.permissions = await pm.getAllGroup(id);
    return group;
  }
}

export default GroupManager;
