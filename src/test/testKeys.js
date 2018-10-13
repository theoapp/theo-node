import assert from 'assert';
import fs from 'fs';

import AppHelper from '../lib/helpers/AppHelper';
import SqliteManager from '../lib/managers/SqliteManager';
import SqliteHelper, { releaseSHInstance } from '../lib/helpers/SqliteHelper';
import { adminAddAccountPermission, adminCreateAccount, adminGetAccount } from '../lib/helpers/AdminHelper';
import accountsJson from './accounts';
import { getAuthorizedKeys } from '../lib/helpers/KeysHelper';

const dataPath = './data';

const settings = {
  admin: {
    token: ''
  },
  client: {
    tokens: []
  },
  sqlite: {
    path: dataPath + '/theo_test.db'
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
    }, 500);
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
};

const sm = new SqliteManager();

describe('Check keys', function() {
  this.timeout(5000);
  let db;
  before(async function() {
    try {
      fs.unlinkSync(settings.sqlite.path);
    } catch (err) {}
    try {
      fs.mkdirSync(dataPath);
    } catch (err) {}

    try {
      db = await loadDb(sm);
    } catch (err) {}
  });

  after(async function() {
    sh.closeDb();
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
});
