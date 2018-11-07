import AccountManager from './AccountManager';
import GroupManager from './GroupManager';

class PermissionManager {
  constructor(db, am, gm) {
    this.db = db;
    if (am) {
      this.am = am;
    } else {
      this.am = new AccountManager(this.db);
    }
    if (gm) {
      this.gm = gm;
    } else {
      this.gm = new GroupManager(this.db);
    }
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
    return this.db.all(sql, [host, user, host, user]);
  }

  getAll(account_id, limit, offset) {
    let sql = 'select id, user, host, created_at from permissions where account_id = ? order by created_at ';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    return this.db.all(sql, [account_id]);
  }

  getAllGroup(group_id, limit, offset) {
    let sql = 'select id, user, host, created_at from permissions where group_id = ? order by created_at ';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    return this.db.all(sql, [group_id]);
  }

  async create(account_id, user, host) {
    const sql = 'insert into permissions (account_id, user, host, created_at) values (?, ?, ?, ?) ';
    const lastId = await this.db.insert(sql, [account_id, user, host, new Date().getTime()]);
    await this.am.setUpdatedAt(account_id);
    return lastId;
  }

  async delete(account_id, id) {
    const sql = 'delete from permissions where id = ? and account_id = ?';
    const changes = await this.db.delete(sql, [id, account_id]);
    await this.am.setUpdatedAt(account_id);
    return changes;
  }

  async createGroup(group_id, user, host) {
    const sql = 'insert into permissions (group_id, user, host, created_at) values (?, ?, ?, ?) ';
    const lastId = await this.db.insert(sql, [group_id, user, host, new Date().getTime()]);
    await this.gm.setUpdatedAt(group_id);
    return lastId;
  }

  async deleteGroup(group_id, id) {
    const sql = 'delete from permissions where id = ? and group_id = ?';
    const changes = await this.db.delete(sql, [id, group_id]);
    await this.gm.setUpdatedAt(group_id);
    return changes;
  }
}

export default PermissionManager;
