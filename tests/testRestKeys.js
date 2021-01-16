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
import accountsJson from './accounts';
import groupsJson from './groups';

const base_url = process.env.THEO_URL || 'http://localhost:9100';

dotenv.config();

const awaitTimeout = ms => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

const addPermission = async (account_id, user, host) => {
  await fetch(base_url + '/accounts/' + account_id + '/permissions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({ user, host })
  });
};

const createAccount = async account => {
  const res = await fetch(base_url + '/accounts', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(account)
  });
  const resAccount = await res.json();
  for (let ii = 0; ii < account.permissions.length; ii++) {
    await addPermission(resAccount.id, account.permissions[ii].user, account.permissions[ii].host);
  }
  return resAccount;
};

const addGroupPermission = async (group_id, user, host) => {
  await fetch(base_url + '/groups/' + group_id + '/permissions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({ user, host })
  });
};
const addGroupAccount = async (group_id, account_id) => {
  await fetch(base_url + '/groups/' + group_id, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({ id: account_id })
  });
};
const getAccountByEmail = async email => {
  const res = await fetch(base_url + '/accounts/' + email, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
    }
  });
  return res.json();
};

const createGroup = async group => {
  const res = await fetch(base_url + '/groups', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({ name: group.name })
  });
  const resGroup = await res.json();

  for (let ii = 0; ii < group.permissions.length; ii++) {
    const { user, host } = group.permissions[ii];
    await addGroupPermission(resGroup.id, user, host);
  }

  for (let ii = 0; ii < group.accounts.length; ii++) {
    const account = await getAccountByEmail(group.accounts[ii].email);
    await addGroupAccount(resGroup.id, account.id);
  }
};

const loadData = async function() {
  for (let i = 0; i < accountsJson.length; i++) {
    await createAccount(accountsJson[i]);
  }
  for (let i = 0; i < groupsJson.length; i++) {
    await createGroup(groupsJson[i]);
  }
};

describe('REST Check keys', function() {
  this.timeout(10000);

  before(function(done) {
    fetch(base_url + '/flushdb', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
      }
    })
      .then(res => {
        if (res.status !== 204) {
          done(new Error('Expecting 204 got ' + res.status));
          return;
        }
        // I need to wait a bit..
        setTimeout(() => {
          loadData()
            .then(() => {
              done();
            })
            .catch(e => {
              done(e);
            });
        }, 500);
      })
      .catch(e => {
        done(e);
      });
  });

  describe('check accounts creation', function() {
    it('should return an account object with right number of keys and permissions', async function() {
      const resAccount = await getAccountByEmail('tevery0@newsvine.com');
      assert.strictEqual(resAccount.permissions.length, 5);
      assert.strictEqual(resAccount.public_keys.length, 5);
    });
  });

  describe('check authorized_keys with no Authorization header', function() {
    it('should return en error 401', async function() {
      const res = await fetch(base_url + '/authorized_keys/mil/mil', {
        method: 'GET'
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      const data = await res.json();
      assert.strictEqual(data.status, 401);
    });
  });

  describe('check authorized_keys with wrong Authorization header', function() {
    it('should return en error 401', async function() {
      const res = await fetch(base_url + '/authorized_keys/mil/mil', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer 123456789poiuyt'
        }
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      const data = await res.json();
      assert.strictEqual(data.status, 401);
    });
  });

  describe('check authorized_keys for user=mil and host=mil', function() {
    it('should return 14 rows', async function() {
      const res = await fetch(base_url + '/authorized_keys/mil/mil', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.CLIENT_TOKENS.split(',')[0]
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'text/plain; charset=utf-8');
      const text = await res.text();
      assert.strictEqual(text.split('\n').length, 14);
    });
  });

  describe('check authorized_keys for user=biz and host=com', function() {
    it('should return 13 rows', async function() {
      const res = await fetch(base_url + '/authorized_keys/biz/com', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.CLIENT_TOKENS.split(',')[0]
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'text/plain; charset=utf-8');
      const text = await res.text();
      assert.strictEqual(text.split('\n').length, 13);
    });
  });

  describe('check authorized_keys for user=unkown and host=unkown', function() {
    it('should return 1 rows (only Jolly user 3)', async function() {
      const res = await fetch(base_url + '/authorized_keys/unkown/unkown', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.CLIENT_TOKENS.split(',')[0]
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'text/plain; charset=utf-8');
      const text = await res.text();
      assert.strictEqual(text.split('\n').length, 1);
    });
  });

  describe('check authorized_keys for user=name and host=edu', function() {
    it('should return 10 rows per 4 users (5 + 2 + 2 + 1)', async function() {
      const res = await fetch(base_url + '/authorized_keys/edu/name', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.CLIENT_TOKENS.split(',')[0]
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'text/plain; charset=utf-8');
      const text = await res.text();
      assert.strictEqual(text.split('\n').length, 10);
    });
  });

  describe('add new account and check authorized_keys for user=name and host=edu', function() {
    it('should return 12 rows per 5 users (5 + 2 + 2 + 1 + 2)', async function() {
      const account = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        keys: [
          'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQDp0MT4xqNq8B0OtIykxetl9A2oQScEJvGNsMXI3qEhs1hIQIV5pmGehblq12Erahe/FpPFH+gavhFtF3E57mm410duyAdY0fiU81Ay49+IkP+GrLZJq52qVstp+/NlkishI3RsU2le/b2Ei4u5toI9j/fiJYxmCMTuyNYifcVRCw== scallar1b@1und1.de',
          'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQDCXq8CooC0e0AW4kCdxHR9GZf2VN1RXnp7zMVBsqcbRQWpq9/2w7LGybuFwmMPN0D0tCk9yLQFxIV49iAzenXYFGUdyw7lKMEPhxA7h7Hs/z3ccfIsY7rYyKpr3ekGUw/Og/V1W8CY/iULPfKT5OPpfIGf3RTcwdzLlwcfVcgTbw== scallar1b@1und1.de'
        ],
        permissions: [
          {
            user: 'name',
            host: 'edu'
          }
        ]
      };
      await createAccount(account);
      const res = await fetch(base_url + '/authorized_keys/edu/name', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.CLIENT_TOKENS.split(',')[0]
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'text/plain; charset=utf-8');
      const text = await res.text();
      assert.strictEqual(text.split('\n').length, 12);
    });
  });

  describe('add 2 accounts and add them to group, check authorized_keys for user=name and host=edu', function() {
    it('should return 16 rows per 7 users (5 + 2 + 2 + 1 + 2 + 2 + 2)', async function() {
      const account = {
        name: 'John Doe 2',
        email: 'john.doe2@example.com',
        keys: [
          'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQC4IQHQc96XU7Te7kOOJ6wxb895Ak4jt24AJ95rQ8UnxD/aPDsRlZAQUQlJiis6oCi+/RHRxjg6zwHIWpQa9vPa2qyDe9k6GMN0Ks2OTkg9ULWmzqbobKwUVusv/QgxTrCk4cSuwvNcrEBw4JtZH9hWWRCwUdUlEc3aJovjOTUraw== eyurmanovev16@gmpg.org',
          'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQCg2RksaYjPZ+vt1/ooBEV5Fcdz0WgIrqiNLsl3sO8ziApdGFyzHhvVeUzv4Pai8CFcg8iYE+OFXmXcvY2jInCToGDG9a8dAGqlhfM81Y7R1pgQSjqb8TamfN5fQPN4Zf2NbT/w5Mcsrmdy4f7KbUQXmgKJwC+rszsZXR+994IsLw== eyurmanovev16@gmpg.org'
        ],
        permissions: []
      };
      const resAccount = await createAccount(account);
      const account2 = {
        name: 'John Doe 3',
        email: 'john.doe3@example.com',
        keys: [
          'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQDEs5Oqyx6/BBM38Jvhsu+PJ4Iu3/4FlnfYYeqfeArnCNMbDnifuXIGe3kjAj7ouuTHRq/O0fLkFEuELNCHLSYgF6bgXVFIvlScGZCCdD/Mo7/7Hbu75ntdNCy9u5ESQw+mT/xGLbFQs3ZMpYfk9GwLdkv1kLHVXEyhUcsSqj0q2w== ebatchley17@friendfeed.com',
          'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQCzSYlwjDYqS4mI6RuTFu5hFkgMqE7oOb2ads33wIN2av1kE/+elmvX4m/Iz+eu7lr9S66g6C3oYR+yzz0T5xLkBH2PLt+W/tctEQGev6IIU3d3I2cknSogVVweTwQLHLOi7A7DPAPFFIIfsf1vOO6zpTK3CxTmQKZ4vDUj/rD11w== ebatchley17@friendfeed.com'
        ],
        permissions: []
      };
      const resAccount2 = await createAccount(account2);
      await addGroupAccount(groupsJson[0].name, resAccount.id);
      await addGroupAccount(groupsJson[0].name, resAccount2.id);
      const res = await fetch(base_url + '/authorized_keys/edu/name', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.CLIENT_TOKENS.split(',')[0]
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'text/plain; charset=utf-8');
      const text = await res.text();
      assert.strictEqual(text.split('\n').length, 16);
    });
  });

  describe('disable 1 account from group, check authorized_keys for user=name and host=edu', function() {
    it('should return 14 rows per 6 users (5 + 2 + 2 + 1 + 2 + 2)', async function() {
      const resAccount = await getAccountByEmail('john.doe2@example.com');
      await fetch(base_url + '/accounts/' + resAccount.id, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ active: 0 })
      });

      const res = await fetch(base_url + '/authorized_keys/edu/name', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.CLIENT_TOKENS.split(',')[0]
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'text/plain; charset=utf-8');
      const text = await res.text();
      assert.strictEqual(text.split('\n').length, 14);
    });
  });

  describe('remove 1 account from group, check authorized_keys for user=name and host=edu', function() {
    it('should return 12 rows per 5 users (5 + 2 + 2 + 1 + 2)', async function() {
      const resAccount = await getAccountByEmail('asiemantel1c@redcross.org');
      const res2 = await fetch(base_url + '/groups/' + groupsJson[0].name + '/' + resAccount.id, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res2.status, 204);

      await awaitTimeout(400);
      const res = await fetch(base_url + '/authorized_keys/edu/name', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.CLIENT_TOKENS.split(',')[0]
        }
      });
      assert.strictEqual(res.status, 200);
      const fromCache = res.headers.get('X-From-Cache');
      assert.strictEqual(fromCache, 'false');
      assert.strictEqual(res.headers.get('content-type'), 'text/plain; charset=utf-8');
      const text = await res.text();
      assert.strictEqual(text.split('\n').length, 12);
    });
    if (process.env.THEO_USE_CACHE === '1') {
      it('should return 12 rows per 5 users (5 + 2 + 2 + 1 + 2) with X-From-Cache', async function() {
        const res = await fetch(base_url + '/authorized_keys/edu/name', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + process.env.CLIENT_TOKENS.split(',')[0]
          }
        });
        assert.strictEqual(res.status, 200);
        const fromCache = res.headers.get('X-From-Cache');
        assert.strictEqual(fromCache, 'true');
        assert.strictEqual(res.headers.get('content-type'), 'text/plain; charset=utf-8');
        const text = await res.text();
        assert.strictEqual(text.split('\n').length, 12);
      });
    }
  });

  describe('remove group, check authorized_keys for user=name and host=edu', function() {
    it('should return 10 rows per 4 users (5 + 2 + 1 + 2)', async function() {
      const res2 = await fetch(base_url + '/groups/' + groupsJson[0].name, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });

      assert.strictEqual(res2.status, 201);
      await awaitTimeout(400);
      const res = await fetch(base_url + '/authorized_keys/edu/name', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.CLIENT_TOKENS.split(',')[0]
        }
      });
      assert.strictEqual(res.status, 200);
      const fromCache = res.headers.get('X-From-Cache');
      assert.strictEqual(fromCache, 'false');
      assert.strictEqual(res.headers.get('content-type'), 'text/plain; charset=utf-8');
      const text = await res.text();
      assert.strictEqual(text.split('\n').length, 10);
    });
  });
});
