import DbManager from '../../managers/DbManager';
import { runV7migrationMariaDb } from '../../../migrations/v7fixGroups';
import { runV10migrationMariaDb } from '../../../migrations/v10fixGroups';
import { runV12migration } from '../../../migrations/v12fixFingerprints';
import { common_debug, common_error } from '../../utils/logUtils';
import ConnectionManager from './connectionmanager';

class MariadbManager extends DbManager {
  dbVersion = 13;

  CREATE_TABLE_AUTH_TOKENS =
    'create table auth_tokens (token varchar(128) binary PRIMARY KEY, assignee varchar(64) NOT NULL, type varchar(5) NOT NULL, created_at BIGINT UNSIGNED)';

  CREATE_TABLE_ACCOUNTS =
    'create table accounts (id INTEGER PRIMARY KEY AUTO_INCREMENT, email varchar(128) not null, name varchar(128) not null, ' +
    'active INTEGER not null default 1, expire_at BIGINT UNSIGNED not null default 0, updated_at BIGINT UNSIGNED, created_at BIGINT UNSIGNED, UNIQUE (email))';

  CREATE_TABLE_GROUPS =
    'create table tgroups (id INTEGER PRIMARY KEY AUTO_INCREMENT, name varchar(128) not null, is_internal tinyint(1) not null default 0, active INTEGER not null default 1, ' +
    'updated_at BIGINT UNSIGNED, created_at BIGINT UNSIGNED, UNIQUE (name))';

  CREATE_TABLE_GROUPS_ACCOUNTS =
    'create table groups_accounts (id INTEGER PRIMARY KEY AUTO_INCREMENT, ' +
    'account_id INTEGER  not null, ' +
    'group_id INTEGER not null, ' +
    'updated_at BIGINT UNSIGNED, ' +
    'created_at BIGINT UNSIGNED, ' +
    'UNIQUE (account_id, group_id), ' +
    'CONSTRAINT groups_accounts_group_id FOREIGN KEY(group_id) REFERENCES tgroups (id) ON DELETE CASCADE, ' +
    'CONSTRAINT groups_accounts_account_id FOREIGN KEY(account_id) REFERENCES accounts (id) ON DELETE CASCADE)';

  CREATE_TABLE_PUBLIC_KEYS =
    'create table public_keys (id INTEGER PRIMARY KEY AUTO_INCREMENT, ' +
    'account_id INTEGER NOT NULL, ' +
    'public_key varchar(1024) not null, ' +
    'public_key_sig varchar(1024), ' +
    'fingerprint varchar(1024), ' +
    'created_at BIGINT UNSIGNED, ' +
    'FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE)';

  CREATE_TABLE_PERMISSIONS =
    'create table permissions (id INTEGER PRIMARY KEY AUTO_INCREMENT, ' +
    'group_id INTEGER, ' +
    'user varchar(256) binary not null, ' +
    'host varchar(256) binary not null, ' +
    'created_at BIGINT UNSIGNED, ' +
    'INDEX k_permissions_host_user (host, user),' +
    'CONSTRAINT permissions_group_id FOREIGN KEY(group_id) REFERENCES tgroups (id) ON DELETE CASCADE)';

  connectionManager;

  constructor(settings) {
    super(settings);
    this.connectionManager = new ConnectionManager(settings);
  }

  getEngine() {
    return 'mariadb';
  }

  getClient(pool = false) {
    return this.connectionManager.getClient(pool);
  }

  setClient(client) {
    this.client = client;
  }

  async getCurrentVersion() {
    const sqlCheck = 'select value from _version';
    if (process.env.CLUSTER_MODE === '1') {
      await this.client.run('SET AUTOCOMMIT=0');
      let row;
      try {
        row = await this.client.get(`${sqlCheck} for update`);
        if (row.value === this.dbVersion) {
          common_debug('Version is equal: %s vs %s, set AUTOCOMMIT=1', row.value, this.dbVersion);
          await this.client.run('ROLLBACK');
          await this.client.run('SET AUTOCOMMIT=1');
        }
        return row;
      } catch (e) {
        await this.client.run('ROLLBACK');
        if (e.code === 'ER_NO_SUCH_TABLE') {
          return false;
        }
        common_error('Ooops: %s', e.message, e.code);
        throw e;
      }
    } else {
      try {
        return await this.client.get(sqlCheck);
      } catch (e) {
        if (e.code === 'ER_NO_SUCH_TABLE') {
          return false;
        }
        common_error('Ooops: %s', e.message, e.code);
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
      if (process.env.CLUSTER_MODE === '1') {
        await this.client.run('select value from _version for update');
      }
    } catch (e) {
      common_error('Unable to insert -1 version in _version table: [%s] %s', e.code, e.message);
      throw e;
    }
    return 0;
  }

  async initDb() {
    let dbConn;
    if (process.env.CLUSTER_MODE === '1') {
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
    await dbConn.run(this.CREATE_TABLE_GROUPS_ACCOUNTS);
    await this.updateVersion();
    if (process.env.CLUSTER_MODE === '1') {
      dbConn.close();
    }
  }

  async upgradeDb(fromVersion) {
    let dbConn;
    if (process.env.CLUSTER_MODE === '1') {
      dbConn = this.getClient();
      await dbConn.open();
    } else {
      dbConn = this.client;
    }
    if (fromVersion < 2) {
      await dbConn.run(this.CREATE_TABLE_PUBLIC_KEYS);
      const updatePublicKeys =
        'insert into public_keys (id, account_id, public_key, created_at) select id, account_id, public_key, created_at from keys';
      await dbConn.run(updatePublicKeys);
      await dbConn.run('drop table keys');
    }
    if (fromVersion < 3) {
      await dbConn.run(this.CREATE_TABLE_GROUPS);
      await dbConn.run(this.CREATE_TABLE_GROUPS_ACCOUNTS);
    }
    if (fromVersion < 4) {
      await dbConn.run('create table permissions_tmp as select * from permissions');
      await dbConn.run('drop table permissions');
      await dbConn.run(this.CREATE_TABLE_PERMISSIONS);
      await dbConn.run(
        'insert into permissions (id, account_id, user, host, created_at) select id, account_id, user, host, created_at from permissions_tmp'
      );
      await dbConn.run('drop table permissions_tmp');
    }
    if (fromVersion < 5) {
      try {
        await dbConn.run('alter table groups add updated_at BIGINT UNSIGNED');
      } catch (err) {}
    }
    if (fromVersion < 6) {
      try {
        await dbConn.run('alter table public_keys add public_key_sig varchar(1024)');
      } catch (err) {}
    }
    if (fromVersion < 7) {
      await runV7migrationMariaDb(dbConn);
    }
    if (fromVersion < 8) {
      await dbConn.run('alter table accounts add expire_at BIGINT UNSIGNED not null default 0');
    }
    if (fromVersion < 9) {
      await dbConn.run(this.CREATE_TABLE_AUTH_TOKENS);
    }
    if (fromVersion < 10) {
      await dbConn.run(this.CREATE_TABLE_GROUPS);
      await runV10migrationMariaDb(dbConn);
    }
    if (fromVersion === 10) {
      await dbConn.run('alter table tgroups add is_internal tinyint(1) not null default 0');
      await dbConn.run("update tgroups set is_internal = 1 where name like '%@%'");
    }
    if (fromVersion < 12) {
      await dbConn.run('alter table public_keys add fingerprint varchar(1024)');
      await runV12migration(dbConn);
    }
    if (fromVersion < 13) {
      await dbConn.run("alter table auth_tokens add assignee varchar(64) not null default '' after token");
      await dbConn.run("update auth_tokens set assignee = md5(token) where type = 'admin'");
    }
    if (process.env.CLUSTER_MODE === '1') {
      dbConn.close();
    }
    await this.updateVersion();
  }

  async updateVersion() {
    const sql = 'update _version set value = ' + this.dbVersion;
    if (process.env.CLUSTER_MODE === '1') {
      await this.client.run(sql);
      await this.client.run('COMMIT');
      return this.client.run('set AUTOCOMMIT=1');
    } else {
      return this.client.run(sql);
    }
  }

  async flushDb() {
    console.log('Flushing db...');
    const tables = 'public_keys, groups_accounts, permissions, tgroups, accounts, auth_tokens, _version'.split(',');
    for (let i = 0; i < tables.length; i++) {
      const sqlDrop = 'drop table ' + tables[i];
      try {
        await this.client.run(sqlDrop);
        common_debug('Dropped %s', tables[i]);
      } catch (e) {
        common_error('Failed to drop %s', tables[i]);
        console.error(e);
        // it doesn't exists
      }
    }
    return true;
  }

  close() {
    this.connectionManager.close();
  }
}

export default MariadbManager;
