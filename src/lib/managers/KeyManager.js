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
    let sql = 'select id, public_key, created_at from public_keys where account_id = ? order by created_at ';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    return this.db.all(sql, [account_id]);
  }

  async create(account_id, key) {
    const sql = 'insert into public_keys (account_id, public_key, created_at) values (?, ?, ?) ';
    const id = await this.db.insert(sql, [account_id, key, new Date().getTime()]);
    await this.am.setUpdatedAt(account_id);
    return id;
  }

  async delete(account_id, id) {
    const sql = 'delete from public_keys where id = ? and account_id = ?';
    const changes = await this.db.delete(sql, [id, account_id]);
    await this.am.setUpdatedAt(account_id);
    return changes;
  }
}

export default KeyManager;
