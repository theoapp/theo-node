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

import { tokensOne, tokensTwo, tokensThree } from './testCoreTokensNoAssignee';

dotenv.config();
const base_url = process.env.THEO_URL || 'http://localhost:9100';

describe('Core', function() {
  describe('Send tokens', function() {
    it('should return 204', async function() {
      const res = await fetch(base_url + '/tokens', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.CORE_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
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
          'Content-Type': 'application/json; charset=utf-8'
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
          'Content-Type': 'application/json; charset=utf-8'
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
          'Content-Type': 'application/json; charset=utf-8'
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
