import dotenv from 'dotenv';

import assert from 'assert';
import fetch from 'node-fetch';

const base_url = process.env.THEO_URL || 'http://localhost:9100';
dotenv.config();

describe('REST Test account', function() {
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
      setTimeout(() => {
        resolve();
      }, 500);
    });
  });

  describe('check admin function with no Authorization header', function() {
    it('should return en error 401', async function() {
      const res = await fetch(base_url + '/accounts', {
        method: 'GET'
      });
      assert.equal(res.status, 401);
      assert.equal(res.headers.get('content-type'), 'application/json');
      const data = await res.json();
      assert.equal(data.status, 401);
    });
  });

  describe('with name and email', function() {
    it('should return an account object with no keys nor permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe@example.com'
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'application/json');
      const resAccount = await res.json();

      assert.equal(typeof resAccount.id, 'number');
      assert.equal(resAccount.name, reqAccount.name);
      assert.equal(resAccount.email, reqAccount.email);
      assert.equal(resAccount.active, 1);
      assert.equal(resAccount.public_keys.length, 0);
      assert.equal(resAccount.permissions.length, 0);
    });
  });

  describe('retrieve account by email', function() {
    it('should return an account object with no keys nor permissions', async function() {
      const email = 'john.doe@example.com';
      const res = await fetch(base_url + '/accounts/' + email, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'application/json');
      const resAccount = await res.json();

      assert.equal(typeof resAccount.id, 'number');
      assert.equal(resAccount.email, email);
      assert.equal(resAccount.active, 1);
      assert.equal(resAccount.public_keys.length, 0);
      assert.equal(resAccount.permissions.length, 0);
    });
  });

  describe('without name', function() {
    it('should return an error', async function() {
      const reqAccount = {
        email: 'john.doe@example.com'
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.equal(res.status, 400);
    });
  });

  describe('without email', function() {
    it('should return an error', async function() {
      const reqAccount = {
        name: 'john.doe'
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.equal(res.status, 400);
    });
  });

  describe('with name and email and 1 key', function() {
    it('should return an account object with 1 key and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.2@example.com',
        keys: ['ssh-rsa AAAAB3Nza john.doe.2@debian']
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'application/json');
      const resAccount = await res.json();

      assert.equal(typeof resAccount.id, 'number');
      assert.equal(resAccount.name, reqAccount.name);
      assert.equal(resAccount.email, reqAccount.email);
      assert.equal(resAccount.active, 1);
      assert.equal(resAccount.public_keys.length, 1);
      assert.equal(resAccount.public_keys[0].public_key, reqAccount.keys[0]);
      assert.equal(resAccount.permissions.length, 0);
    });
  });

  describe('with name and email and 2 keys', function() {
    it('should return an account object with 2 keys and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.3@example.com',
        keys: ['ssh-rsa AAAAB3Nza john.doe.2@debian', 'ssh-rsa AAAAB3Nza john.doe.3@debian']
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'application/json');
      const resAccount = await res.json();

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
      const res = await fetch(base_url + '/accounts/' + 1, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: 0 })
      });

      assert.equal(res.status, 201);

      const res2 = await fetch(base_url + '/accounts/1', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res2.status, 200);
      assert.equal(res2.headers.get('content-type'), 'application/json');

      const resAccount = await res2.json();
      assert.equal(resAccount.active, 0);
    });
  });

  describe('enable account', function() {
    it('should return an account object with active set to 1', async function() {
      const res = await fetch(base_url + '/accounts/' + 1, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: 1 })
      });

      assert.equal(res.status, 201);

      const res2 = await fetch(base_url + '/accounts/1', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res2.status, 200);
      assert.equal(res2.headers.get('content-type'), 'application/json');

      const resAccount = await res2.json();
      assert.equal(resAccount.active, 1);
    });
  });

  describe('delete account', function() {
    it('should return 404', async function() {
      const res = await fetch(base_url + '/accounts/2', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res.status, 201);

      const res2 = await fetch(base_url + '/accounts/2', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res2.status, 404);
    });
  });

  describe('add 1 key to an account', function() {
    it('should return an account object with 1 key and no permissions', async function() {
      const keys = ['ssh-rsa AAAAB3Nza john.doe.2@debian'];

      const res = await fetch(base_url + '/accounts/1/keys', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keys })
      });

      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'application/json');
      const retKeys = await res.json();

      const res2 = await fetch(base_url + '/accounts/1', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res2.status, 200);
      assert.equal(res2.headers.get('content-type'), 'application/json');
      const resAccount = await res2.json();

      assert.equal(retKeys.account_id, 1);
      assert.equal(retKeys.public_keys.length, 1);
      assert.equal(retKeys.public_keys[0].public_key, keys[0]);
      assert.equal(resAccount.public_keys.length, 1);
      assert.equal(resAccount.public_keys[0].public_key, keys[0]);
    });
  });

  describe('delete 1 key to an account', function() {
    it('should return an account object with no key and no permissions', async function() {
      const res = await fetch(base_url + '/accounts/1/keys/4', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res.status, 201);

      const res2 = await fetch(base_url + '/accounts/1', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res2.status, 200);
      assert.equal(res2.headers.get('content-type'), 'application/json');
      const resAccount = await res2.json();

      assert.equal(resAccount.public_keys.length, 0);
    });
  });

  describe('add 1 permission to an account', function() {
    it('should return an account object with no key and 1 permission', async function() {
      const permission = {
        user: 'john',
        host: 'debian'
      };

      const res = await fetch(base_url + '/accounts/1/permissions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(permission)
      });

      assert.equal(res.status, 200);

      assert.equal(res.headers.get('content-type'), 'application/json');
      const retPermission = await res.json();

      const res2 = await fetch(base_url + '/accounts/1', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res2.status, 200);
      assert.equal(res2.headers.get('content-type'), 'application/json');
      const resAccount = await res2.json();

      assert.equal(retPermission.account_id, 1);
      assert.equal(typeof retPermission.permission_id, 'number');
      assert.equal(resAccount.permissions.length, 1);
      assert.equal(resAccount.permissions[0].user, permission.user);
      assert.equal(resAccount.permissions[0].host, permission.host);
    });
  });

  describe('delete 1 permission to an account', function() {
    it('should return an account object with no key and no permissions', async function() {
      const res = await fetch(base_url + '/accounts/1/permissions/1', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res.status, 201);

      const res2 = await fetch(base_url + '/accounts/1', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res2.status, 200);
      assert.equal(res2.headers.get('content-type'), 'application/json');
      const resAccount = await res2.json();

      assert.equal(resAccount.permissions.length, 0);
    });
  });
});

describe('REST Test group', function() {
  this.timeout(10000);
  let group_id;
  let account_id;

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
      setTimeout(() => {
        resolve();
      }, 500);
    });
  });

  describe('with name', function() {
    it('should return a group object with no accounts nor permissions', async function() {
      const reqGroup = {
        name: 'developers'
      };

      const res = await fetch(base_url + '/groups', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqGroup)
      });

      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'application/json');

      const resGroup = await res.json();

      group_id = resGroup.id;

      assert.equal(typeof resGroup.id, 'number');
      assert.equal(resGroup.name, reqGroup.name);
      assert.equal(resGroup.active, 1);
      assert.equal(resGroup.accounts.length, 0);
      assert.equal(resGroup.permissions.length, 0);
    });
  });

  describe('without name', function() {
    it('should return an error', async function() {
      const reqGroup = {
        namex: 'developers'
      };

      const res = await fetch(base_url + '/groups', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqGroup)
      });

      assert.equal(res.status, 400);
    });
  });

  describe('disable group', function() {
    it('should return a group object with active = false and no accounts nor permissions', async function() {
      const res = await fetch(base_url + '/groups/' + group_id, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: 0 })
      });

      assert.equal(res.status, 201);

      const res2 = await fetch(base_url + '/groups/' + group_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res2.status, 200);
      assert.equal(res2.headers.get('content-type'), 'application/json');

      const resGroup = await res2.json();
      assert.equal(resGroup.active, 0);
    });
  });

  describe('enable group', function() {
    it('should return a group object with active = true and no accounts nor permissions', async function() {
      const res = await fetch(base_url + '/groups/' + group_id, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active: 1 })
      });

      assert.equal(res.status, 201);

      const res2 = await fetch(base_url + '/groups/' + group_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res2.status, 200);
      assert.equal(res2.headers.get('content-type'), 'application/json');

      const resGroup = await res2.json();
      assert.equal(resGroup.active, 1);
    });
  });

  describe('add account to group', function() {
    it('should return a group object with active = false and 1 accounts and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.2@example.com',
        keys: ['ssh-rsa AAAAB3Nza john.doe.2@debian']
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'application/json');
      const resAccount = await res.json();

      account_id = resAccount.id;

      const res2 = await fetch(base_url + '/groups/' + group_id, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: account_id })
      });

      assert.equal(res2.status, 201);

      const res3 = await fetch(base_url + '/groups/' + group_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res3.status, 200);
      assert.equal(res3.headers.get('content-type'), 'application/json');

      const resGroup = await res3.json();

      assert.equal(resGroup.active, 1);
      assert.equal(resGroup.accounts.length, 1);
      assert.equal(resGroup.accounts[0].id, account_id);
      assert.equal(resGroup.permissions.length, 0);

      const res4 = await fetch(base_url + '/accounts/' + account_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res4.status, 200);
      assert.equal(res4.headers.get('content-type'), 'application/json');
      const resAccountWithGroup = await res4.json();

      assert.equal(resAccountWithGroup.groups.length, 2);
      assert.equal(resAccountWithGroup.groups[0].id, group_id);
      assert.equal(resAccountWithGroup.groups[0].name, resGroup.name);
    });
  });

  describe('add another account to group', function() {
    it('should return a group object with active = false and 2 accounts and no permissions', async function() {
      const reqAccount = {
        name: 'john doe 3',
        email: 'john.doe.3@example.com',
        keys: ['ssh-rsa AAAAB3Nza john.doe.3@debian']
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'application/json');
      const resAccount = await res.json();

      account_id = resAccount.id;

      const res2 = await fetch(base_url + '/groups/' + group_id, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: account_id })
      });

      assert.equal(res2.status, 201);

      const res3 = await fetch(base_url + '/groups/' + group_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res3.status, 200);
      assert.equal(res3.headers.get('content-type'), 'application/json');

      const resGroup = await res3.json();

      assert.equal(resGroup.active, 1);
      assert.equal(resGroup.accounts.length, 2);
      assert.equal(resGroup.permissions.length, 0);

      const res4 = await fetch(base_url + '/accounts/' + account_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res4.status, 200);
      assert.equal(res4.headers.get('content-type'), 'application/json');
      const resAccountWithGroup = await res4.json();

      assert.equal(resAccountWithGroup.groups.length, 2);
      assert.equal(resAccountWithGroup.groups[0].id, group_id);
      assert.equal(resAccountWithGroup.groups[0].name, resGroup.name);
    });
  });

  describe('remove account from group', function() {
    it('should return a group object with active = false and 1 accounts and no permissions', async function() {
      const res = await fetch(base_url + '/accounts/john.doe.3@example.com', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });

      assert.equal(res.status, 200);
      assert.equal(res.headers.get('content-type'), 'application/json');
      const resAccount = await res.json();

      const res2 = await fetch(base_url + '/groups/' + group_id + '/' + resAccount.id, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });

      assert.equal(res2.status, 201);

      const res3 = await fetch(base_url + '/groups/' + group_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res3.status, 200);
      assert.equal(res3.headers.get('content-type'), 'application/json');

      const resGroup = await res3.json();

      assert.equal(resGroup.active, 1);
      assert.equal(resGroup.accounts.length, 1);
      assert.notEqual(resGroup.accounts[0].id, resAccount.id);
      assert.equal(resGroup.permissions.length, 0);

      const res4 = await fetch(base_url + '/accounts/' + resAccount.id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.equal(res4.status, 200);
      assert.equal(res4.headers.get('content-type'), 'application/json');
      const resAccountWithGroup = await res4.json();

      assert.equal(resAccountWithGroup.groups.length, 1);
    });
  });
});
