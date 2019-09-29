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
    let sql =
      'select id, public_key, fingerprint, public_key_sig, created_at from public_keys where account_id = ? order by created_at ';
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    return this.db.all(sql, [account_id]);
  }

  async create(account_id, key, fingerprint, signature = null) {
    const sql =
      'insert into public_keys (account_id, public_key, fingerprint, public_key_sig, created_at) values (?, ?, ?, ?, ?) ';
    const id = await this.db.insert(sql, [account_id, key, fingerprint, signature, new Date().getTime()]);
    await this.am.setUpdatedAt(account_id);
    return id;
  }

  async delete(account_id, id) {
    const sql = 'delete from public_keys where id = ? and account_id = ?';
    const changes = await this.db.delete(sql, [id, account_id]);
    await this.am.setUpdatedAt(account_id);
    return changes;
  }

  async get(account_id, id) {
    const sql = 'select id, public_key, fingerprint, public_key_sig from public_keys where id = ? and account_id = ?';
    return this.db.get(sql, [id, account_id]);
  }
}

export default KeyManager;
