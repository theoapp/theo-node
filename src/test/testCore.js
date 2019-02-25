import dotenv from 'dotenv';

import assert from 'assert';
import fetch from 'node-fetch';

dotenv.config();
const base_url = process.env.THEO_URL || 'http://localhost:9100';

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

const tokensThree = {
  tokens: {
    admins: ['q1q1q1q1q1q1q1q1', 'p0p0p0p0p0p0'],
    clients: ['w2w2w2w2w2w2w2w2w2w2', 'e3e3e3e3e3e3e3e3e3e3e3e']
  }
};

describe('Core', function() {
  describe('Send tokens', function() {
    it('should return 204', async function() {
      const res = await fetch(base_url + '/tokens', {
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
  });

  describe('Resend tokens', function() {
    it('should return 204', async function() {
      const res = await fetch(base_url + '/tokens', {
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
  });

  describe('Resend tokens 3', function() {
    it('should return 204', async function() {
      const res = await fetch(base_url + '/tokens', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.CORE_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokensThree)
      });
      assert.strictEqual(res.status, 204);
    });
  });

  describe('Recheck tokens', function() {
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
