import dotenv from 'dotenv';

import assert from 'assert';
import fetch from 'node-fetch';

const base_url = process.env.THEO_URL || 'http://localhost:9100';
dotenv.config();

const tokensOne = {
  tokens: {
    admin: 'xYxYxY',
    clients: ['ababababab', 'cdcdcdcdcdcd']
  }
};

const tokensTwo = {
  tokens: {
    admin: 'wZwZwZwZwZ',
    clients: ['efefefefef', 'ghghghghghgh']
  }
};

describe('Core', function() {

  describe('Recheck tokens after restart', function() {
    it('should return 401', async function() {
      const res = await fetch(base_url + '/tokens', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + tokensOne.tokens.admin,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokensOne)
      });
      assert.equal(res.status, 401);
    });

    it('should return 401', async function() {
      const res = await fetch(base_url + '/accounts', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensOne.tokens.admin
        }
      });
      assert.equal(res.status, 401);
    });

    it('should return 401', async function() {
      const res = await fetch(base_url + '/accounts', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensTwo.tokens.clients[0]
        }
      });
      assert.equal(res.status, 401);
    });

    it('should return 401', async function() {
      const res = await fetch(base_url + '/authorized_keys/host/user', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensOne.tokens.admin
        }
      });
      assert.equal(res.status, 401);
    });

    it('should return 200', async function() {
      const res = await fetch(base_url + '/authorized_keys/host/user', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensTwo.tokens.admin
        }
      });
      assert.equal(res.status, 200);
    });

    it('should return 200', async function() {
      const res = await fetch(base_url + '/authorized_keys/host/user', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensTwo.tokens.clients[0]
        }
      });
      assert.equal(res.status, 200);
    });

    it('should return 200', async function() {
      const res = await fetch(base_url + '/authorized_keys/host/user', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensTwo.tokens.clients[1]
        }
      });
      assert.equal(res.status, 200);
    });
  });
});
