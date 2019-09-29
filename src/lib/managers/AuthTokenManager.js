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

class AuthTokenManager {
  constructor(db) {
    this.db = db;
  }

  async getAll() {
    const sql = 'select token, assignee, type from auth_tokens';
    const tokens = await this.db.all(sql);
    const agentTokens = [];
    const adminTokens = {};
    tokens.forEach(token => {
      if (token.type === 'agent') {
        agentTokens.push(token.token);
      } else if (token.type === 'admin') {
        adminTokens[token.token] = token.assignee;
      }
    });
    return {
      admins: adminTokens,
      clients: agentTokens
    };
  }

  create(token, type, assignee = '') {
    const sql = 'insert into auth_tokens (token, assignee, type, created_at) values (?, ?, ?, ?) ';
    return this.db.run(sql, [token, assignee, type, new Date().getTime()]);
  }

  delete() {
    const sql = 'delete from auth_tokens';
    return this.db.delete(sql);
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
