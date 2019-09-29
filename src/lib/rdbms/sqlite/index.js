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

import DbManager from '../../managers/DbManager';

import SqliteClient from './client';
import { runV7migrationSqliteDb } from '../../../migrations/v7fixGroups';
import fs from 'fs';
import { dirname } from 'path';
import { runV12migration } from '../../../migrations/v12fixFingerprints';
import { md5 } from '../../utils/cryptoUtils';

let sqlite3;
try {
  sqlite3 = require('sqlite3');
} catch (e) {
  // Module not installed
}

const IN_MEMORY_DB = ':memory:';

class SqliteManager extends DbManager {
  dbVersion = 13;

  CREATE_TABLE_AUTH_TOKENS =
    'create table auth_tokens (token text PRIMARY KEY, assignee text, type varchar(5), created_at INTEGER)';

  CREATE_TABLE_ACCOUNTS =
    'create table accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, email varchar(128), name varchar(128), ' +
    'active INTEGER, ' +
    'expire_at INTEGER, updated_at INTEGER, created_at INTEGER, UNIQUE (email))';

  CREATE_TABLE_GROUPS =
    'create table tgroups (id INTEGER PRIMARY KEY AUTOINCREMENT, name varchar(128), active INTEGER, is_internal INTEGER, ' +
    'updated_at INTEGER, created_at INTEGER, UNIQUE (name))';

  CREATE_TABLE_GROUPS_ACCOUNTS =
    'create table groups_accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
    'account_id INTEGER, ' +
    'group_id INTEGER, ' +
    'updated_at INTEGER, ' +
    'created_at INTEGER, ' +
    'UNIQUE (account_id, group_id), ' +
    'FOREIGN KEY(group_id) REFERENCES tgroups (id) ON DELETE CASCADE, ' +
    'FOREIGN KEY(account_id) REFERENCES accounts (id) ON DELETE CASCADE)';

  CREATE_TABLE_PUBLIC_KEYS =
    'create table public_keys (id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
    'account_id INTEGER, ' +
    'public_key varchar(1024), ' +
    'public_key_sig varchar(1024), ' +
    'fingerprint varchar(1024), ' +
    'created_at INTEGER, ' +
    'FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE)';

  CREATE_TABLE_PERMISSIONS =
    'create table permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
    'group_id INTEGER, ' +
    'user varchar(512), ' +
    'host varchar(512), ' +
    'created_at INTEGER, ' +
    'FOREIGN KEY(group_id) REFERENCES tgroups (id) ON DELETE CASCADE)';

  CREATE_INDEX_PERMISSIONS = 'create index k_permissions_host_user on permissions (host, user)';

  constructor(options) {
    super(options);
    this.is_in_memory = options.storage === IN_MEMORY_DB;
    this.prepareDb(options.storage);
  }

  prepareDb(storage) {
    if (!this.is_in_memory) {
      // If db file does not exists...
      if (!fs.existsSync(storage)) {
        // if parent directory does not exists..
        const parentDir = dirname(storage);
        if (!fs.existsSync(parentDir)) {
          // let create it..
          try {
            fs.mkdirSync(parentDir, { recursive: true });
          } catch (err) {
            console.error('ERROR creating dir structure for Sqlite db file: %s', storage, err.message);
            throw err;
          }
        }
      }
    }
    this.db = new sqlite3.Database(storage);
    this.db.run('PRAGMA foreign_keys = ON');
  }

  getEngine() {
    return 'sqlite';
  }

  getClient(pool = false) {
    return new SqliteClient(this.db);
  }

  setClient(client) {
    this.client = client;
  }

  close() {
    console.log('Closing db');
    this.db.close();
  }

  async createVersionTable() {
    const sqlCreateTable = 'create table _version (value INTEGER)';
    try {
      await this.client.run(sqlCreateTable);
    } catch (e) {
      console.error('Unable to create _version table', e.message);
      throw e;
    }
    try {
      const sqlInsertVersionZero = 'insert into _version values (0)';
      await this.client.run(sqlInsertVersionZero);
    } catch (e) {
      console.error('Unable to insert 0 version in _version table', e.message);
      throw e;
    }
    return 0;
  }

  async initDb() {
    await this.client.run(this.CREATE_TABLE_AUTH_TOKENS);
    await this.client.run(this.CREATE_TABLE_ACCOUNTS);
    await this.client.run(this.CREATE_TABLE_PUBLIC_KEYS);
    await this.client.run(this.CREATE_TABLE_PERMISSIONS);
    await this.client.run(this.CREATE_INDEX_PERMISSIONS);
    await this.client.run(this.CREATE_TABLE_GROUPS);
    await this.client.run(this.CREATE_TABLE_GROUPS_ACCOUNTS);
    await this.updateVersion();
  }

  async updateVersion() {
    const sql = 'update _version set value = ' + this.dbVersion;
    return this.client.run(sql);
  }

  async upgradeDb(fromVersion) {
    if (fromVersion < 2) {
      await this.client.run(this.CREATE_TABLE_PUBLIC_KEYS);
      const updatePublicKeys =
        'insert into public_keys (id, account_id, public_key, created_at) select id, account_id, public_key, created_at from keys';
      await this.client.run(updatePublicKeys);
      await this.client.run('drop table keys');
    }
    if (fromVersion < 3) {
      await this.client.run(this.CREATE_TABLE_GROUPS);
      await this.client.run(this.CREATE_TABLE_GROUPS_ACCOUNTS);
    }
    if (fromVersion < 4) {
      await this.client.run('create table permissions_tmp as select * from permissions');
      await this.client.run('drop table permissions');
      await this.client.run(this.CREATE_TABLE_PERMISSIONS);
      await this.client.run(
        'insert into permissions (id, account_id, user, host, created_at) select id, account_id, user, host, created_at from permissions_tmp'
      );
      await this.client.run('drop table permissions_tmp');
    }
    if (fromVersion < 5) {
      try {
        await this.client.run('alter table groups add updated_at integer');
      } catch (err) {}
    }
    if (fromVersion < 6) {
      try {
        await this.client.run('alter table public_keys add public_key_sig varchar(1024)');
      } catch (err) {}
    }
    if (fromVersion < 7) {
      await runV7migrationSqliteDb(this.client);

      await this.client.run('create table permissions_tmp as select * from permissions');
      await this.client.run('drop table permissions');
      await this.client.run(this.CREATE_TABLE_PERMISSIONS);
      await this.client.run(
        'insert into permissions (id, group_id, user, host, created_at) select id, group_id, user, host, created_at from permissions_tmp'
      );
      await this.client.run('drop table permissions_tmp');
    }
    if (fromVersion < 8) {
      await this.client.run('alter table accounts add expire_at INTEGER not null default 0');
    }
    if (fromVersion < 9) {
      await this.client.run(this.CREATE_TABLE_AUTH_TOKENS);
    }
    if (fromVersion < 10) {
      await this.client.run(this.CREATE_TABLE_GROUPS);
      await this.client.run(
        'insert into tgroups (id, name, active, updated_at, created_at) select id, name, active, updated_at, created_at from groups'
      );
      await this.client.run('create table permissions_tmp as select * from permissions');
      await this.client.run('drop table permissions');
      await this.client.run(this.CREATE_TABLE_PERMISSIONS);
      await this.client.run(
        'insert into permissions (id, group_id, user, host, created_at) select id, group_id, user, host, created_at from permissions_tmp'
      );
      await this.client.run('drop table permissions_tmp');

      await this.client.run('create table groups_accounts_tmp as select * from groups_accounts');
      await this.client.run('drop table groups_accounts');
      await this.client.run(this.CREATE_TABLE_GROUPS_ACCOUNTS);
      await this.client.run(
        'insert into groups_accounts (id, account_id, group_id, created_at) select id, account_id, group_id, created_at from groups_accounts_tmp'
      );
      await this.client.run('drop table groups_accounts_tmp');

      await this.client.run('drop table groups');
    }

    if (fromVersion === 10) {
      try {
        await this.client.run('alter table tgroups add is_internal INTEGER not null default 0');
        await this.client.run("update tgroups set is_internal = 1 where name like '%@%'");
      } catch (e) {
        //
      }
    }

    if (fromVersion < 12) {
      await this.client.run('alter table public_keys add fingerprint varchar(1024)');
      await runV12migration(this.client);
    }
    if (fromVersion < 13) {
      await this.client.run('alter table auth_tokens add assignee text');
      const rows = await this.client.all("select token from auth_tokens where type = 'admin'");
      for (let i = 0; i < rows.length; i++) {
        await this.client.run('update auth_tokens set assignee = ? where token = ?', [
          md5(rows[i].token),
          rows[i].token
        ]);
      }
    }
    await this.updateVersion();
  }

  async getCurrentVersion() {
    const sqlCheck = 'select value from _version';
    try {
      return await this.client.get(sqlCheck);
    } catch (e) {
      if (e.errno === 1) {
        return false;
      }
      throw e;
    }
  }

  async flushDb() {
    if (this.is_in_memory) {
      this.close();
      this.prepareDb(IN_MEMORY_DB);
    } else {
      const tables = 'public_keys, groups_accounts, permissions, tgroups, accounts, auth_tokens, _version'.split(',');
      for (let i = 0; i < tables.length; i++) {
        const sqlDrop = 'drop table ' + tables[i];
        try {
          await this.client.run(sqlDrop);
          console.log('Dropped ', tables[i]);
        } catch (e) {
          console.error('Failed to drop %s', tables[i], e);
          // it doesn't exists
        }
      }
    }
    return true;
  }
}

export default SqliteManager;
