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

import GroupManager from './GroupManager';

class GroupAccountManager {
  constructor(db, gm) {
    this.db = db;
    if (gm) {
      this.gm = gm;
    } else {
      this.gm = new GroupManager(this.db);
    }
  }

  getAll(group_id, limit, offset) {
    let sql =
      'select ga.id, g.id, g.name, g.active from groups_accounts ga, tgroups g where g.id = ga.group_id and g.id = ? order by name asc';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    return this.db.all(sql, [group_id]);
  }

  getAllAccounts(group_id, limit, offset) {
    let sql =
      'select a.id, a.name, a.email, a.active, a.expire_at, a.created_at from groups_accounts ga, accounts a where a.id = ga.account_id and ga.group_id = ? order by a.name asc';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    return this.db.all(sql, [group_id]);
  }

  getAllByAccount(account_id, limit, offset) {
    let sql =
      'select ga.id, g.id, g.name, g.active, g.is_internal, g.created_at from groups_accounts ga, tgroups g where g.id = ga.group_id and ga.account_id = ? order by name asc';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    return this.db.all(sql, [account_id]);
  }

  async create(group_id, account_id, skip_invalidation = false) {
    const sql = 'insert into groups_accounts (group_id, account_id, created_at) values (?, ?, ?) ';
    const lastId = await this.db.insert(sql, [group_id, account_id, new Date().getTime()]);
    if (!skip_invalidation) {
      await this.gm.setUpdatedAt(group_id);
    }
    return lastId;
  }

  async delete(group_id, account_id, skip_invalidation = false) {
    const sql = 'delete from groups_accounts where group_id = ? and account_id = ?';
    const changes = await this.db.delete(sql, [group_id, account_id]);
    if (changes > 0) {
      if (!skip_invalidation) {
        await this.gm.setUpdatedAt(group_id);
      }
    }
    return changes;
  }
}

export default GroupAccountManager;
