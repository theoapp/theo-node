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

import BaseCacheManager, { MAX_ROWS } from './BaseCacheManager';
import { getInstance } from '../utils/instanceUtils';

class GroupManager extends BaseCacheManager {
  async getAllCount(where = '', whereArgs = []) {
    whereArgs.splice(0, 0, getInstance());
    const sql = 'select count(*) total from tgroups where instance = ? ' + (where || '');
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
    const where = 'and is_internal = ? ';
    const whereArgs = [0];
    if (!skipCount) {
      total = await this.getAllCount(where, [0]);
    }
    order_by = order_by || 'name';
    sort = sort || 'asc';
    let sql = `select id, name, active, created_at from tgroups where instance = ? ${where} order by ${order_by} ${sort}`;
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
    let where = 'and is_internal = ? ';
    const whereArgs = [0];

    if (name) {
      where += 'and name like ?';
      whereArgs.push(`%${name}%`);
    }

    const total = await this.getAllCount(where, whereArgs);
    order_by = order_by || 'name';
    let sql = `select id, name, active, created_at from tgroups where instance = ? ${where} order by ${order_by} ${sort}`;
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

  async get(id) {
    const sql = 'select id, name, active, created_at from tgroups where instance = ? and id = ? ';
    const group = await this.db.get(sql, [getInstance(), id]);
    if (!group) {
      const error = new Error('Group not found');
      error.t_code = 404;
      throw error;
    }
    return group;
  }

  async getByName(name) {
    const sql = 'select id, name, active, created_at from tgroups where instance = ? and name = ? ';
    const group = await this.db.get(sql, [getInstance(), name]);
    if (!group) {
      const error = new Error('Group not found');
      error.t_code = 404;
      throw error;
    }
    return group;
  }

  async getIdByName(name) {
    const sql = 'select id from tgroups where instance = ? and name = ? ';
    const group = await this.db.get(sql, [getInstance(), name]);
    if (!group) {
      const error = new Error('Group not found');
      error.t_code = 404;
      throw error;
    }
    return group.id;
  }

  async checkName(name) {
    const sql = 'select id from tgroups where instance = ? and name = ? ';
    const group = await this.db.get(sql, [getInstance(), name]);
    return group ? group.id : false;
  }

  create(name, active = 1) {
    const sql = 'insert into tgroups (instance, name, active, is_internal, created_at) values (?, ?, ?, ?, ?) ';
    const phs = [getInstance(), name, active ? 1 : 0, name.indexOf('@') > 0 ? 1 : 0, Date.now()];
    return this.db.insert(sql, phs);
  }

  async delete(id) {
    const sql = 'delete from tgroups where instance = ? and id = ?';
    const changes = await this.db.delete(sql, [getInstance(), id]);
    this.invalidateCache();
    return changes;
  }

  async deleteInternal(name) {
    const sql = 'delete from tgroups where instance = ? and name = ? and is_internal = 1';
    const changes = await this.db.delete(sql, [getInstance(), name]);
    this.invalidateCache();
    return changes;
  }

  async changeStatus(id, active) {
    const sql = 'update tgroups set active = ?, updated_at = ? where instance = ? and id = ? ';
    active = !!active;
    const changes = await this.db.update(sql, [active ? 1 : 0, new Date().getTime(), getInstance(), id]);
    this.invalidateCache();
    return changes;
  }

  async setUpdatedAt(id) {
    const sql = 'update tgroups set updated_at = ? where instance = ? and id = ? ';
    const changes = await this.db.update(sql, [new Date().getTime(), getInstance(), id]);
    this.invalidateCache();
    return changes;
  }

  async getFull(id, gam, pm) {
    const group = await this.get(id);
    group.accounts = await gam.getAllAccounts(id);
    group.permissions = await pm.getAllGroup(id);
    return group;
  }

  async getAccountsIfActive(id) {
    const sql = `select account_id from tgroups g, groups_accounts ga, accounts a
      where a.id = ga.account_id and
      a.instance = ? and
      g.instance = ? and
      a.active = 1 and
      ga.group_id = g.id and
      g.active = 1 and
      g.id = ?`;
    const instance = getInstance();
    return this.db.all(sql, [instance, instance, id]);
  }
}

export default GroupManager;
