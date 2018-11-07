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
    return this.db.all(sql, (err, rows));
  }

  async get(id) {
    const sql = 'select id, name, active from groups where id = ? ';
    const group = await this.db.get(sql, [id]);
    if (!group) {
      const error = new Error('Group not found');
      error.t_code = 404;
      throw error;
    }
    return group;
  }

  async getIdByName(name) {
    const sql = 'select id from groups where name = ? ';
    const group = await this.db.get(sql, [name]);
    if (!group) {
      const error = new Error('Group not found');
      error.t_code = 404;
      throw error;
    }
    return group.id;
  }

  async create(name) {
    const sql = 'insert into groups (name, active, created_at) values (?, 1, ?) ';
    return this.db.insert(sql, [name, new Date().getTime()]);
  }

  async delete(id) {
    const sql = 'delete from groups where id = ?';
    const changes = await this.db.delete(sql, [id]);
    this.invalidateCache();
    return changes;
  }

  async changeStatus(id, active) {
    const sql = 'update groups set active = ?, updated_at = ? where id = ? ';
    active = !!active;
    const changes = await this.db.update(sql, [active, new Date().getTime(), id]);
    this.invalidateCache();
    return changes;
  }

  async setUpdatedAt(id) {
    const sql = 'update groups set updated_at = ? where id = ? ';
    const changes = await this.db.update(sql, [new Date().getTime(), id]);
    this.invalidateCache();
    return changes;
  }

  async getFull(id) {
    const group = await this.get(id);
    const gam = new GroupAccountManager(this.db, this);
    group.accounts = await gam.getAllAccounts(id);
    const pm = new PermissionManager(this.db, null, this);
    group.permissions = await pm.getAllGroup(id);
    return group;
  }
}

export default GroupManager;
