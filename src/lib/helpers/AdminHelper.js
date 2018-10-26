import AccountManager from '../managers/AccountManager';
import KeyManager from '../managers/KeyManager';
import PermissionManager from '../managers/PermissionManager';
import { getKeysImporterModule, getKeysImporterModulesList } from '../keys_importer/modules';
import GroupManager from '../managers/GroupManager';
import GroupAccountManager from '../managers/GroupAccountManager';

export const adminCreateAccount = async (db, account) => {
  if (!account.email) {
    const error = new Error('Malformed object, email is required');
    error.t_code = 400;
    throw error;
  }
  if (!account.name) {
    const error = new Error('Malformed object, name is required');
    error.t_code = 400;
    throw error;
  }
  const am = new AccountManager(db);
  try {
    const id = await am.create(account);
    if (account.keys) {
      const km = new KeyManager(db);
      for (let i = 0; i < account.keys.length; i++) {
        await km.create(id, account.keys[i]);
      }
    }
    return am.getFull(id);
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminEditAccount = async (db, account_id, active) => {
  const am = new AccountManager(db);
  try {
    const ret = await am.changeStatus(account_id, active);
    if (ret === 0) {
      const error = new Error('Account not found');
      error.t_code = 404;
      throw error;
    }
    return true;
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminGetAccount = async (db, account_id) => {
  const am = new AccountManager(db);
  try {
    return await am.getFull(account_id);
  } catch (err) {
    const error = new Error('Account not found');
    error.t_code = 404;
    throw error;
  }
};

export const adminDeleteAccount = async (db, account_id) => {
  const am = new AccountManager(db);
  try {
    const ret = await am.delete(account_id);
    if (ret === 0) {
      const error = new Error('Account not found');
      error.t_code = 404;
      throw error;
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminAddAccountKey = async (db, account_id, keys) => {
  const am = new AccountManager(db);
  try {
    await am.get(account_id);
  } catch (err) {
    err.t_code = 404;
    throw err;
  }
  const ret = {
    account_id,
    public_keys: []
  };
  const km = new KeyManager(db);
  try {
    for (let i = 0; i < keys.length; i++) {
      const _key = keys[i].trim();
      if (!_key) {
        continue;
      }
      const id = await km.create(account_id, _key);
      const key = {
        id,
        public_key: keys[i]
      };
      ret.public_keys.push(key);
    }
    return ret;
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminAddAccountKeyFromService = async (db, account_id, service, username) => {
  const am = new AccountManager(db);
  try {
    await am.get(account_id);
  } catch (err) {
    err.t_code = 404;
    throw err;
  }
  if (!service) {
    const error = new Error('Service not valid');
    error.t_code = 400;
    throw error;
  }
  if (!username) {
    const error = new Error('Username not valid');
    error.t_code = 400;
    throw error;
  }
  let keys;
  try {
    const KimClass = getKeysImporterModule(service);
    if (!KimClass) {
      const error = new Error(
        'Service ' + service + ' not found. Valid services are: ' + getKeysImporterModulesList().join(', ')
      );
      error.t_code = 400;
      throw error;
    }
    const kim = new KimClass();
    keys = (await kim.get(username)) || [];
  } catch (err) {
    err.t_code = 400;
    throw err;
  }
  const ret = {
    account_id,
    public_keys: []
  };
  const km = new KeyManager(db);
  try {
    for (let i = 0; i < keys.length; i++) {
      const _key = keys[i].trim();
      if (!_key) {
        continue;
      }
      const id = await km.create(account_id, _key);
      const key = {
        id,
        public_key: keys[i]
      };
      ret.public_keys.push(key);
    }
    return ret;
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminDeleteAccountKey = async (db, account_id, key_id) => {
  const am = new AccountManager(db);
  try {
    await am.get(account_id);
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  const km = new KeyManager(db);
  try {
    const ret = await km.delete(account_id, key_id);
    if (ret === 0) {
      const error = new Error('Key not found');
      error.t_code = 404;
      throw error;
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminAddAccountPermission = async (db, account_id, user, host) => {
  if (!user) {
    const error = new Error('Malformed object, user is required');
    error.code = 400;
    throw error;
  }
  if (!host) {
    const error = new Error('Malformed object, host is required');
    error.code = 400;
    throw error;
  }
  const am = new AccountManager(db);
  try {
    await am.get(account_id);
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  const pm = new PermissionManager(db);
  try {
    const permission_id = await pm.create(account_id, user, host);
    return { account_id, permission_id };
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminDeleteAccountPermission = async (db, account_id, permission_id) => {
  const am = new AccountManager(db);
  try {
    await am.get(account_id);
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  const pm = new PermissionManager(db);
  try {
    const ret = await pm.delete(account_id, permission_id);
    if (ret === 0) {
      const error = new Error('Permission not found');
      error.t_code = 404;
      throw error;
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

// GROUP FUNCTIONS

export const adminCreateGroup = async (db, group) => {
  if (!group.name) {
    const error = new Error('Malformed object, name is required');
    error.t_code = 400;
    throw error;
  }
  const gm = new GroupManager(db);
  try {
    const id = await gm.create(group.name);
    return gm.getFull(id);
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminGetGroup = async (db, id) => {
  const gm = new GroupManager(db);
  try {
    return gm.getFull(id);
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminEditGroup = async (db, group_id, active) => {
  const gm = new GroupManager(db);
  try {
    const ret = await gm.changeStatus(group_id, active);
    if (ret === 0) {
      const error = new Error('Group not found');
      error.t_code = 404;
      throw error;
    }
    return true;
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminDeleteGroup = async (db, group_id) => {
  const gm = new GroupManager(db);
  try {
    const ret = await gm.delete(group_id);
    if (ret === 0) {
      const error = new Error('Group not found');
      error.t_code = 404;
      throw error;
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

// Group / Account functions

export const adminCreateGroupAccount = async (db, group_id, account) => {
  if (!account.id) {
    const error = new Error('Malformed object, id is required');
    error.t_code = 400;
    throw error;
  }
  const gam = new GroupAccountManager(db);
  try {
    await gam.create(group_id, account.id);
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminAddGroupPermission = async (db, group_id, user, host) => {
  if (!user) {
    const error = new Error('Malformed object, user is required');
    error.code = 400;
    throw error;
  }
  if (!host) {
    const error = new Error('Malformed object, host is required');
    error.code = 400;
    throw error;
  }
  const gm = new GroupManager(db);
  try {
    await gm.get(group_id);
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  const pm = new PermissionManager(db);
  try {
    const permission_id = await pm.createGroup(group_id, user, host);
    return { group_id, permission_id };
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminDeleteGroupPermission = async (db, group_id, permission_id) => {
  const gm = new GroupManager(db);
  try {
    await gm.get(group_id);
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  const pm = new PermissionManager(db);
  try {
    const ret = await pm.deleteGroup(group_id, permission_id);
    if (ret === 0) {
      const error = new Error('Permission not found');
      error.t_code = 404;
      throw error;
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};
