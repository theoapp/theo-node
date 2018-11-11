import DbManager from '../../managers/DbManager';
import sqlite3 from 'sqlite3';
import SqliteClient from './client';

const IN_MEMORY_DB = ':memory:';

class SqliteManager extends DbManager {
  dbVersion = 6;

  CREATE_TABLE_ACCOUNTS =
    'create table accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, email varchar(128), name varchar(128), ' +
    'active INTEGER, updated_at INTEGER, created_at INTEGER, UNIQUE (email))';

  CREATE_TABLE_GROUPS =
    'create table groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name varchar(128), active INTEGER, ' +
    'updated_at INTEGER, created_at INTEGER, UNIQUE (name))';

  CREATE_TABLE_GROUPS_ACCOUNTS =
    'create table groups_accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
    'account_id INTEGER, ' +
    'group_id INTEGER, ' +
    'updated_at INTEGER, ' +
    'created_at INTEGER, ' +
    'UNIQUE (account_id, group_id), ' +
    'FOREIGN KEY(group_id) REFERENCES groups (id) ON DELETE CASCADE, ' +
    'FOREIGN KEY(account_id) REFERENCES accounts (id) ON DELETE CASCADE)';

  CREATE_TABLE_PUBLIC_KEYS =
    'create table public_keys (id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
    'account_id INTEGER, ' +
    'public_key varchar(1024), ' +
    'public_key_sig varchar(1024), ' +
    'created_at INTEGER, ' +
    'FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE)';

  CREATE_TABLE_PERMISSIONS =
    'create table permissions (id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
    'group_id INTEGER, ' +
    'user varchar(512), ' +
    'host varchar(512), ' +
    'created_at INTEGER, ' +
    'FOREIGN KEY(group_id) REFERENCES groups (id) ON DELETE CASCADE)';

  CREATE_INDEX_PERMISSIONS = 'create index k_permissions_host_user on permissions (host, user)';

  constructor(options) {
    super(options);
    this.is_in_memory = options.storage === IN_MEMORY_DB;
    this.prepareDb(options.storage);
  }

  prepareDb(storage) {
    this.db = new sqlite3.Database(storage);
    this.db.run('PRAGMA foreign_keys = ON');
  }

  getEngine() {
    return 'sqlite';
  }

  getClient() {
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
    await this.updateVersion();
  }

  async flushDb() {
    if (this.is_in_memory) {
      this.close();
      this.prepareDb(IN_MEMORY_DB);
    } else {
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
    }
    return true;
  }
}

export default SqliteManager;
