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
import {
  renderSSHOptions,
  parseSSHOptions,
  mergeSSHOptions,
  calculateDistance,
  parseKeySSHOptions
} from '../utils/sshOptionsUtils';

class PermissionManager {
  constructor(db, gm) {
    this.db = db;
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

  async match(user, host) {
    const matchLen = user.length + host.length;
    const sql = `select k.public_key, k.public_key_sig, k.fingerprint, a.email, p.ssh_options,
      k.key_ssh_options, p.host, p.user
      from accounts a, public_keys k, tgroups g, groups_accounts ga, permissions p
    ${PermissionManager._getMatchSqlWhere(false)}
    order by k.fingerprint
    `;
    const rows = await this.db.all(sql, [host, user, Date.now()]);
    const keys = {};
    rows.forEach(r => {
      parseKeySSHOptions(r);
      if (!r.key_ssh_options) {
        parseSSHOptions(r);
        calculateDistance(matchLen, r);
      }
      if (keys[r.fingerprint]) {
        // If a key has its own SSH options, do not overwrite them
        if (!r.key_ssh_options) {
          if (keys[r.fingerprint].ssh_options || r.ssh_options) {
            if (r.distance < keys[r.fingerprint].distance) {
              keys[r.fingerprint] = r;
            } else if (r.distance === keys[r.fingerprint].distance) {
              keys[r.fingerprint].ssh_options = mergeSSHOptions(keys[r.fingerprint].ssh_options, r.ssh_options);
            }
          }
        } else {
          keys[r.fingerprint] = r;
        }
      } else {
        keys[r.fingerprint] = r;
      }
    });
    return Object.keys(keys).map(k => {
      const ret = keys[k];
      if (ret.key_ssh_options) {
        ret.ssh_options = renderSSHOptions(ret.key_ssh_options);
      } else if (ret.ssh_options) {
        ret.ssh_options = renderSSHOptions(ret.ssh_options);
      } else {
        ret.ssh_options = '';
      }
      delete ret.key_ssh_options;
      delete ret.host;
      delete ret.user;
      delete ret.distance;
      return ret;
    });
  }

  async search(user, host) {
    const sql = `select distinct a.id, a.email, p.host, p.user, p.ssh_options
       from accounts a, tgroups g, groups_accounts ga, permissions p 
    ${PermissionManager._getMatchSqlWhere(true)}`;
    const rows = await this.db.all(sql, [host, user, Date.now()]);
    return rows.map(parseSSHOptions);
  }

  async getAll(account_id, limit, offset) {
    let sql =
      'select id, user, host, ssh_options, created_at from permissions where account_id = ? order by created_at ';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    const rows = await this.db.all(sql, [account_id]);
    return rows.map(parseSSHOptions);
  }

  async getAllGroup(group_id, limit, offset) {
    let sql = 'select id, user, host, ssh_options, created_at from permissions where group_id = ? order by created_at ';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    const rows = await this.db.all(sql, [group_id]);
    return rows.map(parseSSHOptions);
  }

  async create(group_id, user, host, ssh_options) {
    if (!ssh_options && ssh_options !== '') {
      ssh_options = '';
    } else {
      if (typeof ssh_options !== 'object') {
        throw new Error('ssh_options is not an object: ' + typeof ssh_options);
      }
      ssh_options = JSON.stringify(ssh_options);
    }
    const sql = 'insert into permissions (group_id, user, host, ssh_options, created_at) values (?, ?, ?, ?, ?) ';
    const lastId = await this.db.insert(sql, [group_id, user, host, ssh_options, new Date().getTime()]);
    await this.gm.setUpdatedAt(group_id);
    return lastId;
  }

  async get(group_id, id) {
    const sql = 'select host, user, ssh_options from permissions where id = ? and group_id = ?';
    const row = await this.db.get(sql, [id, group_id]);
    return parseSSHOptions(row);
  }

  async delete(group_id, id) {
    const sql = 'delete from permissions where id = ? and group_id = ?';
    const changes = await this.db.delete(sql, [id, group_id]);
    await this.gm.setUpdatedAt(group_id);
    return changes;
  }

  async updateSSHOptions(group_id, id, ssh_options) {
    if (!ssh_options && ssh_options !== '') {
      ssh_options = '';
    } else {
      if (typeof ssh_options !== 'object') {
        throw new Error('ssh_options is not an object: ' + typeof ssh_options);
      }
      ssh_options = JSON.stringify(ssh_options);
    }
    const sql = 'update permissions set ssh_options = ? where id = ? and group_id = ?';
    const changes = await this.db.update(sql, [ssh_options, id, group_id]);
    await this.gm.setUpdatedAt(group_id);
    return changes;
  }
}

export default PermissionManager;
