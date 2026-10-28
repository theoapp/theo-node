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
import { describe, it, before } from 'mocha';
import assert from 'assert';
import { request } from 'undici';

import { tokensOne, tokensTwo, tokensThree } from './testCoreTokens';

dotenv.config();

const base_url = process.env.THEO_URL || 'http://localhost:9100';

const replicas = 3;

async function addPermission(instance, token, account_id, user, host) {
  if (!account_id) {
    throw new Error('account_id is undefined!!!');
  }
  await request(base_url + '/accounts/' + account_id + '/permissions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json; charset=utf-8',
      Host: instance
    },
    body: JSON.stringify({ user, host })
  });
}

async function createAccount(instance, token, account) {
  const { statusCode, body } = await request(base_url + '/accounts', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json; charset=utf-8',
      Host: instance
    },
    body: JSON.stringify(account)
  });
  if (statusCode > 299) {
    let error;
    try {
      error = await body.json();
    } catch (e) {
      throw new Error('Failed to create account');
    }
    throw new Error(error.reason || 'Failed to create account');
  }
  const resAccount = await body.json();
  for (let ii = 0; ii < account.permissions.length; ii++) {
    await addPermission(instance, token, resAccount.id, account.permissions[ii].user, account.permissions[ii].host);
  }
  return resAccount;
}

describe('Core', function () {
  before(async () => {
    await request(base_url + '/flushdb', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.CORE_TOKEN,
        Host: 'instance1'
      }
    });
  });
  describe('Send tokens to instance 1', function () {
    it('should return 204', async function () {
      const { statusCode } = await request(base_url + '/tokens', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.CORE_TOKEN,
          'Content-Type': 'application/json; charset=utf-8',
          Host: 'instance1'
        },
        body: JSON.stringify(tokensOne)
      });
      assert.strictEqual(statusCode, 204);
    });
  });
  describe('Send tokens to instance 2', function () {
    it('should return 204', async function () {
      const { statusCode } = await request(base_url + '/tokens', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.CORE_TOKEN,
          'Content-Type': 'application/json; charset=utf-8',
          Host: 'instance2'
        },
        body: JSON.stringify(tokensTwo)
      });
      assert.strictEqual(statusCode, 204);
    });
  });
  describe('Send tokens to instance 3', function () {
    it('should return 204', async function () {
      const { statusCode } = await request(base_url + '/tokens', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.CORE_TOKEN,
          'Content-Type': 'application/json; charset=utf-8',
          Host: 'instance3'
        },
        body: JSON.stringify(tokensThree)
      });
      assert.strictEqual(statusCode, 204);
    });
  });
  describe('Check agent tokens', function () {
    it('should return 401 for token1 -> instance2', async function () {
      const { statusCode } = await request(base_url + '/authorized_keys/test/tset', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensOne.tokens.clients[0],
          Accept: 'application/json',
          Host: 'instance2'
        }
      });
      assert.strictEqual(statusCode, 401);
    });
    it('should return 401 for token1 -> instance3', async function () {
      const { statusCode } = await request(base_url + '/authorized_keys/test/tset', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensOne.tokens.clients[0],
          Accept: 'application/json',
          Host: 'instance3'
        }
      });
      assert.strictEqual(statusCode, 401);
    });
    it('should return 200 for token1 -> instance1', async function () {
      const { statusCode } = await request(base_url + '/authorized_keys/test/tset', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensOne.tokens.clients[0],
          Accept: 'application/json',
          Host: 'instance1'
        }
      });
      assert.strictEqual(statusCode, 200);
    });
    it('should return 200 for token2 -> instance2', async function () {
      const { statusCode } = await request(base_url + '/authorized_keys/test/tset', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensTwo.tokens.clients[0],
          Accept: 'application/json',
          Host: 'instance2'
        }
      });
      assert.strictEqual(statusCode, 200);
    });
    it('should return 200 for token3 -> instance3', async function () {
      const { statusCode } = await request(base_url + '/authorized_keys/test/tset', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensThree.tokens.clients[0],
          Accept: 'application/json',
          Host: 'instance3'
        }
      });
      assert.strictEqual(statusCode, 200);
    });
  });
  describe('Check admin tokens', function () {
    it('should return 200 for token1 -> instance1', async function () {
      const { statusCode } = await request(base_url + '/accounts', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensOne.tokens.admins[0].token,
          Accept: 'application/json',
          Host: 'instance1'
        }
      });
      assert.strictEqual(statusCode, 200);
    });
    it('should return 200 for token2 -> instance2', async function () {
      const { statusCode } = await request(base_url + '/accounts', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensTwo.tokens.admins[0].token,
          Accept: 'application/json',
          Host: 'instance2'
        }
      });
      assert.strictEqual(statusCode, 200);
    });
    it('should return 200 for token3 -> instance3', async function () {
      const { statusCode } = await request(base_url + '/accounts', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensThree.tokens.admins[0].token,
          Accept: 'application/json',
          Host: 'instance3'
        }
      });
      assert.strictEqual(statusCode, 200);
    });
    it('should return 401 for token1 -> instance2', async function () {
      const { statusCode } = await request(base_url + '/accounts', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensOne.tokens.admins[0].token,
          Accept: 'application/json',
          Host: 'instance2'
        }
      });
      assert.strictEqual(statusCode, 401);
    });
    it('should return 401 for token1 -> instance3', async function () {
      const { statusCode } = await request(base_url + '/accounts', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensOne.tokens.admins[0].token,
          Accept: 'application/json',
          Host: 'instance3'
        }
      });
      assert.strictEqual(statusCode, 401);
    });
  });
  describe('create accounts on instance1', function () {
    const account = {
      name: 'User A instance 1',
      email: 'user-a@instance.one',
      keys: [
        {
          key:
            'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDeJ37wvqUSUo2fi+cTlr7HcOO565SY+B8uyjMcMPZMCv7q63XU6KYlS9DZGxNuB9ZR/dPoI+aXRrXrP9fxJQTSOz3lw4MwS0NsBT7t6HBqqWdW+MPWWMnRy1fa3J/jVAM3WxrKcVZBM0Be9FTjZycbX5SDCNUG1AwG875axt3cBTw4BoeaJBJNWEjIGmiN4K7dAquP+PR5FbDxBi+pgs08pThks1hMarUf8d+a7oJBS5xGAtZljm/O+yKSWH11vu8oebFbjulPM8pQxgZCjT0kovgXOAbImFEpKkZSOD17HzS/qa310izby2uNP0YNIfHLCvfDg05Mxelou/HfWhKV user-a@instance.one',
          signature: 'xxx'
        },
        {
          key:
            'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDjmGJtT5XWRnnLaa+ROk1Ey30iP5WUwcYF+WXf2q8oTyv1cOODYF0o7I/y6byGpA9Z5FVkmaa7G5Alfi4q99K3/vTo6D9CeSE+BEw+LdO7eAbEC5MeTnW9ECftuK45NkkJ450tY7qKrLj+Q4uCso5UusFmheEyTh17xpH34lFBJxLAY7SCpHXJ8lheNTwdKQYBkmwtHlyCiSoa5TvJpKJST1sFhPXKE5srCQ9UcTGVp5CW0+cLQQYIboJYu1CQGcakWs7T1/0qo1z3S0C4baMmNB83ARrUO6XXD/Hr3TEgsDR3GhtnXF8WXv/Uwqtxsl3IIOZL2npQlGgTPUrBmQnh user-a@instance.one',
          signature: 'xxx'
        }
      ],
      permissions: [
        {
          user: 'account-1-a',
          host: 'node-a-1'
        },
        {
          user: 'accounts-2-a',
          host: '%-n-1'
        }
      ]
    };
    it('should return 200 for ' + account.email, async function () {
      const _account = await createAccount('instance1', tokensOne.tokens.admins[0].token, account);
      assert.strictEqual(typeof _account, 'object');
    });
    it('should return 200 for token1 -> instance1 (and 2 keys)', async function () {
      let replicaChecker = 0;
      const replicasSeen = [];
      while (replicasSeen.length < replicas) {
        const { statusCode, headers, body } = await request(base_url + '/authorized_keys/node-a-1/account-1-a', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.clients[0],
            Accept: 'application/json',
            Host: 'instance1'
          }
        });
        const replica = headers['x-served-by'];
        if (!replicasSeen.includes(replica)) {
          replicasSeen.push(replica);
        }
        assert.strictEqual(statusCode, 200);
        const data = await body.json();
        assert.strictEqual(data.length, 2);
        const emails = data.reduce((emails, key) => {
          if (!emails.includes(key.email)) {
            emails.push(key.email);
          }
          return emails;
        }, []);
        assert.deepStrictEqual(emails, [account.email]);
        replicaChecker++;
        assert.strictEqual(
          replicaChecker < replicas * 5,
          true,
          'failed to see all replicas in ' + replicaChecker + ' calls, saw ' + replicasSeen.length
        );
      }
    });
    it('should return 200 for token2 -> instance2 (and 0 keys)', async function () {
      let replicaChecker = 0;
      const replicasSeen = [];
      while (replicasSeen.length < replicas) {
        const { statusCode, headers, body } = await request(base_url + '/authorized_keys/node-a-1/account-1-a', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensTwo.tokens.clients[0],
            Accept: 'application/json',
            Host: 'instance2'
          }
        });
        const replica = headers['x-served-by'];
        if (!replicasSeen.includes(replica)) {
          replicasSeen.push(replica);
        }
        assert.strictEqual(statusCode, 200);
        const data = await body.json();
        assert.strictEqual(data.length, 0);
        replicaChecker++;
        assert.strictEqual(
          replicaChecker < replicas * 5,
          true,
          'failed to see all replicas in ' + replicaChecker + ' calls, saw ' + replicasSeen.length
        );
      }
    });
  });
  describe('create accounts on instance2', function () {
    const account = {
      name: 'User B instance 2',
      email: 'user-b@instance.one',
      keys: [
        {
          key:
            'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDeJ37wvqUSUo2fi+cTlr7HcOO565SY+B8uyjMcMPZMCv7q63XU6KYlS9DZGxNuB9ZR/dPoI+aXRrXrP9fxJQTSOz3lw4MwS0NsBT7t6HBqqWdW+MPWWMnRy1fa3J/jVAM3WxrKcVZBM0Be9FTjZycbX5SDCNUG1AwG875axt3cBTw4BoeaJBJNWEjIGmiN4K7dAquP+PR5FbDxBi+pgs08pThks1hMarUf8d+a7oJBS5xGAtZljm/O+yKSWH11vu8oebFbjulPM8pQxgZCjT0kovgXOAbImFEpKkZSOD17HzS/qa310izby2uNP0YNIfHLCvfDg05Mxelou/HfWhKV user-b@instance.one',
          signature: 'xxx'
        }
      ],
      permissions: [
        {
          user: 'account-1-a',
          host: 'node-a-2'
        },
        {
          user: 'account-2-a',
          host: '%-n-2'
        }
      ]
    };
    it('should create an account ', async function () {
      const _account = await createAccount('instance2', tokensTwo.tokens.admins[0].token, account);
      assert.strictEqual(typeof _account, 'object');
    });
    it('should return 200 for token2 -> instance2 (and 1 key)', async function () {
      let replicaChecker = 0;
      const replicasSeen = [];
      while (replicasSeen.length < replicas) {
        const { statusCode, headers, body } = await request(base_url + '/authorized_keys/test-n-2/account-2-a', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensTwo.tokens.clients[0],
            Accept: 'application/json',
            Host: 'instance2'
          }
        });
        const replica = headers['x-served-by'];
        if (!replicasSeen.includes(replica)) {
          replicasSeen.push(replica);
        }
        assert.strictEqual(statusCode, 200);
        const data = await body.json();
        assert.strictEqual(data.length, 1);

        assert.strictEqual(data[0].email, account.email);
        replicaChecker++;
        assert.strictEqual(
          replicaChecker < replicas * 5,
          true,
          'failed to see all replicas in ' + replicaChecker + ' calls, saw ' + replicasSeen.length
        );
      }
    });
    it('should return 200 for token3 -> instance3 (and 0 keys)', async function () {
      let replicaChecker = 0;
      const replicasSeen = [];
      while (replicasSeen.length < replicas) {
        const { statusCode, headers, body } = await request(base_url + '/authorized_keys/test-n-2/account-2-a', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensThree.tokens.clients[0],
            Accept: 'application/json',
            Host: 'instance3'
          }
        });
        const replica = headers['x-served-by'];
        if (!replicasSeen.includes(replica)) {
          replicasSeen.push(replica);
        }
        assert.strictEqual(statusCode, 200);
        const data = await body.json();
        assert.strictEqual(data.length, 0);
        replicaChecker++;
        assert.strictEqual(
          replicaChecker < replicas * 5,
          true,
          'failed to see all replicas in ' + replicaChecker + ' calls, saw ' + replicasSeen.length
        );
      }
    });
  });
});
