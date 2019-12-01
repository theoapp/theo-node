// Copyright 2019 AuthKeys srl
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

  static _getMatchSqlWhere(excludeKeys = false) {
    return `where ? like p.host and ? like p.user 
      ${!excludeKeys ? 'and k.account_id = a.id ' : ''}
      and g.id = p.group_id 
      and g.id = ga.group_id 
      and a.id = ga.account_id 
      and a.active = 1 
      and g.active = 1 
      and (a.expire_at = 0 or a.expire_at > ?) `;
  }

  match(user, host) {
    const sql = `select distinct k.public_key, k.public_key_sig, k.fingerprint, a.email 
       from accounts a, public_keys k, tgroups g, groups_accounts ga, permissions p 
    ${PermissionManager._getMatchSqlWhere(false)}`;
    return this.db.all(sql, [host, user, Date.now()]);
  }

  search(user, host) {
    const sql = `select distinct a.id, a.email, p.host, p.user 
       from accounts a, tgroups g, groups_accounts ga, permissions p 
    ${PermissionManager._getMatchSqlWhere(true)}`;
    return this.db.all(sql, [host, user, Date.now()]);
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

  async create(group_id, user, host) {
    const sql = 'insert into permissions (group_id, user, host, created_at) values (?, ?, ?, ?) ';
    const lastId = await this.db.insert(sql, [group_id, user, host, new Date().getTime()]);
    await this.gm.setUpdatedAt(group_id);
    return lastId;
  }

  async get(group_id, id) {
    const sql = 'select host, user from permissions where id = ? and group_id = ?';
    return this.db.get(sql, [id, group_id]);
  }

  async delete(group_id, id) {
    const sql = 'delete from permissions where id = ? and group_id = ?';
    const changes = await this.db.delete(sql, [id, group_id]);
    await this.gm.setUpdatedAt(group_id);
    return changes;
  }
}

export default PermissionManager;
