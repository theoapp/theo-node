import dotenv from 'dotenv';

import assert from 'assert';
import fetch from 'node-fetch';
import accountsJson from './accounts';
import groupsJson from './groups';

const base_url = process.env.THEO_URL || 'http://localhost:9100';

dotenv.config();

const addPermission = async (account_id, user, host) => {
  await fetch(base_url + '/accounts/' + account_id + '/permissions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user, host })
  });
};

const createAccount = async account => {
  const res = await fetch(base_url + '/accounts', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
      'Content-Type': 'application/json'
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
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user, host })
  });
};
const addGroupAccount = async (group_id, account_id) => {
  await fetch(base_url + '/groups/' + group_id, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
      'Content-Type': 'application/json'
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
      'Content-Type': 'application/json'
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

  before(function() {
    return new Promise(async (resolve, reject) => {
      const res = await fetch(base_url + '/flushdb', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      if (res.status !== 204) {
        reject(new Error('Expecting 204 got ' + res.status));
        return;
      }
      // I need to wait a bit..
      setTimeout(async () => {
        await loadData();
        resolve();
      }, 500);
    });
  });

  describe('check accounts creation', function() {
    it('should return an account object with right number of keys and permissions', async function() {
      const resAccount = await getAccountByEmail('tevery0@newsvine.com');
      assert.equal(resAccount.permissions.length, 5);
      assert.equal(resAccount.public_keys.length, 5);
    });
  });

  describe('check authorized_keys with no Authorization header', function() {
    it('should return en error 401', async function() {
      const res = await fetch(base_url + '/authorized_keys/mil/mil', {
        method: 'GET'
      });
      assert.equal(res.status, 401);
      assert.equal(res.headers.get('content-type'), 'application/json');
      const data = await res.json();
      assert.equal(data.status, 401);
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
      assert.equal(res.status, 401);
      assert.equal(res.headers.get('content-type'), 'application/json');
      const data = await res.json();
      assert.equal(data.status, 401);
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
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/plain');
      const text = await res.text();
      assert.equal(text.split('\n').length, 14);
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
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/plain');
      const text = await res.text();
      assert.equal(text.split('\n').length, 13);
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
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/plain');
      const text = await res.text();
      assert.equal(text.split('\n').length, 1);
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
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/plain');
      const text = await res.text();
      assert.equal(text.split('\n').length, 10);
    });
  });

  describe('add new account and check authorized_keys for user=name and host=edu', function() {
    it('should return 12 rows per 5 users (5 + 2 + 2 + 1 + 2)', async function() {
      const account = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        keys: ['7f92acf9229d222c36109a57a824ab24081530fa', 'a6a4097125cc1e317c812a494d87cf0096678855'],
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
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/plain');
      const text = await res.text();
      assert.equal(text.split('\n').length, 12);
    });
  });

  describe('add 2 accounts and add them to group, check authorized_keys for user=name and host=edu', function() {
    it('should return 16 rows per 7 users (5 + 2 + 2 + 1 + 2 + 2 + 2)', async function() {
      const account = {
        name: 'John Doe 2',
        email: 'john.doe2@example.com',
        keys: ['9a57a824ab24081530fa7f92acf9229d222c3610', '12a494d87cf0096678855a6a4097125cc1e317c8'],
        permissions: []
      };
      const resAccount = await createAccount(account);
      const account2 = {
        name: 'John Doe 3',
        email: 'john.doe3@example.com',
        keys: ['12a494d8b24081530fa7f92acf9229d222c3610', '9a57a824a7cf0096678855a6a4097125cc1e317c8'],
        permissions: []
      };
      const resAccount2 = await createAccount(account2);
      await addGroupAccount(1, resAccount.id);
      await addGroupAccount(1, resAccount2.id);
      const res = await fetch(base_url + '/authorized_keys/edu/name', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.CLIENT_TOKENS.split(',')[0]
        }
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/plain');
      const text = await res.text();
      assert.equal(text.split('\n').length, 16);
    });
  });

  describe('disable 1 account from group, check authorized_keys for user=name and host=edu', function() {
    it('should return 14 rows per 6 users (5 + 2 + 2 + 1 + 2 + 2)', async function() {
      const resAccount = await getAccountByEmail('john.doe2@example.com');
      await fetch(base_url + '/accounts/' + resAccount.id, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: 0 })
      });

      const res = await fetch(base_url + '/authorized_keys/edu/name', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.CLIENT_TOKENS.split(',')[0]
        }
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/plain');
      const text = await res.text();
      assert.equal(text.split('\n').length, 14);
    });
  });

  describe('remove 1 account from group, check authorized_keys for user=name and host=edu', function() {
    it('should return 12 rows per 5 users (5 + 2 + 2 + 1 + 2)', async function() {
      const resAccount = await getAccountByEmail('asiemantel1c@redcross.org');
      const res2 = await fetch(base_url + '/groups/1/' + resAccount.id, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });

      assert.equal(res2.status, 201);

      const res = await fetch(base_url + '/authorized_keys/edu/name', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.CLIENT_TOKENS.split(',')[0]
        }
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/plain');
      const text = await res.text();
      assert.equal(text.split('\n').length, 12);
    });
  });

  describe('remove group, check authorized_keys for user=name and host=edu', function() {
    it('should return 10 rows per 4 users (5 + 2 + 1 + 2)', async function() {
      const res2 = await fetch(base_url + '/groups/1', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });

      assert.equal(res2.status, 201);

      const res = await fetch(base_url + '/authorized_keys/edu/name', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.CLIENT_TOKENS.split(',')[0]
        }
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'text/plain');
      const text = await res.text();
      assert.equal(text.split('\n').length, 10);
    });
  });
});
