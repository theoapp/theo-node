// Copyright 2019 AuthKeys srl
// Copyright 2023 Fluidware srl
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import KeyManager from './KeyManager';
import PermissionManager from './PermissionManager';
import GroupAccountManager from './GroupAccountManager';
import BaseCacheManager, { buildOrderBy, MAX_ROWS } from './BaseCacheManager';
import { getTimestampFromISO8601 } from '../utils/dateUtils';
import { getInstance } from '../utils/instanceUtils';

const SELECT_ACCOUNT_MIN = 'id, name, email, active, expire_at, created_at';

export const ACCOUNT_ORDER_COLUMNS = ['id', 'name', 'email', 'active', 'expire_at', 'created_at'];

class AccountManager extends BaseCacheManager {
  async getAllCount(where = false, whereArgs = []) {
    const _whereArgs = [...whereArgs];
    _whereArgs.splice(0, 0, getInstance());
    const sql = 'select count(*) total from accounts where instance = ? ' + (where || '');
    const row = await this.db.get(sql, _whereArgs);
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
    const orderBy = buildOrderBy(order_by, sort, ACCOUNT_ORDER_COLUMNS, 'name');
    let total = -1;
    if (!skipCount) {
      total = await this.getAllCount();
    }
    let sql = `select ${SELECT_ACCOUNT_MIN} from accounts where instance = ? ${orderBy}`;

    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    const rows = await this.db.all(sql, [getInstance()]);
    return {
      rows,
      limit,
      offset,
      total
    };
  }

  async search(name, email, limit = 10, offset = 0, order_by, sort) {
    if (limit > MAX_ROWS) {
      limit = MAX_ROWS;
    }
    if (!limit || limit < 1) {
      limit = 10;
    }
    if (!offset || offset < 0) {
      offset = 0;
    }
    const orderBy = buildOrderBy(order_by, sort, ACCOUNT_ORDER_COLUMNS, 'name');
    let where = '';
    const whereArgs = [];
    if (name && email) {
      where = 'and ( name like ? or email like ? ) ';
      whereArgs.push(`%${name}%`);
      whereArgs.push(`%${email}%`);
    } else if (name) {
      where = 'and name like ?';
      whereArgs.push(`%${name}%`);
    } else if (email) {
      where = 'and email like ?';
      whereArgs.push(`%${email}%`);
    }
    const total = await this.getAllCount(where, whereArgs);
    let sql = `select ${SELECT_ACCOUNT_MIN} from accounts where instance = ? ${where} ${orderBy}`;
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    whereArgs.splice(0, 0, getInstance());
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
    const gam = new GroupAccountManager(this.db);
    account.groups = await gam.getAllByAccount(id);
    account.permissions = [];
    const pm = new PermissionManager(this.db);
    for (let i = 0; i < account.groups.length; i++) {
      const permissions = await pm.getAllGroup(account.groups[i].id);
      if (account.groups[i].is_internal) {
        permissions.forEach(permission => (permission.is_internal = true));
      } else {
        permissions.forEach(permission => (permission.from_group = account.groups[i]));
      }
      account.permissions = [].concat.apply(account.permissions, permissions);
    }
    return account;
  }

  async get(id) {
    const sql = `select ${SELECT_ACCOUNT_MIN} from accounts where instance = ? and id = ?`;
    const row = await this.db.get(sql, [getInstance(), id]);
    if (!row) {
      const err = new Error('Account not found');
      err.t_code = 404;
      throw err;
    }
    return row;
  }

  async getByEmail(email) {
    const sql = `select ${SELECT_ACCOUNT_MIN} from accounts where instance = ? and email = ?`;
    const row = await this.db.get(sql, [getInstance(), email]);
    if (!row) {
      const err = new Error('Account not found');
      err.t_code = 404;
      throw err;
    }
    return row;
  }

  async getIdByEmail(email) {
    const sql = 'select id from accounts where instance = ? and email = ? ';
    const row = await this.db.get(sql, [getInstance(), email]);
    if (!row) {
      const err = new Error('Account not found');
      err.t_code = 404;
      throw err;
    }
    return row.id;
  }

  async checkEmail(email) {
    const sql = 'select id from accounts where instance = ? and email = ? ';
    const row = await this.db.get(sql, [getInstance(), email]);
    return row ? row.id : false;
  }

  async create(account) {
    let expire_at = 0;
    if (account.expire_at) {
      expire_at = getTimestampFromISO8601(account.expire_at);
    }
    const sql =
      'insert into accounts (instance, email, name, active, expire_at, created_at) values (?, ?, ?, ?, ?, ?) ';
    const lastId = await this.db.insert(sql, [
      getInstance(),
      account.email,
      account.name,
      account.active === undefined ? 1 : account.active ? 1 : 0,
      expire_at,
      account.created_at || new Date().getTime()
    ]);
    this.invalidateCache();
    return lastId;
  }

  async changeStatus(id, active) {
    const sql = 'update accounts set active = ?, updated_at = ? where instance = ? and id = ? ';
    active = !!active;
    const changes = await this.db.update(sql, [active ? 1 : 0, new Date().getTime(), getInstance(), id]);
    this.invalidateCache();
    return changes;
  }

  async updateExpire(id, expire_at) {
    expire_at = getTimestampFromISO8601(expire_at);
    const sql = 'update accounts set expire_at = ?, updated_at = ? where instance = ? and id = ? ';
    const changes = await this.db.update(sql, [expire_at, new Date().getTime(), getInstance(), id]);
    this.invalidateCache();
    return changes;
  }

  async update(id, active, expire_at) {
    expire_at = getTimestampFromISO8601(expire_at);
    const sql = 'update accounts set active = ?, expire_at = ?, updated_at = ? where instance = ? and id = ? ';
    const changes = await this.db.update(sql, [active ? 1 : 0, expire_at, new Date().getTime(), getInstance(), id]);
    this.invalidateCache();
    return changes;
  }

  async setUpdatedAt(id) {
    const sql = 'update accounts set updated_at = ? where instance = ? and id = ? ';
    const changes = await this.db.update(sql, [new Date().getTime(), getInstance(), id]);
    this.invalidateCache();
    return changes;
  }

  async delete(id) {
    const sql = 'delete from accounts where instance = ? and id = ? ';
    const changes = this.db.delete(sql, [getInstance(), id]);
    this.invalidateCache();
    return changes;
  }

  async getKeysIfActive(id) {
    const sql =
      'select k.public_key, k.public_key_sig from public_keys k, accounts a where instance = ? and a.id = k.account_id and a.active = 1 and (a.expire_at = 0 or a.expire_at > now()) and a.id = ?';
    return this.db.all(sql, [getInstance(), id]);
  }
}

export default AccountManager;
