import GroupAccountManager from './GroupAccountManager';
import PermissionManager from './PermissionManager';
import BaseCacheManager, { MAX_ROWS } from './BaseCacheManager';

class GroupManager extends BaseCacheManager {
  async getAllCount(where = false, whereArgs = []) {
    const sql = 'select count(*) total from tgroups ' + (where || '');
    const row = await this.db.get(sql, whereArgs);
    return row.total;
  }

  async getAll(limit = 10, offset = 0, skipCount = false, order_by, sort) {
    if (limit > MAX_ROWS) {
      limit = MAX_ROWS;
    }
    if (!limit || limit < 1) {
      limit = 10;
    }
    if (!offset || offset < 0) {
      offset = 0;
    }
    let total = -1;
    const where = 'where is_internal = ? ';
    const whereArgs = [0];
    if (!skipCount) {
      total = await this.getAllCount(where, whereArgs);
    }
    order_by = order_by || 'name';
    sort = sort || 'asc';
    let sql = `select id, name, active, created_at from tgroups ${where} order by ${order_by} ${sort}`;
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    const rows = await this.db.all(sql, whereArgs);
    return {
      rows,
      limit,
      offset,
      total
    };
  }

  async search(name, limit = 10, offset = 0, order_by, sort) {
    if (limit > MAX_ROWS) {
      limit = MAX_ROWS;
    }
    if (!limit || limit < 1) {
      limit = 10;
    }
    if (!offset || offset < 0) {
      offset = 0;
    }
    let where = 'where is_internal = ? ';
    const whereArgs = [0];

    if (name) {
      where += 'and name like ?';
      whereArgs.push(`%${name}%`);
    }

    const total = await this.getAllCount(where, whereArgs);
    order_by = order_by || 'name';
    let sql = `select id, name, active, created_at from tgroups ${where} order by ${order_by} ${sort}`;
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    const rows = await this.db.all(sql, whereArgs);
    return {
      rows,
      limit,
      offset,
      total
    };
  }

  async get(id) {
    const sql = 'select id, name, active, created_at from tgroups where id = ? ';
    const group = await this.db.get(sql, [id]);
    if (!group) {
      const error = new Error('Group not found');
      error.t_code = 404;
      throw error;
    }
    return group;
  }

  async getByName(name) {
    const sql = 'select id, name, active, created_at from tgroups where name = ? ';
    const group = await this.db.get(sql, [name]);
    if (!group) {
      const error = new Error('Group not found');
      error.t_code = 404;
      throw error;
    }
    return group;
  }

  async getIdByName(name) {
    const sql = 'select id from tgroups where name = ? ';
    const group = await this.db.get(sql, [name]);
    if (!group) {
      const error = new Error('Group not found');
      error.t_code = 404;
      throw error;
    }
    return group.id;
  }

  async checkName(name) {
    const sql = 'select id from tgroups where name = ? ';
    const group = await this.db.get(sql, [name]);
    return group ? group.id : false;
  }

  async create(name, active = 1) {
    const sql = 'insert into tgroups (name, active, is_internal, created_at) values (?, ?, ?, ?) ';
    return this.db.insert(sql, [name, active, name.indexOf('@') > 0, new Date().getTime()]);
  }

  async delete(id) {
    const sql = 'delete from tgroups where id = ?';
    const changes = await this.db.delete(sql, [id]);
    this.invalidateCache();
    return changes;
  }

  async deleteInternal(name) {
    const sql = 'delete from tgroups where name = ? and is_internal = 1';
    const changes = await this.db.delete(sql, [name]);
    this.invalidateCache();
    return changes;
  }

  async changeStatus(id, active) {
    const sql = 'update tgroups set active = ?, updated_at = ? where id = ? ';
    active = !!active;
    const changes = await this.db.update(sql, [active, new Date().getTime(), id]);
    this.invalidateCache();
    return changes;
  }

  async setUpdatedAt(id) {
    const sql = 'update tgroups set updated_at = ? where id = ? ';
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

  async getAccountsIfActive(id) {
    const sql =
      'select account_id from tgroups g, groups_accounts ga, accounts a where a.id = ga.account_id and a.active = 1 and ga.group_id = g.id and g.active = 1 and g.id = ?';
    return this.db.all(sql, [id]);
  }
}

export default GroupManager;
