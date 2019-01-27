import assert from 'assert';

import AppHelper from '../lib/helpers/AppHelper';

import {
  adminAddAccountKey,
  adminCreateAccount,
  adminDeleteAccountKey,
  adminGetAccount
} from '../lib/helpers/AdminHelper';
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
  },
  keys: {
    sign: true
  }
};

let ah;

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

describe('REQUIRE_SIGNED_KEY test account / keys', function() {
  this.timeout(10000);
  let db;
  before(async function() {
    ah = AppHelper(settings);
    try {
      db = await loadDb();
    } catch (err) {}
  });

  after(async function() {
    releaseDHInstance();
  });

  describe('with name and email and 1 key', function() {
    it('should return an error because key is not signed', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.2@example.com',
        keys: ['ssh-rsa AAAAB3Nza john.doe.2@debian']
      };
      let error;
      let resAccount;
      try {
        resAccount = await adminCreateAccount(db, reqAccount);
        console.error('not an error');
      } catch (e) {
        console.error('got error');
        error = e;
      }
      assert.notEqual(typeof error, 'undefined');
      assert.equal(typeof resAccount, 'undefined');
    });
    it('should return an account object with 1 key and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe.x',
        email: 'john.doe.x@example.com',
        keys: [{ key: 'ssh-rsa AAAAB3Nza john.doe.x@debian', signature: 'xxx' }]
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

      assert.equal(typeof resAccount.id, 'number');
      assert.equal(resAccount.name, reqAccount.name);
      assert.equal(resAccount.email, reqAccount.email);
      assert.equal(resAccount.active, 1);
      assert.equal(resAccount.public_keys.length, 1);
      assert.equal(resAccount.public_keys[0].public_key, reqAccount.keys[0].key);
      assert.equal(resAccount.public_keys[0].public_key_sig, reqAccount.keys[0].signature);
      assert.equal(resAccount.permissions.length, 0);
    });
  });

  describe('with name and email and 2 keys', function() {
    it('should return an account object with 2 keys and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.3@example.com',
        keys: [
          { key: 'ssh-rsa AAAAB3Nza john.doe.2@debian', signature: 'xxxx' },
          { key: 'ssh-rsa AAAAB3Nza john.doe.3@debian', signature: 'xxxxx' }
        ]
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

      assert.equal(typeof resAccount.id, 'number');
      assert.equal(resAccount.name, reqAccount.name);
      assert.equal(resAccount.email, reqAccount.email);
      assert.equal(resAccount.active, 1);
      assert.equal(resAccount.public_keys.length, 2);
      assert.equal(resAccount.public_keys[0].public_key, reqAccount.keys[0].key);
      assert.equal(resAccount.public_keys[0].public_key_sig, reqAccount.keys[0].signature);
      assert.equal(resAccount.public_keys[1].public_key, reqAccount.keys[1].key);
      assert.equal(resAccount.public_keys[1].public_key_sig, reqAccount.keys[1].signature);
      assert.equal(resAccount.permissions.length, 0);
    });
  });

  describe('add 1 key to an account', function() {
    it('should return an error because key is not signed', async function() {
      const keys = ['ssh-rsa AAAAB3Nza john.doe.2@debian'];
      let resAccount;
      let error;
      try {
        resAccount = await adminAddAccountKey(db, 1, keys);
      } catch (e) {
        error = e;
      }
      assert.notEqual(typeof error, 'undefined');
      assert.equal(typeof resAccount, 'undefined');
    });
    it('should return an account object with 1 key and no permissions', async function() {
      const keys = [{ key: 'ssh-rsa AAAAB3Nza john.doe.2@debian', signature: 'xxxx' }];

      const retKeys = await adminAddAccountKey(db, 1, keys);
      const resAccount = await adminGetAccount(db, 1);

      assert.equal(retKeys.account_id, 1);
      assert.equal(retKeys.public_keys.length, 1);
      assert.equal(retKeys.public_keys[0].public_key.key, keys[0].key);
      assert.equal(retKeys.public_keys[0].public_key.signature, keys[0].signature);
      assert.equal(resAccount.public_keys.length, 1);
      assert.equal(resAccount.public_keys[0].public_key, keys[0].key);
      assert.equal(resAccount.public_keys[0].public_key_sig, keys[0].signature);
    });
  });

  describe('delete 1 key to an account', function() {
    it('should return an account object with no key and no permissions', async function() {
      try {
        await adminDeleteAccountKey(db, 1, 4);
      } catch (err) {
        assert.equal(true, false);
      }
      const resAccount = await adminGetAccount(db, 1);
      assert.equal(resAccount.public_keys.length, 0);
    });
  });
});
