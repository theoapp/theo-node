import KeyManager from './KeyManager';
import PermissionManager from './PermissionManager';
import GroupAccountManager from './GroupAccountManager';
import BaseCacheManager from './BaseCacheManager';

const MAX_ROWS = 100;

class AccountManager extends BaseCacheManager {
  async getAllCount(where = false, whereArgs = []) {
    const sql = 'select count(*) total from accounts ' + (where || '');
    const row = await this.db.get(sql, whereArgs);
    return row.total;
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
    const rows = await this.db.all(sql);
    return {
      rows,
      limit,
      offset,
      total
    };
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
    const rows = await this.db.all(sql, whereArgs);
    return {
      rows,
      limit,
      offset,
      total
    };
  }

  async getFullByEmail(email) {
    const account = await this.getByEmail(email);
    return this.getFull(account.id);
  }

  async getFull(id) {
    const account = await this.get(id);
    const km = new KeyManager(this.db, this);
    account.public_keys = await km.getAll(id);
    const pm = new PermissionManager(this.db, this);
    account.permissions = await pm.getAll(id);
    const gam = new GroupAccountManager(this.db);
    account.groups = await gam.getAllByAccount(id);
    return account;
  }

  async get(id) {
    const sql = 'select id, name, email, active from accounts where id = ? ';
    const row = await this.db.get(sql, [id]);
    if (!row) {
      throw new Error('Account not found');
    }
    return row;
  }

  async getByEmail(email) {
    const sql = 'select id, name, email, active from accounts where email = ? ';
    const row = await this.db.get(sql, [email]);
    if (!row) {
      throw new Error('Account not found');
    }
    return row;
  }

  async getIdByEmail(email) {
    const sql = 'select id from accounts where email = ? ';
    const row = await this.db.get(sql, [email]);
    if (!row) {
      throw new Error('Account not found');
    }
    return row.id;
  }

  async create(account) {
    const sql = 'insert into accounts (email, name, active, created_at) values (?, ?, 1 , ?) ';
    const lastId = await this.db.insert(sql, [account.email, account.name, new Date().getTime()]);
    this.invalidateCache();
    return lastId;
  }

  async changeStatus(id, active) {
    const sql = 'update accounts set active = ?, updated_at = ? where id = ? ';
    active = !!active;
    const changes = await this.db.update(sql, [active, new Date().getTime(), id]);
    this.invalidateCache();
    return changes;
  }

  async setUpdatedAt(id) {
    const sql = 'update accounts set updated_at = ? where id = ? ';
    const changes = await this.db.update(sql, [new Date().getTime(), id]);
    this.invalidateCache();
    return changes;
  }

  async delete(id) {
    const sql = 'delete from accounts where id = ? ';
    const changes = this.db.delete(sql, [id]);
    this.invalidateCache();
    return changes;
  }

  async getKeysIfActive(id) {
    const sql =
      'select k.public_key from public_keys k, accounts a where a.id = k.account_id and a.active = 1 and a.id = ?';
    return this.db.all(sql, [id]);
  }
}

export default AccountManager;
