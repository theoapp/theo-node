import dotenv from 'dotenv';

import assert from 'assert';
import fetch from 'node-fetch';

const baseURLs = [];
dotenv.config();

for (const name in process.env) {
  const value = process.env[name];
  let match = name.match(/^THEO_URL_(.*)$/);
  if (match) {
    baseURLs.push(value);
  }
}

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
  describe('Check environment', function() {
    assert.strictEqual(baseURLs.length >= 2, true);
  });
  describe('Send tokens', function() {
    it('should return 204', async function() {
      const res = await fetch(baseURLs[0] + '/tokens', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.CORE_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokensOne)
      });
      assert.strictEqual(res.status, 204);
    });
  });
  describe('Check tokens', function() {
    for (let i = 0; i < baseURLs.length; i++) {
      const base_url = baseURLs[i];
      it('should return 401', async function() {
        const res = await fetch(base_url + '/tokens', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.admin,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(tokensOne)
        });
        assert.strictEqual(res.status, 401);
      });

      it('should return 200', async function() {
        const res = await fetch(base_url + '/accounts', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.admin
          }
        });
        assert.strictEqual(res.status, 200);
      });

      it('should return 401', async function() {
        const res = await fetch(base_url + '/accounts', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.clients[0]
          }
        });
        assert.strictEqual(res.status, 401);
      });

      it('should return 200', async function() {
        const res = await fetch(base_url + '/authorized_keys/host/user', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.admin
          }
        });
        assert.strictEqual(res.status, 200);
      });

      it('should return 200', async function() {
        const res = await fetch(base_url + '/authorized_keys/host/user', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.clients[0]
          }
        });
        assert.strictEqual(res.status, 200);
      });

      it('should return 200', async function() {
        const res = await fetch(base_url + '/authorized_keys/host/user', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.clients[1]
          }
        });
        assert.strictEqual(res.status, 200);
      });
    }
  });

  describe('Resend tokens', function() {
    it('should return 204', async function() {
      const res = await fetch(baseURLs[1] + '/tokens', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.CORE_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokensTwo)
      });
      assert.strictEqual(res.status, 204);
    });
  });
  describe('Recheck tokens', function() {
    for (let i = 0; i < baseURLs.length; i++) {
      const base_url = baseURLs[i];
      it('should return 401', async function() {
        const res = await fetch(base_url + '/tokens', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + tokensOne.tokens.admin,
            'Content-Type': 'application/json'
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

      it('should return 200', async function() {
        const res = await fetch(base_url + '/authorized_keys/host/user', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensTwo.tokens.admin
          }
        });
        assert.strictEqual(res.status, 200);
      });

      it('should return 200', async function() {
        const res = await fetch(base_url + '/authorized_keys/host/user', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensTwo.tokens.clients[0]
          }
        });
        assert.strictEqual(res.status, 200);
      });

      it('should return 200', async function() {
        const res = await fetch(base_url + '/authorized_keys/host/user', {
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + tokensTwo.tokens.clients[1]
          }
        });
        assert.strictEqual(res.status, 200);
      });
    }
  });
});
