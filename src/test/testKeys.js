import assert from 'assert';

import AppHelper from '../lib/helpers/AppHelper';
import {
  adminAddAccountPermission,
  adminAddGroupPermission,
  adminCreateAccount,
  adminCreateGroup,
  adminCreateGroupAccount,
  adminEditAccount,
  adminGetAccount
} from '../lib/helpers/AdminHelper';
import accountsJson from './accounts';
import groupsJson from './groups';
import { getAuthorizedKeys } from '../lib/helpers/KeysHelper';
import DbHelper, { releaseDHInstance } from '../lib/helpers/DbHelper';

const settings = {
  admin: {
    token: ''
  },
  client: {
    tokens: []
  },
  db: {
    engine: 'sqlite',
    storage: ':memory:'
  },
  server: {
    http_port: 9100
  }
};

const ah = AppHelper(settings);
let dh;
const loadDb = function() {
  return new Promise((resolve, reject) => {
    let dm;
    try {
      dh = DbHelper(ah.getSettings('db'));
      dm = dh.getManager();
      if (!dm) {
        console.error('Unable to load DB Manager!!!');
        process.exit(99);
      }
      dh.init()
        .then(() => {
          resolve(dm.getClient());
        })
        .catch(e => {
          console.error('Failed to initialize db', e.message);
          console.error(e);
          process.exit(99);
        });
    } catch (e) {
      console.error('Failed to load DB Manager!!!', e.message);
      console.error(e);
      process.exit(99);
    }
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

describe('Check keys', function() {
  this.timeout(10000);
  let db;
  before(async function() {
    try {
      db = await loadDb();
    } catch (err) {}
  });

  after(async function() {
    releaseDHInstance();
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
      const { keys: res } = await getAuthorizedKeys(db, 'mil', 'mil');
      assert.equal(res.split('\n').length, 14);
    });
  });

  describe('check authorized_keys for user=biz and host=com', function() {
    it('should return 13 rows', async function() {
      const { keys: res } = await getAuthorizedKeys(db, 'biz', 'com');
      assert.equal(res.split('\n').length, 13);
    });
  });

  describe('check authorized_keys for user=unkown and host=unkown', function() {
    it('should return 1 rows (only Jolly user 3)', async function() {
      const { keys: res } = await getAuthorizedKeys(db, 'unkown', 'unkown');
      assert.equal(res.split('\n').length, 1);
    });
  });

  describe('check authorized_keys for user=name and host=edu', function() {
    it('should return 10 rows per 4 users (5 + 2 + 2 + 1)', async function() {
      const { keys: res } = await getAuthorizedKeys(db, 'name', 'edu');
      assert.equal(res.split('\n').length, 10);
    });
  });

  describe('check authorized_keys for user=name and host=edu after account expired', function() {
    it('should return 10 rows per 4 users (5 + 2 + 1)', async function() {
      const now = new Date().getTime();
      await adminEditAccount(db, 'scallar1b@1und1.de', undefined, now - 60000);
      const { keys: res } = await getAuthorizedKeys(db, 'name', 'edu');
      assert.equal(res.split('\n').length, 8);
    });
  });
});
