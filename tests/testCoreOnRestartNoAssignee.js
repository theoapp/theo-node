import dotenv from 'dotenv';

import assert from 'assert';
import fetch from 'node-fetch';

import { tokensOne, tokensTwo, tokensThree } from './testCoreTokensNoAssignee';

dotenv.config();
const base_url = process.env.THEO_URL || 'http://localhost:9100';

describe('Core', function() {
  describe('Recheck tokens after restart', function() {
    it('should return 401', async function() {
      const res = await fetch(base_url + '/tokens', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + tokensOne.tokens.admin,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(tokensOne)
      });
      assert.strictEqual(res.status, 401);
    });

    it('should return 401', async function() {
      const res = await fetch(base_url + '/accounts', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensOne.tokens.admin
        }
      });
      assert.strictEqual(res.status, 401);
    });

    it('should return 401', async function() {
      const res = await fetch(base_url + '/accounts', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensTwo.tokens.clients[0]
        }
      });
      assert.strictEqual(res.status, 401);
    });

    it('should return 401', async function() {
      const res = await fetch(base_url + '/authorized_keys/host/user', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensOne.tokens.admin
        }
      });
      assert.strictEqual(res.status, 401);
    });

    it('should return 401', async function() {
      const res = await fetch(base_url + '/authorized_keys/host/user', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensTwo.tokens.admin
        }
      });
      assert.strictEqual(res.status, 401);
    });

    it('should return 401', async function() {
      const res = await fetch(base_url + '/authorized_keys/host/user', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensTwo.tokens.clients[0]
        }
      });
      assert.strictEqual(res.status, 401);
    });

    it('should return 401', async function() {
      const res = await fetch(base_url + '/authorized_keys/host/user', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensTwo.tokens.clients[1]
        }
      });
      assert.strictEqual(res.status, 401);
    });

    it('should return 200', async function() {
      const res = await fetch(base_url + '/authorized_keys/host/user', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensThree.tokens.admins[0]
        }
      });
      assert.strictEqual(res.status, 200);
    });

    it('should return 200', async function() {
      const res = await fetch(base_url + '/authorized_keys/host/user', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensThree.tokens.admins[1]
        }
      });
      assert.strictEqual(res.status, 200);
    });

    it('should return 200', async function() {
      const res = await fetch(base_url + '/authorized_keys/host/user', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensThree.tokens.clients[0]
        }
      });
      assert.strictEqual(res.status, 200);
    });

    it('should return 200', async function() {
      const res = await fetch(base_url + '/authorized_keys/host/user', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + tokensThree.tokens.clients[1]
        }
      });
      assert.strictEqual(res.status, 200);
    });
  });
});
