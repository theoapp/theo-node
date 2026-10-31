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

import DbManager from '../../managers/DbManager';
import PostgresClient from './client';
import { runV18migration } from '../../../migrations/v18fixInstance';
import { CLUSTER_MODE } from '../../../const';
import { getLogger } from '@fluidware-it/saddlebag';

export default class PostgresManager extends DbManager {
  dbVersion = 18;

  CREATE_TABLE_AUTH_TOKENS = `create table auth_tokens (
    instance varchar(256) NOT NULL,
    token varchar(128)  NOT NULL,
    assignee varchar(64) NOT NULL,
    type varchar(5) NOT NULL,
    created_at BIGINT,
    PRIMARY KEY (instance, token)
  )`;

  CREATE_TABLE_ACCOUNTS = `create table accounts (
    id SERIAL PRIMARY KEY,
    instance varchar(256) NOT NULL,
    email varchar(128) not null,
    name varchar(128) not null,
    active smallint not null default 1,
    expire_at BIGINT not null default 0,
    updated_at BIGINT,
    created_at BIGINT,
    UNIQUE (instance, email)
  )`;

  CREATE_TABLE_GROUPS = `create table tgroups (
    id SERIAL PRIMARY KEY,
    instance varchar(256) NOT NULL,
    name varchar(128) not null,
    is_internal smallint not null default 0,
    active smallint not null default 1,
    updated_at BIGINT,
    created_at BIGINT,
    UNIQUE (instance, name)
  )`;

  CREATE_TABLE_GROUPS_ACCOUNTS = `create table groups_accounts (
    id SERIAL PRIMARY KEY,
    account_id INTEGER not null,
    group_id INTEGER not null,
    updated_at BIGINT,
    created_at BIGINT,
    UNIQUE (account_id, group_id),
    CONSTRAINT groups_accounts_group_id FOREIGN KEY(group_id) REFERENCES tgroups (id) ON DELETE CASCADE,
    CONSTRAINT groups_accounts_account_id FOREIGN KEY(account_id) REFERENCES accounts (id) ON DELETE CASCADE
  )`;

  CREATE_TABLE_PUBLIC_KEYS = `create table public_keys (
    id SERIAL PRIMARY KEY,
    instance varchar(256) NOT NULL,
    account_id INTEGER NOT NULL,
    public_key varchar(1024) not null,
    public_key_sig varchar(1024),
    fingerprint varchar(128),
    key_ssh_options TEXT not null,
    last_used_at BIGINT,
    created_at BIGINT,
    unique (instance, fingerprint),
    FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE
  )`;

  CREATE_TABLE_PERMISSIONS = `create table permissions (
    id SERIAL PRIMARY KEY,
    instance varchar(256) NOT NULL,
    group_id INTEGER,
    user varchar(256) not null,
    host varchar(256) not null,
    ssh_options TEXT not null,
    created_at BIGINT,
    CONSTRAINT permissions_group_id FOREIGN KEY(group_id) REFERENCES tgroups (id) ON DELETE CASCADE
  )`;

  CREATE_INDEX_PERMISSION_HOST_USER =
    'CREATE INDEX k_permissions_instance_host_user on permissions (instance, host, user)';

  connectionManager;

  constructor(settings) {
    super(settings);
    const { config } = settings;
    // this.pool = new Pool(config);
    this.config = config;
  }

  getEngine() {
    return 'postgres';
  }

  getClient() {
    this.client = new PostgresClient(this.config);
    return this.client;
  }

  setClient(client) {
    this.client = client;
  }

  async getCurrentVersion() {
    const sqlCheck = 'select value from _version';
    if (CLUSTER_MODE) {
      await this.client.run('BEGIN');
      let row;
      try {
        row = await this.client.get(`${sqlCheck} for update`);
        if (row.value === this.dbVersion) {
          getLogger().debug('Version is equal: %s vs %s', row.value, this.dbVersion);
          await this.client.run('ROLLBACK');
        }
        return row;
      } catch (e) {
        await this.client.run('ROLLBACK');
        if (e.code === '42P01') {
          return false;
        }
        getLogger().error({ error_message: e.message, code: e.code }, 'Ooops');
        throw e;
      }
    } else {
      try {
        return await this.client.get(sqlCheck);
      } catch (e) {
        if (e.code === '42P01') {
          return false;
        }
        getLogger().error({ error_message: e.message, code: e.code }, 'Ooops');
        throw e;
      }
    }
  }

  async createVersionTable() {
    const sqlCreateTable = 'create table _version (value INTEGER PRIMARY KEY)';
    try {
      await this.client.run(sqlCreateTable);
    } catch (e) {
      await this.client.run('ROLLBACK');
      throw e;
    }
    try {
      const sqlInsertVersionZero = 'insert into _version values (-1)';
      await this.client.run(sqlInsertVersionZero);
      if (CLUSTER_MODE) {
        await this.client.run('select value from _version for update');
      }
    } catch (e) {
      getLogger().error('Unable to insert -1 version in _version table: [%s] %s', e.code, e.message);
      throw e;
    }
    return 0;
  }

  async initDb() {
    let dbConn;
    if (CLUSTER_MODE) {
      dbConn = this.getClient();
      await dbConn.open();
    } else {
      dbConn = this.client;
    }
    await dbConn.run(this.CREATE_TABLE_AUTH_TOKENS);
    await dbConn.run(this.CREATE_TABLE_ACCOUNTS);
    await dbConn.run(this.CREATE_TABLE_PUBLIC_KEYS);
    await dbConn.run(this.CREATE_TABLE_GROUPS);
    await dbConn.run(this.CREATE_TABLE_PERMISSIONS);
    await dbConn.run(this.CREATE_INDEX_PERMISSION_HOST_USER);
    await dbConn.run(this.CREATE_TABLE_GROUPS_ACCOUNTS);
    await this.updateVersion();
    if (CLUSTER_MODE) {
      dbConn.close();
    }
  }

  async upgradeDb(fromVersion) {
    if (fromVersion < 18) {
      await runV18migration(this);
    }
  }

  async updateVersion() {
    const sql = 'update _version set value = ' + this.dbVersion;
    if (CLUSTER_MODE) {
      await this.client.run(sql);
      await this.client.run('COMMIT');
    } else {
      return this.client.run(sql);
    }
  }

  async flushDb(client) {
    getLogger().info('Flushing db...');
    const tables = 'public_keys, groups_accounts, permissions, tgroups, accounts, auth_tokens, _version'.split(',');
    for (let i = 0; i < tables.length; i++) {
      const sqlDrop = 'drop table ' + tables[i];
      try {
        await client.run(sqlDrop);
        getLogger().debug('Dropped %s', tables[i]);
      } catch (e) {
        getLogger().error(e, 'Failed to drop %s', tables[i]);
        // it doesn't exists
      }
    }
    return true;
  }

  close() {}
}
