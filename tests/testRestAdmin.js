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
import { describe, it, before } from 'mocha';
import assert from 'assert';
import fetch from 'node-fetch';

const base_url = process.env.THEO_URL || 'http://localhost:9100';
dotenv.config();

const publicKeySample2 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCb80xLc+9jKls1BzxK6/tZKchHZtdz+GFX+eVINDBx//j6Efgp3J8gg1dVI21rAnYb1GTY0P5wozqe2EzEBCKVvlJHjMjpXk+/dkzLkUcbDlL8F/Rv6pIOn0OqNOuWtQ1c8i7qnDA/EzIGrKpDIdL1vXDxEqgzZmRQgNtNJv6mDfkCXL3JQQAVsoTqypI+BSMktX06MjCKLBLsWJRIfUYSgS3yDg6c8Yg7n1yK5sgiNE1mBgZe+Y8VXMcpy3jaiVQ1ifnIPrkvm0oaqZBmYNLDEKkxA9PPMiMo4ZOOF5icXh7MKc9aunqpRZK22dQwJdYvEi57je+ojI63Vil5gXbr jolly3@newsvine.com';

const publicKeySample3 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDMODOr5BfHfde7yHPYVHDWfqgPbHvtFI9coTBoiLZjADbAAKCVLTL+tddnP7oCJBOM0TEC9ySptIv2kzAcPN6shkQs4Y8AWB2HgAl6cWzNmirRxmbVcUDM7a32q9uIiUHyQ6UIHUsyIaTeFtlldf0AT14r9ilaTRBCEH3r2u4xxVntVpJerBBZijsjfl1KN1N0bG9z9pHkpoUiJpIxGDhG1malhypRKffBSeNo4HNwAAA/SyvJq1jvGdBlZhbZK6kN+AnTdQnA8tSd1BhjXRv3uxUeGBHrYxnlaOvFCNjYsSARZO5iFNclgT/mOM75+luOzLmgf+X5h2y3VFZqjEax jolly2@newsvine.com';

const publicKeySample4 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQCslSylir+Ft5Py7n1eoEd6hJa/QbSVscG+v5H+hl920fgLeO5UF/Ykuszf89heLqJ2QEqqtQPAxeBpIQoWAUu4HGb1c0mS0TlYal5/eYpVrv92TXC79rCNEM/jR0AO9WElqTMfYuVsuvHCxWs0zbKaKcqJN/HuekUp7FsY1Zv5lQ== test@test.net';

const publicKeySample5 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQDBBCTYkieaf0EHNs2bkz3td8wgMr+sXgPCydb+SjuDgQSYmQHeYmgiUxuBmPengieId5YA3eZ5cguWz5EgX2aPZ5Af1cxFOhWN7+TG8LRjfKYZnwdRrwvCNWf/xa09k1uHxzfzx2JT0fgcwPWtMVhbZZGKTHED+a5oIPyjiNRRGw== test@test.net';

const publicKeySample6 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQDa06TmKq2XN1S5xoSv1wD69cZCkTJFFh6sUb5P0pNoyg5npiKRQixuWD0VA8ExnMzzFCGShoZkLYbU/Dd/VNLfBx2KPSX7iewXlxMaYrcTOtmO9XCkto4HyFELuLlfAnHHTs3Urf1IeNRsSIcHsPHs5uh3xRnugUYu/F7dpasjTw== test@test.net';

const publicKeySample7 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQC9/3ejiuZuvnaOUWyVjDhe5gbZdeTUyrBl4w2ItD9jN2twl7N68uRB9lQgNe+gBXiEuHy/RDGxPFJWU8FKUBMKAZ1cPRzGFSJrPNVIcgQnkHctqjnnNBuBqb+UTqawSkliG+KXRvM216HvLjze3Oq/J6Uy5fRqRiPOyWsEYzvgSQ== test@test.net';

const publicKeySample8 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQDVJ+tNkA0XSn2twY+pvjiclKrPnsFiIGWL0tM/gVRRS2J2GPGZc8EDMyZvxfevOMh9dLRQeoJludd0b9s53YX860fP9PKrch9mXL82gelTNcDYUCl/H0i9BkCDoLEZTImeCc9Z/r824e+4JK0YtfRqtwm89BLru2Vmvm6yQ8ZTnw== test@test.net';

const publicKeySample9 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQDnTcBR8B6hIxW5YhMPnmtN/W5sVM3rzJjDLxHfSu7Mc0eECTe8BNG7FpyA4zA4uz/H6J4mHo4naUbRHEKYQ1gpAZYYP8lrduK72NGuaStlat+Q2nRhhWhVc026ojPuV8wyBMt2IjnMKg8PizOd1XOgNH5pP8uJfb7iscljvUOiEw== test@test.net';

const publicKeySample10 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQDKlJyam2TFE1+dfdwg+52VvPC/rvY8F4m9m62tYvnEfmxi+yrd/Qyn12AJiF+1C5mV1Xhvy6UHwZbSZ1IRuj3FJImk/C5nzsw8zWsupKmI0lmCUjb40WWJ7zbhOnqi3Hpb3oTRdTwKvjnJQ2sAR86D9WLWdLo6Lziw6fvp31SFWw== test@test.net';

describe('REST Test account', function () {
  this.timeout(10000);

  before(function () {
    return new Promise((resolve, reject) => {
      fetch(base_url + '/flushdb', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      })
        .then(res => {
          if (res.status !== 204) {
            reject(new Error('Expecting 204 got ' + res.status));
            return;
          }
          // I need to wait a bit..
          setTimeout(() => {
            resolve();
          }, 500);
        })
        .catch(e => {
          reject(e);
        });
    });
  });

  describe('check admin function with no Authorization header', function () {
    it('should return en error 401', async function () {
      const res = await fetch(base_url + '/accounts', {
        method: 'GET'
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      const data = await res.json();
      assert.strictEqual(data.status, 401);
    });
  });

  describe('with name and email', function () {
    it('should return an account object with no keys nor permissions', async function () {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe@example.com'
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccount = await res.json();

      assert.strictEqual(typeof resAccount.id, 'number');
      assert.strictEqual(resAccount.name, reqAccount.name);
      assert.strictEqual(resAccount.email, reqAccount.email);
      assert.strictEqual(resAccount.active, 1);
      assert.strictEqual(resAccount.public_keys.length, 0);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('retrieve account by email', function () {
    it('should return an account object with no keys nor permissions', async function () {
      const email = 'john.doe@example.com';
      const res = await fetch(base_url + '/accounts/' + email, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccount = await res.json();

      assert.strictEqual(typeof resAccount.id, 'number');
      assert.strictEqual(resAccount.email, email);
      assert.strictEqual(resAccount.active, 1);
      assert.strictEqual(resAccount.public_keys.length, 0);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('without name', function () {
    it('should return an error', async function () {
      const reqAccount = {
        email: 'john.doe@example.com'
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.strictEqual(res.status, 400);
    });
  });

  describe('without email', function () {
    it('should return an error', async function () {
      const reqAccount = {
        name: 'john.doe'
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.strictEqual(res.status, 400);
    });
  });

  describe('with name and email and 1 key', function () {
    it('should return an account object with 1 key and no permissions', async function () {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.2@example.com',
        keys: [publicKeySample2]
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccount = await res.json();

      assert.strictEqual(typeof resAccount.id, 'number');
      assert.strictEqual(resAccount.name, reqAccount.name);
      assert.strictEqual(resAccount.email, reqAccount.email);
      assert.strictEqual(resAccount.active, 1);
      assert.strictEqual(resAccount.public_keys.length, 1);
      assert.strictEqual(resAccount.public_keys[0].public_key, reqAccount.keys[0]);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('with name and email and 2 keys', function () {
    it('should return an account object with 2 keys and no permissions', async function () {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.3@example.com',
        keys: [publicKeySample3, publicKeySample4]
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccount = await res.json();

      assert.strictEqual(typeof resAccount.id, 'number');
      assert.strictEqual(resAccount.name, reqAccount.name);
      assert.strictEqual(resAccount.email, reqAccount.email);
      assert.strictEqual(resAccount.active, 1);
      assert.strictEqual(resAccount.public_keys.length, 2);
      assert.strictEqual(resAccount.public_keys[0].public_key, reqAccount.keys[0]);
      assert.strictEqual(resAccount.public_keys[1].public_key, reqAccount.keys[1]);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('disable account', function () {
    it('should return an account object with active set to 0', async function () {
      const res = await fetch(base_url + '/accounts/' + 1, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ active: 0 })
      });

      assert.strictEqual(res.status, 201);

      const res2 = await fetch(base_url + '/accounts/1', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.headers.get('content-type'), 'application/json; charset=utf-8');

      const resAccount = await res2.json();
      assert.strictEqual(resAccount.active, 0);
    });
  });

  describe('enable account', function () {
    it('should return an account object with active set to 1', async function () {
      const res = await fetch(base_url + '/accounts/' + 1, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ active: 1 })
      });

      assert.strictEqual(res.status, 201);

      const res2 = await fetch(base_url + '/accounts/1', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.headers.get('content-type'), 'application/json; charset=utf-8');

      const resAccount = await res2.json();
      assert.strictEqual(resAccount.active, 1);
    });
  });

  describe('delete account', function () {
    it('should return 404', async function () {
      const res = await fetch(base_url + '/accounts/2', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res.status, 201);

      const res2 = await fetch(base_url + '/accounts/2', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res2.status, 404);
    });
  });

  describe('add 1 key to an account', function () {
    it('should return an account object with 1 key and no permissions', async function () {
      const keys = [publicKeySample5];

      const res = await fetch(base_url + '/accounts/1/keys', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ keys })
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      const retKeys = await res.json();

      const res2 = await fetch(base_url + '/accounts/1', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccount = await res2.json();

      assert.strictEqual(retKeys.account_id, 1);
      assert.strictEqual(retKeys.public_keys.length, 1);
      assert.strictEqual(retKeys.public_keys[0].public_key, keys[0]);
      assert.strictEqual(resAccount.public_keys.length, 1);
      assert.strictEqual(resAccount.public_keys[0].public_key, keys[0]);
    });
  });

  describe('delete 1 key to an account', function () {
    it('should return an account object with no key and no permissions', async function () {
      const res = await fetch(base_url + '/accounts/1/keys/4', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res.status, 201);

      const res2 = await fetch(base_url + '/accounts/1', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccount = await res2.json();

      assert.strictEqual(resAccount.public_keys.length, 0);
    });
  });

  describe('add 1 permission to an account', function () {
    it('should return an account object with no key and 1 permission', async function () {
      const permission = {
        user: 'john',
        host: 'debian'
      };

      const res = await fetch(base_url + '/accounts/1/permissions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(permission)
      });

      assert.strictEqual(res.status, 200);

      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      const retPermission = await res.json();

      const res2 = await fetch(base_url + '/accounts/1', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccount = await res2.json();

      assert.strictEqual(retPermission.account_id, 1);
      assert.strictEqual(typeof retPermission.permission_id, 'number');
      assert.strictEqual(resAccount.permissions.length, 1);
      assert.strictEqual(resAccount.permissions[0].user, permission.user);
      assert.strictEqual(resAccount.permissions[0].host, permission.host);
    });
  });

  describe('delete 1 permission to an account', function () {
    it('should return an account object with no key and no permissions', async function () {
      const res = await fetch(base_url + '/accounts/1/permissions/1', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res.status, 201);

      const res2 = await fetch(base_url + '/accounts/1', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccount = await res2.json();

      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });
});

describe('REST Test group', function () {
  this.timeout(10000);
  let group_id;
  let account_id;

  before(function () {
    return new Promise((resolve, reject) => {
      fetch(base_url + '/flushdb', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      })
        .then(res => {
          if (res.status !== 204) {
            reject(new Error('Expecting 204 got ' + res.status));
            return;
          }
          // I need to wait a bit..
          setTimeout(() => {
            resolve();
          }, 500);
        })
        .catch(e => {
          reject(e);
        });
    });
  });

  describe('with name', function () {
    it('should return a group object with no accounts nor permissions', async function () {
      const reqGroup = {
        name: 'developers'
      };

      const res = await fetch(base_url + '/groups', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(reqGroup)
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');

      const resGroup = await res.json();

      group_id = resGroup.id;

      assert.strictEqual(typeof resGroup.id, 'number');
      assert.strictEqual(resGroup.name, reqGroup.name);
      assert.strictEqual(resGroup.active, 1);
      assert.strictEqual(resGroup.accounts.length, 0);
      assert.strictEqual(resGroup.permissions.length, 0);
    });
  });

  describe('without name', function () {
    it('should return an error', async function () {
      const reqGroup = {
        namex: 'developers'
      };

      const res = await fetch(base_url + '/groups', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(reqGroup)
      });

      assert.strictEqual(res.status, 400);
    });
  });

  describe('disable group', function () {
    it('should return a group object with active = false and no accounts nor permissions', async function () {
      const res = await fetch(base_url + '/groups/' + group_id, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ active: 0 })
      });

      assert.strictEqual(res.status, 201);

      const res2 = await fetch(base_url + '/groups/' + group_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.headers.get('content-type'), 'application/json; charset=utf-8');

      const resGroup = await res2.json();
      assert.strictEqual(resGroup.active, 0);
    });
  });

  describe('enable group', function () {
    it('should return a group object with active = true and no accounts nor permissions', async function () {
      const res = await fetch(base_url + '/groups/' + group_id, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ active: 1 })
      });

      assert.strictEqual(res.status, 201);

      const res2 = await fetch(base_url + '/groups/' + group_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.headers.get('content-type'), 'application/json; charset=utf-8');

      const resGroup = await res2.json();
      assert.strictEqual(resGroup.active, 1);
    });
  });

  describe('add account to group', function () {
    it('should return a group object with active = false and 1 accounts and no permissions', async function () {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.2@example.com',
        keys: [publicKeySample6]
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccount = await res.json();

      account_id = resAccount.id;

      const res2 = await fetch(base_url + '/groups/' + group_id + '/account', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ id: account_id })
      });

      assert.strictEqual(res2.status, 204);

      const res3 = await fetch(base_url + '/groups/' + group_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res3.status, 200);
      assert.strictEqual(res3.headers.get('content-type'), 'application/json; charset=utf-8');

      const resGroup = await res3.json();

      assert.strictEqual(resGroup.active, 1);
      assert.strictEqual(resGroup.accounts.length, 1);
      assert.strictEqual(resGroup.accounts[0].id, account_id);
      assert.strictEqual(resGroup.permissions.length, 0);

      const res4 = await fetch(base_url + '/accounts/' + account_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res4.status, 200);
      assert.strictEqual(res4.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccountWithGroup = await res4.json();

      assert.strictEqual(resAccountWithGroup.groups.length, 2);
      assert.strictEqual(resAccountWithGroup.groups[0].id, group_id);
      assert.strictEqual(resAccountWithGroup.groups[0].name, resGroup.name);
    });
  });

  describe('add another account to group', function () {
    it('should return a group object with active = false and 2 accounts and no permissions', async function () {
      const reqAccount = {
        name: 'john doe 3',
        email: 'john.doe.3@example.com',
        keys: [publicKeySample7]
      };

      const res = await fetch(base_url + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(reqAccount)
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccount = await res.json();

      account_id = resAccount.id;

      const res2 = await fetch(base_url + '/groups/' + group_id + '/account', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ id: account_id })
      });

      assert.strictEqual(res2.status, 204);

      const res3 = await fetch(base_url + '/groups/' + group_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res3.status, 200);
      assert.strictEqual(res3.headers.get('content-type'), 'application/json; charset=utf-8');

      const resGroup = await res3.json();

      assert.strictEqual(resGroup.active, 1);
      assert.strictEqual(resGroup.accounts.length, 2);
      assert.strictEqual(resGroup.permissions.length, 0);

      const res4 = await fetch(base_url + '/accounts/' + account_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res4.status, 200);
      assert.strictEqual(res4.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccountWithGroup = await res4.json();

      assert.strictEqual(resAccountWithGroup.groups.length, 2);
      assert.strictEqual(resAccountWithGroup.groups[0].id, group_id);
      assert.strictEqual(resAccountWithGroup.groups[0].name, resGroup.name);
    });
  });

  describe('add 3 more accounts to group', function () {
    it('should return a group object with active = false and 5 accounts and no permissions', async function () {
      const reqAccounts = [
        {
          name: 'john doe 4',
          email: 'john.doe.4@example.com',
          keys: [publicKeySample8]
        },
        {
          name: 'john doe 5',
          email: 'john.doe.5@example.com',
          keys: [publicKeySample9]
        },
        {
          name: 'john doe 6',
          email: 'john.doe.6@example.com',
          keys: [publicKeySample10]
        }
      ];

      const ids = [];
      for (let i = 0; i < reqAccounts.length; i++) {
        const res = await fetch(base_url + '/accounts', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
            'Content-Type': 'application/json; charset=utf-8'
          },
          body: JSON.stringify(reqAccounts[i])
        });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
        ids.push(reqAccounts[i].email);
      }

      const res2 = await fetch(base_url + '/groups/' + group_id + '/accounts', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ ids })
      });

      assert.strictEqual(res2.status, 200);
      const resGroups = await res2.json();

      for (let i = 0; i < resGroups.length; i++) {
        assert.strictEqual(resGroups[i].status, 200);
      }

      const res3 = await fetch(base_url + '/groups/' + group_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res3.status, 200);
      assert.strictEqual(res3.headers.get('content-type'), 'application/json; charset=utf-8');

      const resGroup = await res3.json();

      assert.strictEqual(resGroup.active, 1);
      assert.strictEqual(resGroup.accounts.length, 5);
      assert.strictEqual(resGroup.permissions.length, 0);

      const res4 = await fetch(base_url + '/accounts/' + reqAccounts[2].email, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res4.status, 200);
      assert.strictEqual(res4.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccountWithGroup = await res4.json();

      assert.strictEqual(resAccountWithGroup.groups.length, 2);
      assert.strictEqual(resAccountWithGroup.groups[0].id, group_id);
      assert.strictEqual(resAccountWithGroup.groups[0].name, resGroup.name);
    });
  });

  describe('remove account from group', function () {
    it('should return a group object with active = false and 1 accounts and no permissions', async function () {
      const res = await fetch(base_url + '/accounts/john.doe.3@example.com', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccount = await res.json();

      const res2 = await fetch(base_url + '/groups/' + group_id + '/' + resAccount.id, {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });

      assert.strictEqual(res2.status, 204);

      const res3 = await fetch(base_url + '/groups/' + group_id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res3.status, 200);
      assert.strictEqual(res3.headers.get('content-type'), 'application/json; charset=utf-8');

      const resGroup = await res3.json();

      assert.strictEqual(resGroup.active, 1);
      assert.strictEqual(resGroup.accounts.length, 4);
      assert.notStrictEqual(resGroup.accounts[0].id, resAccount.id);
      assert.strictEqual(resGroup.permissions.length, 0);

      const res4 = await fetch(base_url + '/accounts/' + resAccount.id, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + process.env.ADMIN_TOKEN
        }
      });
      assert.strictEqual(res4.status, 200);
      assert.strictEqual(res4.headers.get('content-type'), 'application/json; charset=utf-8');
      const resAccountWithGroup = await res4.json();

      assert.strictEqual(resAccountWithGroup.groups.length, 1);
    });
  });
});
