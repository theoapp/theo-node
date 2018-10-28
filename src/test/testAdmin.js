import assert from 'assert';

import AppHelper from '../lib/helpers/AppHelper';
import SqliteManager from '../lib/managers/SqliteManager';
import SqliteHelper, { releaseSHInstance } from '../lib/helpers/SqliteHelper';
import {
  adminAddAccountKey,
  adminAddAccountPermission,
  adminAddGroupPermission,
  adminCreateAccount,
  adminCreateGroup,
  adminCreateGroupAccount,
  adminDeleteAccount,
  adminDeleteAccountKey,
  adminDeleteAccountPermission,
  adminDeleteGroupAccount,
  adminDeleteGroupPermission,
  adminEditAccount,
  adminEditGroup,
  adminGetAccount,
  adminGetGroup
} from '../lib/helpers/AdminHelper';

const settings = {
  admin: {
    token: ''
  },
  client: {
    tokens: []
  },
  sqlite: {
    path: ':memory:'
  },
  server: {
    http_port: 9100
  }
};

AppHelper(settings);
let sh;
const loadDb = function(sm) {
  return new Promise((resolve, reject) => {
    sh = SqliteHelper(settings.sqlite, sm);
    setTimeout(() => {
      resolve(sh.getDb());
    }, 1000);
  });
};

const sm = new SqliteManager();

describe('Test account', function() {
  this.timeout(10000);
  let db;
  before(async function() {
    try {
      db = await loadDb(sm);
    } catch (err) {}
  });

  after(async function() {
    releaseSHInstance();
  });

  describe('with name and email', function() {
    it('should return an account object with no keys nor permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe@example.com'
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

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
      const resAccount = await adminGetAccount(db, email);
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

      let error;
      let resAccount;
      try {
        resAccount = await adminCreateAccount(db, reqAccount);
      } catch (er) {
        error = er;
      }
      assert.notEqual(typeof error, 'undefined');
      assert.equal(typeof resAccount, 'undefined');
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
      assert.notEqual(typeof error, 'undefined');
      assert.equal(typeof resAccount, 'undefined');
    });
  });

  describe('with name and email and 1 key', function() {
    it('should return an account object with 1 key and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.2@example.com',
        keys: ['ssh-rsa AAAAB3Nza john.doe.2@debian']
      };

      const resAccount = await adminCreateAccount(db, reqAccount);

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

      const resAccount = await adminCreateAccount(db, reqAccount);

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
      await adminEditAccount(db, 1, false);
      const account = await adminGetAccount(db, 1);
      assert.equal(account.active, 0);
    });
  });

  describe('enable account', function() {
    it('should return an account object with active set to 1', async function() {
      await adminEditAccount(db, 1, true);
      const account = await adminGetAccount(db, 1);
      assert.equal(account.active, 1);
    });
  });

  describe('delete account', function() {
    it('should return 404', async function() {
      await adminDeleteAccount(db, 2);
      try {
        await adminGetAccount(db, 2);
        assert.equal(true, false);
      } catch (err) {
        assert.equal(err.t_code, 404);
      }
    });
  });

  describe('add 1 key to an account', function() {
    it('should return an account object with 1 key and no permissions', async function() {
      const keys = ['ssh-rsa AAAAB3Nza john.doe.2@debian'];

      const retKeys = await adminAddAccountKey(db, 1, keys);
      const resAccount = await adminGetAccount(db, 1);

      assert.equal(retKeys.account_id, 1);
      assert.equal(retKeys.public_keys.length, 1);
      assert.equal(retKeys.public_keys[0].public_key, keys[0]);
      assert.equal(resAccount.public_keys.length, 1);
      assert.equal(resAccount.public_keys[0].public_key, keys[0]);
    });
  });

  describe('delete 1 key to an account', function() {
    it('should return an account object with no key and no permissions', async function() {
      try {
        await adminDeleteAccountKey(db, 1, 4);
      } catch (err) {
        assert.equal(true, false);
      }
      const resAccount = await adminGetAccount(db, 1);
      assert.equal(resAccount.public_keys.length, 0);
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

      assert.equal(retPermission.account_id, 1);
      assert.equal(typeof retPermission.permission_id, 'number');
      assert.equal(resAccount.permissions.length, 1);
      assert.equal(resAccount.permissions[0].user, permission.user);
      assert.equal(resAccount.permissions[0].host, permission.host);
    });
  });

  describe('delete 1 permission to an account', function() {
    it('should return an account object with no key and no permissions', async function() {
      try {
        await adminDeleteAccountPermission(db, 1, 1);
      } catch (err) {
        console.error(err);
        assert.equal(true, false);
      }
      const resAccount = await adminGetAccount(db, 1);
      assert.equal(resAccount.permissions.length, 0);
    });
  });
});

describe('Test group', function() {
  this.timeout(10000);
  let db;
  before(async function() {
    try {
      db = await loadDb(sm);
    } catch (err) {}
  });

  after(async function() {
    releaseSHInstance();
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

      let error;
      let resGroup;
      try {
        resGroup = await adminCreateGroup(db, reqGroup);
      } catch (er) {
        error = er;
      }
      assert.notEqual(typeof error, 'undefined');
      assert.equal(typeof resGroup, 'undefined');
    });
  });

  describe('edit group status', function() {
    it('should return a group object with active = false and no accounts nor permissions', async function() {
      const res = await adminEditGroup(db, group_id, false);
      assert.equal(res, true);
      const resGroup = await adminGetGroup(db, group_id);
      assert.equal(resGroup.active, 0);
    });
  });

  describe('add account to group', function() {
    it('should return a group object with active = false and 1 accounts and no permissions', async function() {
      const reqAccount = {
        name: 'john.doe',
        email: 'john.doe.2@example.com',
        keys: ['ssh-rsa AAAAB3Nza john.doe.2@debian']
      };

      const resAccount = await adminCreateAccount(db, reqAccount);
      account_id = resAccount.id;
      const res = await adminCreateGroupAccount(db, group_id, account_id);
      assert.equal(res, true);
      const resGroup = await adminGetGroup(db, group_id);
      assert.equal(resGroup.active, 0);
      assert.equal(resGroup.accounts.length, 1);
      assert.equal(resGroup.accounts[0].id, account_id);
      assert.equal(resGroup.permissions.length, 0);

      const resAccountWithGroup = await adminGetAccount(db, account_id);
      assert.equal(resAccountWithGroup.groups.length, 1);
      assert.equal(resAccountWithGroup.groups[0].id, group_id);
      assert.equal(resAccountWithGroup.groups[0].name, resGroup.name);
    });
  });

  describe('remove account from group', function() {
    it('should return a group object with active = false and 0 accounts and no permissions', async function() {
      const res = await adminDeleteGroupAccount(db, group_id, account_id);
      assert.equal(res, true);
      const resGroup = await adminGetGroup(db, group_id);
      assert.equal(resGroup.active, 0);
      assert.equal(resGroup.accounts.length, 0);
      assert.equal(resGroup.permissions.length, 0);
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
      assert.equal(resGroup.active, 0);
      assert.equal(resGroup.accounts.length, 0);
      assert.equal(resGroup.permissions.length, 1);
      assert.equal(resGroup.permissions[0].id, resPermission.permission_id);
      assert.equal(resGroup.permissions[0].user, permission.user);
      assert.equal(resGroup.permissions[0].host, permission.host);
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
      assert.equal(resGroup.active, 0);
      assert.equal(resGroup.accounts.length, 0);
      assert.equal(resGroup.permissions.length, 2);
      assert.equal(resGroup.permissions[1].id, permission_id);
      assert.equal(resGroup.permissions[1].user, permission.user);
      assert.equal(resGroup.permissions[1].host, permission.host);
    });
  });

  describe('delete permission from group', function() {
    it('should return a group object with active = false and 0 accounts and 1 permission', async function() {
      const res = await adminDeleteGroupPermission(db, group_id, permission_id);
      assert.equal(res, true);
      const resGroup = await adminGetGroup(db, group_id);
      assert.equal(resGroup.active, 0);
      assert.equal(resGroup.accounts.length, 0);
      assert.equal(resGroup.permissions.length, 1);
    });
  });
});
