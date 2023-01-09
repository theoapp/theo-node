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

import { parseKeySSHOptions } from '../utils/sshOptionsUtils';
import { getInstance } from '../utils/instanceUtils';

class KeyManager {
  constructor(db, am) {
    this.db = db;
    if (am) {
      this.am = am;
    } else {
      throw new Error('Missing required AccountManager parameter');
    }
  }

  async getAll(account_id, limit, offset) {
    let sql = `select pk.id, pk.public_key, pk.fingerprint, pk.public_key_sig, pk.key_ssh_options, pk.last_used_at, pk.created_at
        from public_keys pk
        where pk.instance = ? and
          pk.account_id = ?
        order by pk.created_at`;
    if (limit) {
      sql += ' limit ' + limit;
    }
    if (offset) {
      sql += ' offset ' + offset;
    }
    const rows = await this.db.all(sql, [getInstance(), account_id]);
    return rows.map(parseKeySSHOptions);
  }

  async create(account_id, key, fingerprint, signature = null, ssh_options = '') {
    const sql = `insert into public_keys (instance, account_id, public_key, fingerprint, public_key_sig, key_ssh_options, created_at)
        values (?, ?, ?, ?, ?, ?, ?)`;
    const id = await this.db.insert(sql, [
      getInstance(),
      account_id,
      key,
      fingerprint,
      signature,
      ssh_options,
      new Date().getTime()
    ]);
    await this.am.setUpdatedAt(account_id);
    return id;
  }

  async delete(account_id, id) {
    const sql = 'delete from public_keys where instance = ? and id = ? and account_id = ?';
    const changes = await this.db.delete(sql, [getInstance(), id, account_id]);
    await this.am.setUpdatedAt(account_id);
    return changes;
  }

  async update(account_id, id, ssh_options = '') {
    const sql = 'update public_keys set key_ssh_options = ? where instance = ? and id = ? and account_id = ?';
    const changes = await this.db.update(sql, [ssh_options, getInstance(), id, account_id]);
    await this.am.setUpdatedAt(account_id);
    return changes;
  }

  async get(account_id, id) {
    const sql = `select id, public_key, fingerprint, public_key_sig, key_ssh_options
         from public_keys
         where instance = ? and
            id = ? and
            account_id = ?`;
    const row = await this.db.get(sql, [getInstance(), id, account_id]);
    return parseKeySSHOptions(row);
  }

  async checkFingerprint(fingerprint) {
    const sql = 'select id, account_id from public_keys where instance = ? and fingerprint = ?';
    return this.db.get(sql, [getInstance(), fingerprint]);
  }

  static setLastUsed(dbConn, fingerprint) {
    const sql = 'update public_keys set last_used_at = ? where instance = ? and fingerprint = ? ';
    return dbConn.update(sql, [Date.now(), getInstance(), fingerprint]);
  }
}

export default KeyManager;
