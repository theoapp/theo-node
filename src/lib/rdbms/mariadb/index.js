import DbManager from '../../managers/DbManager';
import mysql from 'mysql2';
import MariadbClient from './client';
import { runV7migrationMariaDb } from '../../../migrations/v7fixGroups';

class MariadbManager extends DbManager {
  dbVersion = 8;

  CREATE_TABLE_ACCOUNTS =
    'create table accounts (id INTEGER PRIMARY KEY AUTO_INCREMENT, email varchar(128) not null, name varchar(128) not null, ' +
    'active INTEGER not null default 1, expire_at BIGINT UNSIGNED not null default 0, updated_at BIGINT UNSIGNED, created_at BIGINT UNSIGNED, UNIQUE (email))';

  CREATE_TABLE_GROUPS =
    'create table groups (id INTEGER PRIMARY KEY AUTO_INCREMENT, name varchar(128) not null, active INTEGER not null default 1, ' +
    'updated_at BIGINT UNSIGNED, created_at BIGINT UNSIGNED, UNIQUE (name))';

  CREATE_TABLE_GROUPS_ACCOUNTS =
    'create table groups_accounts (id INTEGER PRIMARY KEY AUTO_INCREMENT, ' +
    'account_id INTEGER  not null, ' +
    'group_id INTEGER not null, ' +
    'updated_at BIGINT UNSIGNED, ' +
    'created_at BIGINT UNSIGNED, ' +
    'UNIQUE (account_id, group_id), ' +
    'FOREIGN KEY(group_id) REFERENCES groups (id) ON DELETE CASCADE, ' +
    'FOREIGN KEY(account_id) REFERENCES accounts (id) ON DELETE CASCADE)';

  CREATE_TABLE_PUBLIC_KEYS =
    'create table public_keys (id INTEGER PRIMARY KEY AUTO_INCREMENT, ' +
    'account_id INTEGER NOT NULL, ' +
    'public_key varchar(1024) not null, ' +
    'public_key_sig varchar(1024), ' +
    'created_at BIGINT UNSIGNED, ' +
    'FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE)';

  CREATE_TABLE_PERMISSIONS =
    'create table permissions (id INTEGER PRIMARY KEY AUTO_INCREMENT, ' +
    'group_id INTEGER, ' +
    'user varchar(512) not null, ' +
    'host varchar(512) not null, ' +
    'created_at BIGINT UNSIGNED, ' +
    'INDEX k_permissions_host_user (host, user),' +
    'CONSTRAINT permissions_group_id FOREIGN KEY(group_id) REFERENCES groups (id) ON DELETE CASCADE)';

  constructor(settings) {
    super(settings);
    const { host, port, username, password, database } = settings;
    const defaultOptions = {
      host: host,
      user: username,
      password,
      database,
      port: port || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
    let options;
    if (settings.options) {
      options = Object.assign(defaultOptions, settings.options);
    } else {
      options = defaultOptions;
    }
    this.db = mysql.createPool(options);
    this.client = this.getClient();
  }

  getEngine() {
    return 'mariadb';
  }

  getClient() {
    return new MariadbClient(this.db);
  }

  setClient(client) {
    this.client = client;
  }

  async createVersionTable() {
    const sqlCreateTable = 'create table _version (value int)';
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
    await this.client.run(this.CREATE_TABLE_ACCOUNTS);
    await this.client.run(this.CREATE_TABLE_PUBLIC_KEYS);
    await this.client.run(this.CREATE_TABLE_GROUPS);
    await this.client.run(this.CREATE_TABLE_PERMISSIONS);
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
        await this.client.run('alter table groups add updated_at BIGINT UNSIGNED');
      } catch (err) {}
    }
    if (fromVersion < 6) {
      try {
        await this.client.run('alter table public_keys add public_key_sig varchar(1024)');
      } catch (err) {}
    }
    if (fromVersion < 7) {
      await runV7migrationMariaDb(this.client);
    }
    if (fromVersion < 8) {
      await this.client.run('alter table accounts add expire_at BIGINT UNSIGNED not null default 0');
    }
    await this.updateVersion();
  }

  async flushDb() {
    console.log('Flushing db...');
    const tables = 'public_keys, groups_accounts, permissions, groups, accounts, _version'.split(',');
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
    return true;
  }
}

export default MariadbManager;
