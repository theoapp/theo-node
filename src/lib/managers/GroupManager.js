import GroupAccountManager from './GroupAccountManager';
import PermissionManager from './PermissionManager';

class GroupManager {
  constructor(db, am) {
    this.db = db;
  }

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
          return reject(new Error('Group not found'));
        }
        return resolve(row);
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
      this.db.run(sql, [id], async function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);
      });
    });
  }

  changeStatus(id, active) {
    const sql = 'update groups set active = ?, updated_at = ? where id = ? ';
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

  async getFull(id) {
    const group = await this.get(id);
    const gam = new GroupAccountManager(this.db);
    group.accounts = await gam.getAll(id);
    const pm = new PermissionManager(this.db);
    group.permissions = await pm.getAllGroup(id);
    return group;
  }
}

export default GroupManager;
