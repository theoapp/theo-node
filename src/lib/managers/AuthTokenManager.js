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

import { md5 } from '../utils/cryptoUtils';
import { getInstance } from '../utils/instanceUtils';

class AuthTokenManager {
  constructor(db) {
    this.db = db;
  }

  async getAll(all) {
    const phs = [];
    let sql = `select instance, token, assignee, type from auth_tokens`;
    if (!all) {
      sql += ' where instance = ?';
      phs.push(getInstance());
    }
    const tokens = await this.db.all(sql, phs);
    const instances = {};
    tokens.forEach(token => {
      if (!instances[token.instance]) {
        instances[token.instance] = {
          client: {
            tokens: []
          },
          admin: {
            tokens: {}
          }
        };
      }
      if (token.type === 'agent') {
        instances[token.instance].client.tokens.push(token.token);
      } else if (token.type === 'admin') {
        instances[token.instance].admin.tokens[token.token] = token.assignee;
      } else if (token.type === 'core') {
        instances[token.instance].core = token.token;
      }
    });
    return instances;
  }

  create(token, type, assignee = '') {
    const sql = 'insert into auth_tokens (instance, token, assignee, type, created_at) values (?, ?, ?, ?, ?) ';
    const instance = getInstance();
    return this.db.run(sql, [instance, md5(`${instance}:${token}`), assignee, type, new Date().getTime()]);
  }

  delete() {
    const sql = 'delete from auth_tokens where instance = ?';
    return this.db.delete(sql, [getInstance()]);
  }

  static getTokenAssignee(admin, as_admin = false) {
    let token;
    let assignee;
    if (typeof admin === 'string') {
      console.error('[WARN] tokens.admin as string is deprecated. Please see documentation');
      if (as_admin) {
        console.error('[WARN] We will use "admin" as assignee');
        assignee = 'admin';
      } else {
        console.error('[WARN] We will use md5(tokens.admin) as assignee');
        assignee = md5(admin);
      }
      token = admin;
    } else {
      token = admin.token;
      assignee = admin.assignee;
    }
    return { token, assignee };
  }
}

export default AuthTokenManager;
