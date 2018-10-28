import assert from 'assert';

import AppHelper from '../lib/helpers/AppHelper';
import SqliteManager from '../lib/managers/SqliteManager';
import SqliteHelper, { releaseSHInstance } from '../lib/helpers/SqliteHelper';
import {
  adminAddAccountPermission,
  adminAddGroupPermission,
  adminCreateAccount,
  adminCreateGroup,
  adminCreateGroupAccount,
  adminGetAccount
} from '../lib/helpers/AdminHelper';
import accountsJson from './accounts';
import groupsJson from './groups';
import { getAuthorizedKeys } from '../lib/helpers/KeysHelper';

const settings = {
  admin: {
    token: ''
  },
  client: {
    tokens: []
  },
  sqlite: {
    path: ':memory:'
  },
  server: {
    http_port: 9100
  }
};

AppHelper(settings);
let sh;
const loadDb = function(sm) {
  return new Promise((resolve, reject) => {
    sh = SqliteHelper(settings.sqlite, sm);
    setTimeout(() => {
      resolve(sh.getDb());
    }, 1000);
  });
};

const loadData = async function(db) {
  for (let i = 0; i < accountsJson.length; i++) {
    const account = await adminCreateAccount(db, accountsJson[i]);
    for (let ii = 0; ii < accountsJson[i].permissions.length; ii++) {
      await adminAddAccountPermission(
        db,
        account.id,
        accountsJson[i].permissions[ii].user,
        accountsJson[i].permissions[ii].host
      );
    }
  }
  for (let i = 0; i < groupsJson.length; i++) {
    const group = await adminCreateGroup(db, { name: groupsJson[i].name });
    for (let ii = 0; ii < groupsJson[i].permissions.length; ii++) {
      const { user, host } = groupsJson[i].permissions[ii];
      await adminAddGroupPermission(db, group.id, user, host);
    }
    for (let ii = 0; ii < groupsJson[i].accounts.length; ii++) {
      const account = await adminGetAccount(db, groupsJson[i].accounts[ii].email);
      await adminCreateGroupAccount(db, group.id, account.id);
    }
  }
};

const sm = new SqliteManager();

describe('Check keys', function() {
  this.timeout(10000);
  let db;
  before(async function() {
    try {
      db = await loadDb(sm);
    } catch (err) {}
  });

  after(async function() {
    releaseSHInstance();
  });

  describe('check accounts creation', function() {
    before(async function() {
      await loadData(db);
    });
    it('should return an account object with right number of keys and permissions', async function() {
      const resAccount = await adminGetAccount(db, 1);
      assert.equal(resAccount.permissions.length, 5);
      assert.equal(resAccount.public_keys.length, 5);
    });
  });

  describe('check authorized_keys for user=mil and host=mil', function() {
    it('should return 14 rows', async function() {
      const res = await getAuthorizedKeys(db, 'mil', 'mil');
      assert.equal(res.split('\n').length, 14);
    });
  });

  describe('check authorized_keys for user=biz and host=com', function() {
    it('should return 13 rows', async function() {
      const res = await getAuthorizedKeys(db, 'biz', 'com');
      assert.equal(res.split('\n').length, 13);
    });
  });

  describe('check authorized_keys for user=unkown and host=unkown', function() {
    it('should return 1 rows (only Jolly user 3)', async function() {
      const res = await getAuthorizedKeys(db, 'unkown', 'unkown');
      assert.equal(res.split('\n').length, 1);
    });
  });

  describe('check authorized_keys for user=name and host=edu', function() {
    it('should return 10 rows per 4 users (5 + 2 + 2 + 1)', async function() {
      const res = await getAuthorizedKeys(db, 'name', 'edu');
      assert.equal(res.split('\n').length, 10);
    });
  });
});
