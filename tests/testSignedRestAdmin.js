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

import dotenv from 'dotenv';

import assert from 'assert';
import fetch from 'node-fetch';

const base_url = process.env.THEO_URL || 'http://localhost:9100';
dotenv.config();

const publicKeySample2 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCb80xLc+9jKls1BzxK6/tZKchHZtdz+GFX+eVINDBx//j6Efgp3J8gg1dVI21rAnYb1GTY0P5wozqe2EzEBCKVvlJHjMjpXk+/dkzLkUcbDlL8F/Rv6pIOn0OqNOuWtQ1c8i7qnDA/EzIGrKpDIdL1vXDxEqgzZmRQgNtNJv6mDfkCXL3JQQAVsoTqypI+BSMktX06MjCKLBLsWJRIfUYSgS3yDg6c8Yg7n1yK5sgiNE1mBgZe+Y8VXMcpy3jaiVQ1ifnIPrkvm0oaqZBmYNLDEKkxA9PPMiMo4ZOOF5icXh7MKc9aunqpRZK22dQwJdYvEi57je+ojI63Vil5gXbr jolly3@newsvine.com';

const publicKeySample3 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDMODOr5BfHfde7yHPYVHDWfqgPbHvtFI9coTBoiLZjADbAAKCVLTL+tddnP7oCJBOM0TEC9ySptIv2kzAcPN6shkQs4Y8AWB2HgAl6cWzNmirRxmbVcUDM7a32q9uIiUHyQ6UIHUsyIaTeFtlldf0AT14r9ilaTRBCEH3r2u4xxVntVpJerBBZijsjfl1KN1N0bG9z9pHkpoUiJpIxGDhG1malhypRKffBSeNo4HNwAAA/SyvJq1jvGdBlZhbZK6kN+AnTdQnA8tSd1BhjXRv3uxUeGBHrYxnlaOvFCNjYsSARZO5iFNclgT/mOM75+luOzLmgf+X5h2y3VFZqjEax jolly2@newsvine.com';

const publicKeySample4 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCb80xLc+9jKls1BzxK6/tZKchHZtdz+GFX+eVINDBx//j6Efgp3J8gg1dVI21rAnYb1GTY0P5wozqe2EzEBCKVvlJHjMjpXk+/dkzLkUcbDlL8F/Rv6pIOn0OqNOuWtQ1c8i7qnDA/EzIGrKpDIdL1vXDxEqgzZmRQgNtNJv6mDfkCXL3JQQAVsoTqypI+BSMktX06MjCKLBLsWJRIfUYSgS3yDg6c8Yg7n1yK5sgiNE1mBgZe+Y8VXMcpy3jaiVQ1ifnIPrkvm0oaqZBmYNLDEKkxA9PPMiMo4ZOOF5icXh7MKc9aunqpRZK22dQwJdYvEi57je+ojI63Vil5gXbr jolly3@newsvine.com';

const publicKeySample5 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDVO8IHg+FWdJwFaOm/uDyU+3RIS4vTJoNjx/OQpl3S+HrPPuQQTmnJ+EP4kw+izU11Jc/RNWYOSCcA12q5kLOSf7dBIf5RnExDLNNMDyd7GRUBpesBQEaXKv6nxaVb/CXNMPl7pFGdhy+XQPIo1ep2GI2d6digqg9xJs3/foUNM/gzW4tUE6toEzLZ6soV7/H9d0FiVPPg9YjAZhHt/v5xkEvlEZ3T8lUio7fohrWMtWtzt4HP9RzB+xNQEqIBqyhB9MOLTcMSDPFRcwnF6jB00DM2fXsYURe17PUUZCe1KCIkp96mtifY6R2MDa1jN6IhPMps0uo9AoxfUVVEbLDN jolly2@newsvine.com';

const publicSSH2Key = `---- BEGIN SSH2 PUBLIC KEY ----
Comment: "usern@hostrc"
AAAAB3NzaC1yc2EAAAABJQAAAQEAqIr9zeWOhGmL6kPmo5pqInlbR41NW/R9cfCR
b3PvasmOIJCZ5BBjlqmok3sBDVkwMvkOqYGkqhOceRzGoh9sTZsEMCgXs7LsRhA7
jjTxkqolwunn7OQ1DDHYdDFG61g0Mjs1WjvEd9lYeUwGF5ARGALxV+OEDTD/zi4Q
IKp5TjGKBoSGBLcU+KSfPcN4+vKMUBdoHMVBFIeXLTBeTzmtbGkg+q7bspPso4Kt
CHN0d7TQ7rBSgPSXgdkzXDcH0cfz3UV6fOG8wpfpxj3PVNXoF7sGFOARcEhYt65W
gzOsqCDwx8aS8MqO6JxWBvWRTRp1+tvoawMCYeksryiWfJT/JQ==
---- END SSH2 PUBLIC KEY ----`;

const publicSSH2KeyOpenSSH =
  'ssh-rsa AAAAB3NzaC1yc2EAAAABJQAAAQEAqIr9zeWOhGmL6kPmo5pqInlbR41NW/R9cfCRb3PvasmOIJCZ5BBjlqmok3sBDVkwMvkOqYGkqhOceRzGoh9sTZsEMCgXs7LsRhA7jjTxkqolwunn7OQ1DDHYdDFG61g0Mjs1WjvEd9lYeUwGF5ARGALxV+OEDTD/zi4QIKp5TjGKBoSGBLcU+KSfPcN4+vKMUBdoHMVBFIeXLTBeTzmtbGkg+q7bspPso4KtCHN0d7TQ7rBSgPSXgdkzXDcH0cfz3UV6fOG8wpfpxj3PVNXoF7sGFOARcEhYt65WgzOsqCDwx8aS8MqO6JxWBvWRTRp1+tvoawMCYeksryiWfJT/JQ== usern@hostrc';

describe('REST Test account with REQUIRE_SIGNED_KEY=1', function() {
  this.timeout(10000);

  before(function() {
    return new Promise((resolve, reject) => {
      fetch(base_url + '/flushdb', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      })
        .then(res => {
          if (res.status !== 204) {
            reject(new Error('Expecting 204 got ' + res.status));
            return;
          }
          // I need to wait a bit..
          setTimeout(() => {
            resolve();
          }, 500);
        })
        .catch(e => {
          reject(e);
        });
    });
  });

  describe('with name and email and 1 key', function() {
    it('should return an error because key is not signed', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.2@example.com',
        keys: [publicKeySample2]
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.strictEqual(res.status, 400);
    });
  });

  describe('with name and email and 2 keys', function() {
    it('should return an account object with 2 keys and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.3@example.com',
        keys: [{ key: publicKeySample2, signature: 'xxxx' }, { key: publicKeySample3, signature: 'xxxxx' }]
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccount = await res.json();

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
      const keys = [publicKeySample4];

      const res = await fetch(base_url + '/accounts/1/keys', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ keys })
      });

      assert.strictEqual(res.status, 400);
    });

    it('should return success', async function() {
      const keys = [{ key: publicKeySample5, signature: 'xxxxxx' }];

      const res = await fetch(base_url + '/accounts/1/keys', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ keys })
      });

      assert.strictEqual(res.status, 200);
    });
  });

  describe('add 1 SSH2 key to an account', function() {
    it('should return success', async function() {
      const keys = [{ key: publicSSH2Key, signature: 'xxxxxx' }];

      const res = await fetch(base_url + '/accounts/1/keys', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ keys })
      });

      assert.strictEqual(res.status, 200);
    });
  });
});
