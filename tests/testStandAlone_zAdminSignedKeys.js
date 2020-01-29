// Copyright 2019 AuthKeys srl
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

const publicKeySample4 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCb80xLc+9jKls1BzxK6/tZKchHZtdz+GFX+eVINDBx//j6Efgp3J8gg1dVI21rAnYb1GTY0P5wozqe2EzEBCKVvlJHjMjpXk+/dkzLkUcbDlL8F/Rv6pIOn0OqNOuWtQ1c8i7qnDA/EzIGrKpDIdL1vXDxEqgzZmRQgNtNJv6mDfkCXL3JQQAVsoTqypI+BSMktX06MjCKLBLsWJRIfUYSgS3yDg6c8Yg7n1yK5sgiNE1mBgZe+Y8VXMcpy3jaiVQ1ifnIPrkvm0oaqZBmYNLDEKkxA9PPMiMo4ZOOF5icXh7MKc9aunqpRZK22dQwJdYvEi57je+ojI63Vil5gXbr jolly3@newsvine.com';

const publicKeySample5 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDVO8IHg+FWdJwFaOm/uDyU+3RIS4vTJoNjx/OQpl3S+HrPPuQQTmnJ+EP4kw+izU11Jc/RNWYOSCcA12q5kLOSf7dBIf5RnExDLNNMDyd7GRUBpesBQEaXKv6nxaVb/CXNMPl7pFGdhy+XQPIo1ep2GI2d6digqg9xJs3/foUNM/gzW4tUE6toEzLZ6soV7/H9d0FiVPPg9YjAZhHt/v5xkEvlEZ3T8lUio7fohrWMtWtzt4HP9RzB+xNQEqIBqyhB9MOLTcMSDPFRcwnF6jB00DM2fXsYURe17PUUZCe1KCIkp96mtifY6R2MDa1jN6IhPMps0uo9AoxfUVVEbLDN jolly2@newsvine.com';

const publicKeySample6 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDBo5Qq0z3wP4Xh2ql4XzCT+ku35V8H9zBJ2k40pj6i/j5AZqT5VYjJ7+3vOZDsvLgHWXQf6nIjL1jO1uwQdXYqgOfwsrHHdlFPnX/YAQ2w1F67XvyGgoquDJUOJ2V94qRBuqh/doLMtfADT8pK1c3D1O+Q86yMZC60IXxWJzEF3FrlqoJySSCEkdEIEN2N5icqMvLw32f+70U1dVLsWsvpsQ5z86cp5bqe+xzS/vWFoq/sMGnGsm/0D+J2FwmPGTAk6Q5z7HmR5OYIsnT4wPz1is3Ubf6d6Hyi/aDpZrWzv9jrnvK7zKcHZWx3GOclZSCvrh7lnFrSlFiv6gJUZhVp jolly2@newsvine.com';

const publicSSH2Key = `---- BEGIN SSH2 PUBLIC KEY ----
Comment: "usern@hostrc"
AAAAB3NzaC1yc2EAAAABJQAAAQEAqIr9zeWOhGmL6kPmo5pqInlbR41NW/R9cfCR
b3PvasmOIJCZ5BBjlqmok3sBDVkwMvkOqYGkqhOceRzGoh9sTZsEMCgXs7LsRhA7
jjTxkqolwunn7OQ1DDHYdDFG61g0Mjs1WjvEd9lYeUwGF5ARGALxV+OEDTD/zi4Q
IKp5TjGKBoSGBLcU+KSfPcN4+vKMUBdoHMVBFIeXLTBeTzmtbGkg+q7bspPso4Kt
CHN0d7TQ7rBSgPSXgdkzXDcH0cfz3UV6fOG8wpfpxj3PVNXoF7sGFOARcEhYt65W
gzOsqCDwx8aS8MqO6JxWBvWRTRp1+tvoawMCYeksryiWfJT/JQ==
---- END SSH2 PUBLIC KEY ----`;

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
        keys: [{ key: publicKeySample4, signature: 'xxx' }]
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
        keys: [{ key: publicKeySample5, signature: 'xxxx' }, { key: publicKeySample6, signature: 'xxxxx' }]
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

  describe('add 1 SSH2 key to an account', function() {
    it('should throw an error because of signature', async function() {
      const keys = [{ key: publicSSH2Key, signature: 'xxxx' }];
      let retKeys;
      try {
        retKeys = await adminAddAccountKeys(db, 1, keys);
      } catch (e) {
        assert.strictEqual(e instanceof Error, true);
      }
      assert.strictEqual(retKeys, undefined);
    });
  });
});
