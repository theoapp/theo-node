import assert from 'assert';
import fs from 'fs';

import AppHelper from '../lib/helpers/AppHelper';
import SqliteManager from '../lib/managers/SqliteManager';
import SqliteHelper, { releaseSHInstance } from '../lib/helpers/SqliteHelper';
import {
  adminAddAccountKey,
  adminAddAccountPermission,
  adminCreateAccount,
  adminDeleteAccount,
  adminDeleteAccountKey,
  adminDeleteAccountPermission,
  adminEditAccount,
  adminGetAccount
} from '../lib/helpers/AdminHelper';

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
    }, 1000);
  });
};

const sm = new SqliteManager();

describe('Create account', function() {
  this.timeout(10000);
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

  describe('with nome and email', function() {
    it('should return an account object with no keys nor permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe@example.com'
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

      assert.equal(typeof resAccount.id, 'number');
      assert.equal(resAccount.name, reqAccount.name);
      assert.equal(resAccount.email, reqAccount.email);
      assert.equal(resAccount.active, 1);
      assert.equal(resAccount.public_keys.length, 0);
      assert.equal(resAccount.permissions.length, 0);
    });
  });

  describe('with nome and email and 1 key', function() {
    it('should return an account object with 1 key and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.2@example.com',
        keys: ['ssh-rsa AAAAB3Nza john.doe.2@debian']
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

      assert.equal(typeof resAccount.id, 'number');
      assert.equal(resAccount.name, reqAccount.name);
      assert.equal(resAccount.email, reqAccount.email);
      assert.equal(resAccount.active, 1);
      assert.equal(resAccount.public_keys.length, 1);
      assert.equal(resAccount.public_keys[0].public_key, reqAccount.keys[0]);
      assert.equal(resAccount.permissions.length, 0);
    });
  });

  describe('with nome and email and 2 keys', function() {
    it('should return an account object with 2 keys and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.3@example.com',
        keys: ['ssh-rsa AAAAB3Nza john.doe.2@debian', 'ssh-rsa AAAAB3Nza john.doe.3@debian']
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

      assert.equal(typeof resAccount.id, 'number');
      assert.equal(resAccount.name, reqAccount.name);
      assert.equal(resAccount.email, reqAccount.email);
      assert.equal(resAccount.active, 1);
      assert.equal(resAccount.public_keys.length, 2);
      assert.equal(resAccount.public_keys[0].public_key, reqAccount.keys[0]);
      assert.equal(resAccount.public_keys[1].public_key, reqAccount.keys[1]);
      assert.equal(resAccount.permissions.length, 0);
    });
  });

  describe('disable account', function() {
    it('should return an account object with active set to 0', async function() {
      await adminEditAccount(db, 1, false);
      const account = await adminGetAccount(db, 1);
      assert.equal(account.active, 0);
    });
  });

  describe('enable account', function() {
    it('should return an account object with active set to 1', async function() {
      await adminEditAccount(db, 1, true);
      const account = await adminGetAccount(db, 1);
      assert.equal(account.active, 1);
    });
  });

  describe('delete account', function() {
    it('should return 404', async function() {
      await adminDeleteAccount(db, 2);
      try {
        await adminGetAccount(db, 2);
        assert.equal(true, false);
      } catch (err) {
        assert.equal(err.t_code, 404);
      }
    });
  });

  describe('add 1 key to an account', function() {
    it('should return an account object with 1 key and no permissions', async function() {
      const keys = ['ssh-rsa AAAAB3Nza john.doe.2@debian'];

      const retKeys = await adminAddAccountKey(db, 1, keys);
      const resAccount = await adminGetAccount(db, 1);

      assert.equal(retKeys.account_id, 1);
      assert.equal(retKeys.public_keys.length, 1);
      assert.equal(retKeys.public_keys[0].public_key, keys[0]);
      assert.equal(resAccount.public_keys.length, 1);
      assert.equal(resAccount.public_keys[0].public_key, keys[0]);
    });
  });

  describe('delete 1 key to an account', function() {
    it('should return an account object with no key and no permissions', async function() {
      try {
        await adminDeleteAccountKey(db, 1, 4);
      } catch (err) {
        console.error(err);
        assert.equal(true, false);
      }
      const resAccount = await adminGetAccount(db, 1);
      assert.equal(resAccount.public_keys.length, 0);
    });
  });

  describe('add 1 permission to an account', function() {
    it('should return an account object with no key and 1 permission', async function() {
      const permission = {
        user: 'john',
        host: 'debian'
      };

      const retPermission = await adminAddAccountPermission(db, 1, permission.user, permission.host);
      const resAccount = await adminGetAccount(db, 1);

      assert.equal(retPermission.account_id, 1);
      assert.equal(typeof retPermission.permission_id, 'number');
      assert.equal(resAccount.permissions.length, 1);
      assert.equal(resAccount.permissions[0].user, permission.user);
      assert.equal(resAccount.permissions[0].host, permission.host);
    });
  });

  describe('delete 1 permission to an account', function() {
    it('should return an account object with no key and no permissions', async function() {
      try {
        await adminDeleteAccountPermission(db, 1, 1);
      } catch (err) {
        console.error(err);
        assert.equal(true, false);
      }
      const resAccount = await adminGetAccount(db, 1);
      assert.equal(resAccount.permissions.length, 0);
    });
  });
});
