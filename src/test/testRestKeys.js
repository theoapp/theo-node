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

  before(function() {
    return new Promise(async (resolve, reject) => {
      let res;
      try {
        res = await fetch(base_url + '/flushdb', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
          }
        });
      } catch (e) {
        reject(e);
        return;
      }
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
          'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQD1Df4sV1iiEYsU/73PqxgUveYWk2HzvpOc+RsQhd0ziRKW+lGIWN9wMZ8EOoN565HrPedcDYEbYlCuZ/uvnmOE+1YwxSqeLq/cXRaDjd3KsqdKIgXYReh4HFSWwXdB9T+Qv0bOzRbW34qxDX5VPKb7iaIxphCLDY6WD+6goKn1xq/gSmzA8yteMzdX8K9qT+CeUVBHNIN+cWg5yfOs50jVvgTpr8dJj74NO2j/arxOtaadFrAZuRapN+Cn6AQiQAhp66DQ+H8yYxnEZP5G17uE8MS88qSXTmaW5i1uJDlS28SNgl1Icab1bv1fvZXHk3MSD8S4pPLytE3VpdKMLdaP scallar1b@1und1.de',
          'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDOinZyJR2WUMYqYJ7Urdt4hGrY6DE5iWMp28aLJsyZUwFFBZ01x86mc+rFXN6+V3YlhYbBz2wgeyWMESlE8E4x/jHcjxOjySof2/SKV26BZd0C0/thHnE96SHUC8ZAEBSnJe8mM7obfCeoEYVow8dCL4MhoH84kJFiW+Wutoe/Lvs4drGoDozOAVOvUebBpwJX9jJodRiMbM4Bf55rdO5FOX07EsMqKJTEEhkS3lS5BMwamvH0ZRX5i94vdtrkrzgXIxE1iggMIE3NdF3PStXt7Q2SHXg+9b9CcZ9nl65LLdCWZW5cyC1DRYfq0z6IujMCL7JRPOY3Pf09st7HinJr scallar1b@1und1.de'
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
          'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDhUZ36vEwQl+JLfDeqRauGuisnNEbQARbGFhvrVupHhjykbCeMzAtfa7awRSLLtBpCPrqpsbinX9TlehEKsT9hE9ecI6joUaurYuwDJ0zABJUoXHDFgXTuM5YqVIPBqhJ5adqr2W/H2K7Ae0q09x9dekeQPHfRdStY7KbGYkL7oR9nCfHxLQeb8Y0R4P7dWfym6cFrBT9AYFwjgBJi5vndG1SmepJO1UlJDHo3m80SCpyK9L57Hk8ijRlsxdl34fmciTTbrhpnDUs1mOelIZ7Ek2jb+gwnmk2TMwTibLfJtDJm5lSK0z6WXcElDl8zuWuf0xAJ8FHcu4ql5fNQF3Wd eyurmanovev16@gmpg.org',
          'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCzZjaqCTfqxKktG9sMWuM3qzvbPwSyIan0VKUlnbETlJ9+fVH56ZeVdyxza2j77QvehMyC9Rfwvx4dxLBwuygICjZWK6Crgz6ygyAPgADvsQgQ7g3h4gAMFra2EyHZIJ1+z23cH28BPkbREwZaN+7ld8xhK+K6xf9QdB15YYIjpVpaAArpk02NHeC5KH/xuruDSbEShvA7afrTRv8ySSXTedj1CdzeaQ0ccypgt7n5wUKD395WHUr1IjwV+URorx6GwB7OucxrL+G1cdFWNxtC5/c2wlk//1cEn2c3TgS/1EhYg65x+BXD1kw5a0UUFMMFo6C2RBzNIkIWS+GVaxnp eyurmanovev16@gmpg.org'
        ],
        permissions: []
      };
      const resAccount = await createAccount(account);
      const account2 = {
        name: 'John Doe 3',
        email: 'john.doe3@example.com',
        keys: [
          'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDTy2/OjrEbQAG2j0QwD86OKkzpPdLlpOcAoEoYOtQVTieF+5S2NmchIm9aZ89CHs3bYVYoolaIFJ8cMCQHsao/SMqGIrVkTNw1/jpHe8Uk74KsFP4qHEfg25ub73iB/nB5dPi+FAyisLGLwC0o/5KJXd7pU9aBta+rNVSwVjdx9DeT1t4kzOBIoC48Al2is4tTmr3jW69B6HfQHMbUoiiRqYlfLRlRqwkIvMmrX3RtuzDyP5I1E+j1/3ITjyn/htwbgbUCmKfWqWW8nk6N+PE/sGDfPVthv7A6DWbXZDStu5xpB2q1JbKeUeb3kUhSnpBy87ahCYOWylIYvyf1NgTB ebatchley17@friendfeed.com',
          'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDn6L+GqagnNhiWkLHGo5ytI0YerMqtEcE6xkLm6xSauHTOg93T9owMo0TiNf2yh9hkWnVlLZpjJ7zvaxGbyFfSHlIO2KzVflDwocAbmNSerAzMwRbvFKXrHwp5+cn3nsKYI65mq+LiKe4SIPTJThZoRntcKFtUpSSVMUYkPbkDaFHZgJVixLdsV0PrxvroDWo3lP/OY9e/ubiFL9vMG+RB5ghJ3bDSzHyCC4oCQsDBMxG1wf0F5gvc4vlLPun8cDICVVY1cwlRzx86/GvXrJ7QPAjPrVELfURzWtSeIiMZJxerbpfnEXw4rE+13noBwbZAalkrsXloK27s7oYkvQwn ebatchley17@friendfeed.com'
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
