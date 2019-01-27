import dotenv from 'dotenv';

import assert from 'assert';
import fetch from 'node-fetch';

const base_url = process.env.THEO_URL || 'http://localhost:9100';
dotenv.config();

describe('REST Test account with REQUIRE_SIGNED_KEY=1', function() {
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

  describe('with name and email and 1 key', function() {
    it('should return an error because key is not signed', async function() {
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

      assert.equal(res.status, 400);
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

      const res = await fetch(base_url + '/accounts/1/keys', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keys })
      });

      assert.equal(res.status, 400);
    });
    it('should return success', async function() {
      const keys = [{ key: 'ssh-rsa AAAAB3Nza john.doe.2@debian', signature: 'xxxxxx' }];

      const res = await fetch(base_url + '/accounts/1/keys', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keys })
      });

      assert.equal(res.status, 200);
    });
  });
});
