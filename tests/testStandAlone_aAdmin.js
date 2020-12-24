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

import assert from 'assert';

import AppHelper from '../src/lib/helpers/AppHelper';

import {
  adminAddAccountKeys,
  adminAddAccountPermission,
  adminAddGroupPermission,
  adminCreateAccount,
  adminCreateGroup,
  adminCreateGroupAccount,
  adminDeleteAccount,
  adminDeleteAccountKey,
  adminDeleteAccountPermission,
  adminDeleteGroup,
  adminDeleteGroupAccount,
  adminDeleteGroupPermission,
  adminEditAccount,
  adminEditGroup,
  adminGetAccount,
  adminGetGroup,
  adminUpdateAccountPermission,
  adminUpdateGroupPermission
} from '../src/lib/helpers/AdminHelper';
import DbHelper, { releaseDHInstance } from '../src/lib/helpers/DbHelper';

const publicKeySample =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCoUQGPAFUl3xBX+1vxm/o1v4G1KHqXlvg/pVAHrs89isBTcXwNoo4C1YWjF0TCRjhltfvNMNYF8Q1fzEw1anjL+9X26GlXEXr4Nx9MIFFiEiTpUSPGlT13TOIIKW9eEQc9vHydgK1NdpEgz23kcPARWvXbcVtwoLDwfsE1Msvg1qWIN4UiDau/FTetFaq8fcXd3Cun0V+v5DLEfhSB3gNSxWwhdAEaQIpPSJk8VSHKiaOtQ6Besgw8+mjA5u0Mvm4Z9luZ8b7Ky2gUn49HwM/ez7KC9BhoiTsoE8iXjF11J3ttqju0wADZ4P8OQ7y6l7rgNqXyHejhLutvdI3ka3X/ jolly1@newsvine.com';

const publicKeySample2 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC1dFdWXEYMXJlG1RaCQZ0DwnoVm8Lg+QGzoVS0DooCJqNM+A58uvfX43JPQKHnwhb+FSs+RPiLnaOOT1Y/zRv+Vf5pzxwfUOlCwer71GoL0LC4/V6Y8e0OaAos8ndxcjFU6JYq+UnDOIfaOM9rFK8omZd1SMDM0yIX/IC6DN/4ohZe/kkruMDy7Kw1haruV1/ooScUjcwCqdp9VoTCrH6fFj8XfOs04pZhaztMjSUTwS0ppBzPfgqzZpga3owXF/LAvUJBYSg9eOH0GWJ2VIyTK4umdw4KjQ/YFDa6pWs0a5rW8gunO8qZVVLxt3usNwvCh2EGTR2KXJJ+3mFpu+NB llayson19@timesonline.co.uk';

const publicKeySample3 =
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDMODOr5BfHfde7yHPYVHDWfqgPbHvtFI9coTBoiLZjADbAAKCVLTL+tddnP7oCJBOM0TEC9ySptIv2kzAcPN6shkQs4Y8AWB2HgAl6cWzNmirRxmbVcUDM7a32q9uIiUHyQ6UIHUsyIaTeFtlldf0AT14r9ilaTRBCEH3r2u4xxVntVpJerBBZijsjfl1KN1N0bG9z9pHkpoUiJpIxGDhG1malhypRKffBSeNo4HNwAAA/SyvJq1jvGdBlZhbZK6kN+AnTdQnA8tSd1BhjXRv3uxUeGBHrYxnlaOvFCNjYsSARZO5iFNclgT/mOM75+luOzLmgf+X5h2y3VFZqjEax jolly2@newsvine.com';

const publicSSH2Key = `---- BEGIN SSH2 PUBLIC KEY ----
Comment: "usern@hostrc"
AAAAB3NzaC1yc2EAAAABJQAAAQEAqIr9zeWOhGmL6kPmo5pqInlbR41NW/R9cfCR
b3PvasmOIJCZ5BBjlqmok3sBDVkwMvkOqYGkqhOceRzGoh9sTZsEMCgXs7LsRhA7
jjTxkqolwunn7OQ1DDHYdDFG61g0Mjs1WjvEd9lYeUwGF5ARGALxV+OEDTD/zi4Q
IKp5TjGKBoSGBLcU+KSfPcN4+vKMUBdoHMVBFIeXLTBeTzmtbGkg+q7bspPso4Kt
CHN0d7TQ7rBSgPSXgdkzXDcH0cfz3UV6fOG8wpfpxj3PVNXoF7sGFOARcEhYt65W
gzOsqCDwx8aS8MqO6JxWBvWRTRp1+tvoawMCYeksryiWfJT/JQ==
---- END SSH2 PUBLIC KEY ----`;

const publicSSH2KeyOpenSSH =
  'ssh-rsa AAAAB3NzaC1yc2EAAAABJQAAAQEAqIr9zeWOhGmL6kPmo5pqInlbR41NW/R9cfCRb3PvasmOIJCZ5BBjlqmok3sBDVkwMvkOqYGkqhOceRzGoh9sTZsEMCgXs7LsRhA7jjTxkqolwunn7OQ1DDHYdDFG61g0Mjs1WjvEd9lYeUwGF5ARGALxV+OEDTD/zi4QIKp5TjGKBoSGBLcU+KSfPcN4+vKMUBdoHMVBFIeXLTBeTzmtbGkg+q7bspPso4KtCHN0d7TQ7rBSgPSXgdkzXDcH0cfz3UV6fOG8wpfpxj3PVNXoF7sGFOARcEhYt65WgzOsqCDwx8aS8MqO6JxWBvWRTRp1+tvoawMCYeksryiWfJT/JQ== usern@hostrc';

const settings = {
  admin: {
    token: ''
  },
  client: {
    tokens: []
  },
  db: {
    engine: 'sqlite',
    storage: ':memory:'
  },
  server: {
    http_port: 9100
  }
};

let ah;

const loadDb = function() {
  return new Promise((resolve, reject) => {
    try {
      const dh = DbHelper(ah.getSettings('db'));
      const dm = dh.getManager();
      if (!dm) {
        console.error('Unable to load DB Manager!!!');
        process.exit(99);
      }
      dh.init()
        .then(() => {
          resolve(dm.getClient());
        })
        .catch(e => {
          console.error('Failed to initialize db', e.message);
          console.error(e);
          process.exit(99);
        });
    } catch (e) {
      console.error('Failed to load DB Manager!!!', e.message);
      console.error(e);
      process.exit(99);
    }
  });
};

describe('Test account', function() {
  this.timeout(10000);
  let db;
  before(async function() {
    ah = AppHelper(settings);
    try {
      db = await loadDb();
    } catch (err) {
      console.error(err);
    }
  });

  after(async function() {
    releaseDHInstance();
  });

  describe('with name and email', function() {
    it('should return an account object with no keys nor permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe@example.com'
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

      assert.strictEqual(typeof resAccount.id, 'number');
      assert.strictEqual(resAccount.name, reqAccount.name);
      assert.strictEqual(resAccount.email, reqAccount.email);
      assert.strictEqual(resAccount.active, 1);
      assert.strictEqual(resAccount.public_keys.length, 0);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('retrieve account by email', function() {
    it('should return an account object with no keys nor permissions', async function() {
      const email = 'john.doe@example.com';
      const resAccount = await adminGetAccount(db, email);
      assert.strictEqual(typeof resAccount.id, 'number');
      assert.strictEqual(resAccount.email, email);
      assert.strictEqual(resAccount.active, 1);
      assert.strictEqual(resAccount.public_keys.length, 0);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('without name', function() {
    it('should return an error', async function() {
      const reqAccount = {
        email: 'john.doe@example.com'
      };

      let error;
      let resAccount;
      try {
        resAccount = await adminCreateAccount(db, reqAccount);
      } catch (er) {
        error = er;
      }
      assert.notStrictEqual(typeof error, 'undefined');
      assert.strictEqual(typeof resAccount, 'undefined');
    });
  });

  describe('without email', function() {
    it('should return an error', async function() {
      const reqAccount = {
        name: 'john.doe'
      };

      let error;
      let resAccount;
      try {
        resAccount = await adminCreateAccount(db, reqAccount);
      } catch (er) {
        error = er;
      }
      assert.notStrictEqual(typeof error, 'undefined');
      assert.strictEqual(typeof resAccount, 'undefined');
    });
  });

  describe('with name and email and 1 key', function() {
    it('should return an account object with 1 key and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.2@example.com',
        keys: [publicKeySample]
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

      assert.strictEqual(typeof resAccount.id, 'number');
      assert.strictEqual(resAccount.name, reqAccount.name);
      assert.strictEqual(resAccount.email, reqAccount.email);
      assert.strictEqual(resAccount.active, 1);
      assert.strictEqual(resAccount.public_keys.length, 1);
      assert.strictEqual(resAccount.public_keys[0].public_key, reqAccount.keys[0]);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('with name and email and 2 keys', function() {
    it('should return an account object with 2 keys and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.3@example.com',
        keys: [publicKeySample2, publicKeySample3]
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

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

  describe('disable account', function() {
    it('should return an account object with active set to 0', async function() {
      await adminEditAccount(db, 1, false);
      const account = await adminGetAccount(db, 1);
      assert.strictEqual(account.active, 0);
    });
  });

  describe('enable account', function() {
    it('should return an account object with active set to 1', async function() {
      await adminEditAccount(db, 1, true);
      const account = await adminGetAccount(db, 1);
      assert.strictEqual(account.active, 1);
    });
  });

  describe('delete account', function() {
    it('should return 404', async function() {
      await adminDeleteAccount(db, 2);
      try {
        await adminGetAccount(db, 2);
        assert.strictEqual(true, false);
      } catch (err) {
        assert.strictEqual(err.t_code, 404);
      }
    });
  });

  describe('add 1 key to an account', function() {
    it('should return an account object with 1 key and no permissions', async function() {
      const keys = [publicKeySample];

      const retKeys = await adminAddAccountKeys(db, 1, keys);
      const resAccount = await adminGetAccount(db, 1);

      assert.strictEqual(retKeys.account_id, 1);
      assert.strictEqual(retKeys.public_keys.length, 1);
      assert.strictEqual(retKeys.public_keys[0].public_key, keys[0]);
      assert.strictEqual(resAccount.public_keys.length, 1);
      assert.strictEqual(resAccount.public_keys[0].public_key, keys[0]);
    });
  });

  describe('delete 1 key to an account', function() {
    it('should return an account object with no key and no permissions', async function() {
      try {
        await adminDeleteAccountKey(db, 1, 4);
      } catch (err) {
        assert.strictEqual(true, false);
      }
      const resAccount = await adminGetAccount(db, 1);
      assert.strictEqual(resAccount.public_keys.length, 0);
    });
  });

  describe('add 1 permission to an account', function() {
    it('should return an account object with no key and 1 permission', async function() {
      const permission = {
        user: 'john',
        host: 'debian'
      };

      const retPermission = await adminAddAccountPermission(db, 1, permission.user, permission.host);
      const resAccount = await adminGetAccount(db, 1);

      assert.strictEqual(retPermission.account_id, 1);
      assert.strictEqual(typeof retPermission.permission_id, 'number');
      assert.strictEqual(resAccount.permissions.length, 1);
      assert.strictEqual(resAccount.permissions[0].user, permission.user);
      assert.strictEqual(resAccount.permissions[0].host, permission.host);
    });
  });

  describe('delete 1 permission to an account', function() {
    it('should return an account object with no key and no permissions', async function() {
      try {
        await adminDeleteAccountPermission(db, 1, 1);
      } catch (err) {
        console.error(err);
        assert.strictEqual(true, false);
      }
      const resAccount = await adminGetAccount(db, 1);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });

  describe('add 1 permission with options to an account', function() {
    it('should return an account object with no key and 1 permission', async function() {
      const permission = {
        user: 'mark',
        host: 'debian',
        ssh_options: {
          from: ['172.16.0.0/24']
        }
      };

      const retPermission = await adminAddAccountPermission(
        db,
        1,
        permission.user,
        permission.host,
        permission.ssh_options
      );
      const resAccount = await adminGetAccount(db, 1);

      assert.strictEqual(retPermission.account_id, 1);
      assert.strictEqual(typeof retPermission.permission_id, 'number');
      assert.strictEqual(resAccount.permissions.length, 1);
      assert.strictEqual(resAccount.permissions[0].user, permission.user);
      assert.strictEqual(resAccount.permissions[0].host, permission.host);
      assert.strictEqual(
        Object.keys(resAccount.permissions[0].ssh_options).length,
        Object.keys(permission.ssh_options).length
      );
      assert.strictEqual(resAccount.permissions[0].ssh_options.from.length, permission.ssh_options.from.length);
      assert.strictEqual(resAccount.permissions[0].ssh_options.from[0], permission.ssh_options.from[0]);
    });
  });

  describe('add 1 permission with other options to an account', function() {
    let account_id;
    let permission_id;
    after(async function() {
      await adminDeleteAccount(db, account_id);
    });

    it('should return an account object with no key and 1 permission', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.4@example.com'
      };

      const resAccountX = await adminCreateAccount(db, reqAccount);

      account_id = resAccountX.id;

      const permission = {
        user: '%',
        host: 'debian',
        ssh_options: {
          from: ['192.168.1.0/24', '10.10.0.0/16'],
          'no-user-rc': true
        }
      };

      const retPermission = await adminAddAccountPermission(
        db,
        account_id,
        permission.user,
        permission.host,
        permission.ssh_options
      );

      const resAccount = await adminGetAccount(db, account_id);

      assert.strictEqual(retPermission.account_id, account_id);
      assert.strictEqual(typeof retPermission.permission_id, 'number');
      assert.strictEqual(resAccount.permissions.length, 1);
      assert.strictEqual(resAccount.permissions[0].user, permission.user);
      assert.strictEqual(resAccount.permissions[0].host, permission.host);
      assert.strictEqual(
        Object.keys(resAccount.permissions[0].ssh_options).length,
        Object.keys(permission.ssh_options).length
      );
      assert.strictEqual(resAccount.permissions[0].ssh_options.from.length, permission.ssh_options.from.length);
      assert.strictEqual(resAccount.permissions[0].ssh_options.from[0], permission.ssh_options.from[0]);
      assert.strictEqual(resAccount.permissions[0].ssh_options.from[1], permission.ssh_options.from[1]);
      permission_id = resAccount.permissions[0].id;
    });

    it('should return an account object with no key and 1 permission', async function() {
      await adminUpdateAccountPermission(db, account_id, permission_id, { from: [] });

      const resAccount2 = await adminGetAccount(db, account_id);
      assert.strictEqual(resAccount2.permissions[0].ssh_options.from.length, 0);
    });
  });

  describe('add 1 permission with other options to a group', function() {
    let permission_id;
    let group_id;
    after(async function() {
      await adminDeleteGroup(db, group_id);
    });

    it('should return an account object with no key and 1 permission', async function() {
      const reqGroup = {
        name: 'developersx'
      };

      const group = await adminCreateGroup(db, reqGroup);

      group_id = group.id;

      const permission = {
        user: '%',
        host: 'debian',
        ssh_options: {
          from: ['192.168.1.0/24', '10.10.0.0/16'],
          'no-user-rc': true
        }
      };

      await adminAddGroupPermission(db, group_id, permission.user, permission.host, permission.ssh_options);

      const resGroup = await adminGetGroup(db, group_id);

      assert.strictEqual(typeof resGroup.id, 'number');
      assert.strictEqual(resGroup.name, reqGroup.name);
      assert.strictEqual(resGroup.active, 1);
      assert.strictEqual(resGroup.accounts.length, 0);
      assert.strictEqual(resGroup.permissions.length, 1);

      assert.strictEqual(resGroup.permissions.length, 1);
      assert.strictEqual(resGroup.permissions[0].user, permission.user);
      assert.strictEqual(resGroup.permissions[0].host, permission.host);
      assert.strictEqual(
        Object.keys(resGroup.permissions[0].ssh_options).length,
        Object.keys(permission.ssh_options).length
      );
      assert.strictEqual(resGroup.permissions[0].ssh_options.from.length, permission.ssh_options.from.length);
      assert.strictEqual(resGroup.permissions[0].ssh_options.from[0], permission.ssh_options.from[0]);
      assert.strictEqual(resGroup.permissions[0].ssh_options.from[1], permission.ssh_options.from[1]);
      permission_id = resGroup.permissions[0].id;
    });

    it('should return a group object with no key and 1 permission', async function() {
      await adminUpdateGroupPermission(db, group_id, permission_id, { from: [] });

      const resGroup = await adminGetGroup(db, group_id);
      assert.strictEqual(resGroup.permissions[0].ssh_options.from.length, 0);
    });
  });

  describe('Add 1 account with expired date', function() {
    it('should return an account object with expired date', async function() {
      const account = {
        email: 'expired@example.com',
        name: 'Expired',
        expire_at: '2018-01-01'
      };
      try {
        await adminCreateAccount(db, account);
      } catch (err) {
        console.error(err);
        assert.strictEqual(true, false);
      }
      const resAccount = await adminGetAccount(db, account.email);
      assert.strictEqual(resAccount.expire_at, 1514764800000);
    });
  });

  describe('with name and email and 1 SSH2 keys', function() {
    it('should return an account object with 1 key and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe.ssh2',
        email: 'john.doe.ssh2@example.com',
        keys: [publicSSH2Key]
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

      assert.strictEqual(typeof resAccount.id, 'number');
      assert.strictEqual(resAccount.name, reqAccount.name);
      assert.strictEqual(resAccount.email, reqAccount.email);
      assert.strictEqual(resAccount.active, 1);
      assert.strictEqual(resAccount.public_keys.length, 1);
      assert.strictEqual(resAccount.public_keys[0].public_key, publicSSH2KeyOpenSSH);
      assert.strictEqual(resAccount.permissions.length, 0);
    });
  });
});

describe('Test group', function() {
  this.timeout(10000);
  let db;
  before(async function() {
    try {
      db = await loadDb();
    } catch (err) {}
  });

  after(async function() {
    releaseDHInstance();
  });

  let group_id;
  let account_id;
  let permission_id;

  describe('with name', function() {
    it('should return a group object with no accounts nor permissions', async function() {
      const reqGroup = {
        name: 'developers'
      };

      const resGroup = await adminCreateGroup(db, reqGroup);

      group_id = resGroup.id;

      assert.strictEqual(typeof resGroup.id, 'number');
      assert.strictEqual(resGroup.name, reqGroup.name);
      assert.strictEqual(resGroup.active, 1);
      assert.strictEqual(resGroup.accounts.length, 0);
      assert.strictEqual(resGroup.permissions.length, 0);
    });
  });

  describe('without name', function() {
    it('should return an error', async function() {
      const reqGroup = {
        namex: 'developers'
      };

      let error;
      let resGroup;
      try {
        resGroup = await adminCreateGroup(db, reqGroup);
      } catch (er) {
        error = er;
      }
      assert.notStrictEqual(typeof error, 'undefined');
      assert.strictEqual(typeof resGroup, 'undefined');
    });
  });

  describe('edit group status', function() {
    it('should return a group object with active = false and no accounts nor permissions', async function() {
      const res = await adminEditGroup(db, group_id, false);
      assert.strictEqual(res, true);
      const resGroup = await adminGetGroup(db, group_id);
      assert.strictEqual(resGroup.active, 0);
    });
  });

  describe('add account to group', function() {
    it('should return a group object with active = false and 1 accounts and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.2@example.com',
        keys: [publicKeySample]
      };

      const resAccount = await adminCreateAccount(db, reqAccount);
      account_id = resAccount.id;
      const res = await adminCreateGroupAccount(db, group_id, account_id);
      assert.strictEqual(typeof res, 'number');
      assert.ok(res > 0);
      const resGroup = await adminGetGroup(db, group_id);
      assert.strictEqual(resGroup.active, 0);
      assert.strictEqual(resGroup.accounts.length, 1);
      assert.strictEqual(resGroup.accounts[0].id, account_id);
      assert.strictEqual(resGroup.permissions.length, 0);

      const resAccountWithGroup = await adminGetAccount(db, account_id);
      assert.strictEqual(resAccountWithGroup.groups.length, 2);
      assert.strictEqual(resAccountWithGroup.groups[0].id, group_id);
      assert.strictEqual(resAccountWithGroup.groups[0].name, resGroup.name);
    });
  });

  describe('remove account from group', function() {
    it('should return a group object with active = false and 0 accounts and no permissions', async function() {
      const res = await adminDeleteGroupAccount(db, group_id, account_id);
      assert.strictEqual(res, 1);
      const resGroup = await adminGetGroup(db, group_id);
      assert.strictEqual(resGroup.active, 0);
      assert.strictEqual(resGroup.accounts.length, 0);
      assert.strictEqual(resGroup.permissions.length, 0);
    });
  });

  describe('add permission to group', function() {
    it('should return a group object with active = false and 0 accounts and 1 permission', async function() {
      const permission = {
        user: 'john',
        host: 'debian'
      };

      const resPermission = await adminAddGroupPermission(db, group_id, permission.user, permission.host);
      const resGroup = await adminGetGroup(db, group_id);
      assert.strictEqual(resGroup.active, 0);
      assert.strictEqual(resGroup.accounts.length, 0);
      assert.strictEqual(resGroup.permissions.length, 1);
      assert.strictEqual(resGroup.permissions[0].id, resPermission.permission_id);
      assert.strictEqual(resGroup.permissions[0].user, permission.user);
      assert.strictEqual(resGroup.permissions[0].host, permission.host);
    });
  });

  describe('add another permission to group', function() {
    it('should return a group object with active = false and 0 accounts and 2 permission', async function() {
      const permission = {
        user: 'core',
        host: 'coreos'
      };

      const resPermission = await adminAddGroupPermission(db, group_id, permission.user, permission.host);
      permission_id = resPermission.permission_id;
      const resGroup = await adminGetGroup(db, group_id);
      assert.strictEqual(resGroup.active, 0);
      assert.strictEqual(resGroup.accounts.length, 0);
      assert.strictEqual(resGroup.permissions.length, 2);
      assert.strictEqual(resGroup.permissions[1].id, permission_id);
      assert.strictEqual(resGroup.permissions[1].user, permission.user);
      assert.strictEqual(resGroup.permissions[1].host, permission.host);
    });
  });

  describe('delete permission from group', function() {
    it('should return a group object with active = false and 0 accounts and 1 permission', async function() {
      const res = await adminDeleteGroupPermission(db, group_id, permission_id);
      assert.strictEqual(res, true);
      const resGroup = await adminGetGroup(db, group_id);
      assert.strictEqual(resGroup.active, 0);
      assert.strictEqual(resGroup.accounts.length, 0);
      assert.strictEqual(resGroup.permissions.length, 1);
    });
  });
});
