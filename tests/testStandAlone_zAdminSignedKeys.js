import assert from 'assert';

import AppHelper from '../src/lib/helpers/AppHelper';

import {
  adminAddAccountKeys,
  adminCreateAccount,
  adminDeleteAccountKey,
  adminGetAccount
} from '../src/lib/helpers/AdminHelper';
import DbHelper, { releaseDHInstance } from '../src/lib/helpers/DbHelper';

const publicKeySample =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCoUQGPAFUl3xBX+1vxm/o1v4G1KHqXlvg/pVAHrs89isBTcXwNoo4C1YWjF0TCRjhltfvNMNYF8Q1fzEw1anjL+9X26GlXEXr4Nx9MIFFiEiTpUSPGlT13TOIIKW9eEQc9vHydgK1NdpEgz23kcPARWvXbcVtwoLDwfsE1Msvg1qWIN4UiDau/FTetFaq8fcXd3Cun0V+v5DLEfhSB3gNSxWwhdAEaQIpPSJk8VSHKiaOtQ6Besgw8+mjA5u0Mvm4Z9luZ8b7Ky2gUn49HwM/ez7KC9BhoiTsoE8iXjF11J3ttqju0wADZ4P8OQ7y6l7rgNqXyHejhLutvdI3ka3X/ jolly1@newsvine.com';

const publicKeySample2 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCb80xLc+9jKls1BzxK6/tZKchHZtdz+GFX+eVINDBx//j6Efgp3J8gg1dVI21rAnYb1GTY0P5wozqe2EzEBCKVvlJHjMjpXk+/dkzLkUcbDlL8F/Rv6pIOn0OqNOuWtQ1c8i7qnDA/EzIGrKpDIdL1vXDxEqgzZmRQgNtNJv6mDfkCXL3JQQAVsoTqypI+BSMktX06MjCKLBLsWJRIfUYSgS3yDg6c8Yg7n1yK5sgiNE1mBgZe+Y8VXMcpy3jaiVQ1ifnIPrkvm0oaqZBmYNLDEKkxA9PPMiMo4ZOOF5icXh7MKc9aunqpRZK22dQwJdYvEi57je+ojI63Vil5gXbr jolly3@newsvine.com';

const publicKeySample3 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDMODOr5BfHfde7yHPYVHDWfqgPbHvtFI9coTBoiLZjADbAAKCVLTL+tddnP7oCJBOM0TEC9ySptIv2kzAcPN6shkQs4Y8AWB2HgAl6cWzNmirRxmbVcUDM7a32q9uIiUHyQ6UIHUsyIaTeFtlldf0AT14r9ilaTRBCEH3r2u4xxVntVpJerBBZijsjfl1KN1N0bG9z9pHkpoUiJpIxGDhG1malhypRKffBSeNo4HNwAAA/SyvJq1jvGdBlZhbZK6kN+AnTdQnA8tSd1BhjXRv3uxUeGBHrYxnlaOvFCNjYsSARZO5iFNclgT/mOM75+luOzLmgf+X5h2y3VFZqjEax jolly2@newsvine.com';

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
        keys: [publicKeySample]
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
      assert.notStrictEqual(typeof error, 'undefined');
      assert.strictEqual(typeof resAccount, 'undefined');
    });
    it('should return an account object with 1 key and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe.x',
        email: 'john.doe.x@example.com',
        keys: [{ key: publicKeySample3, signature: 'xxx' }]
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

      assert.strictEqual(typeof resAccount.id, 'number');
      assert.strictEqual(resAccount.name, reqAccount.name);
      assert.strictEqual(resAccount.email, reqAccount.email);
      assert.strictEqual(resAccount.active, 1);
      assert.strictEqual(resAccount.public_keys.length, 1);
      assert.strictEqual(resAccount.public_keys[0].public_key_sig, reqAccount.keys[0].signature);
      assert.strictEqual(resAccount.public_keys[0].public_key, reqAccount.keys[0].key);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('with name and email and 2 keys', function() {
    it('should return an account object with 2 keys and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.3@example.com',
        keys: [{ key: publicKeySample, signature: 'xxxx' }, { key: publicKeySample2, signature: 'xxxxx' }]
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

      assert.strictEqual(typeof resAccount.id, 'number');
      assert.strictEqual(resAccount.name, reqAccount.name);
      assert.strictEqual(resAccount.email, reqAccount.email);
      assert.strictEqual(resAccount.active, 1);
      assert.strictEqual(resAccount.public_keys.length, 2);
      assert.strictEqual(resAccount.public_keys[0].public_key, reqAccount.keys[0].key);
      assert.strictEqual(resAccount.public_keys[0].public_key_sig, reqAccount.keys[0].signature);
      assert.strictEqual(resAccount.public_keys[1].public_key, reqAccount.keys[1].key);
      assert.strictEqual(resAccount.public_keys[1].public_key_sig, reqAccount.keys[1].signature);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('add 1 key to an account', function() {
    it('should return an error because key is not signed', async function() {
      const keys = [publicKeySample];
      let resAccount;
      let error;
      try {
        resAccount = await adminAddAccountKeys(db, 1, keys);
      } catch (e) {
        error = e;
      }
      assert.notStrictEqual(typeof error, 'undefined');
      assert.strictEqual(typeof resAccount, 'undefined');
    });
    it('should return an account object with 1 key and no permissions', async function() {
      const keys = [{ key: publicKeySample, signature: 'xxxx' }];

      const retKeys = await adminAddAccountKeys(db, 1, keys);
      const resAccount = await adminGetAccount(db, 1);

      assert.strictEqual(retKeys.account_id, 1);
      assert.strictEqual(retKeys.public_keys.length, 1);
      assert.strictEqual(retKeys.public_keys[0].public_key.key, keys[0].key);
      assert.strictEqual(retKeys.public_keys[0].public_key.signature, keys[0].signature);
      assert.strictEqual(resAccount.public_keys.length, 1);
      assert.strictEqual(resAccount.public_keys[0].public_key, keys[0].key);
      assert.strictEqual(resAccount.public_keys[0].public_key_sig, keys[0].signature);
    });
  });

  describe('delete 1 key to an account', function() {
    it('should return an account object with no key and no permissions', async function() {
      try {
        await adminDeleteAccountKey(db, 1, 4);
      } catch (err) {
        assert.strictEqual(true, false);
      }
      const resAccount = await adminGetAccount(db, 1);
      assert.strictEqual(resAccount.public_keys.length, 0);
    });
  });
});
