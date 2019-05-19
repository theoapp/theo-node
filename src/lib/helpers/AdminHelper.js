import AccountManager from '../managers/AccountManager';
import KeyManager from '../managers/KeyManager';
import PermissionManager from '../managers/PermissionManager';
import { getKeysImporterModule, getKeysImporterModulesList } from '../keys_importer/modules';
import GroupManager from '../managers/GroupManager';
import GroupAccountManager from '../managers/GroupAccountManager';
import EventHelper from './EventHelper';
import AppHelper from './AppHelper';
import { SSHFingerprint } from '../utils/sshUtils';

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
    EventHelper.emit('theo:change', {
      func: 'account',
      action: 'create',
      object: id,
      receiver: 'admin'
    });
    const group_id = await adminCreateGroup(db, { name: account.email }, true);
    await adminCreateGroupAccount(db, group_id, id);
    if (account.keys) {
      await adminAddAccountKey(db, id, account.keys);
    }
    return am.getFull(id);
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminEditAccount = async (db, account_id, active, expire_at) => {
  if (typeof active === 'undefined' && typeof expire_at === 'undefined') {
    return;
  }
  const am = new AccountManager(db);
  try {
    if (isNaN(account_id)) {
      account_id = await am.getIdByEmail(account_id);
    }
    if (typeof active !== 'undefined' && typeof expire_at !== 'undefined') {
      const ret = await am.update(account_id, active, expire_at);
      if (ret === 0) {
        const error = new Error('Account not found');
        error.t_code = 404;
        throw error;
      }
    } else if (typeof active !== 'undefined') {
      const ret = await am.changeStatus(account_id, active);
      if (ret === 0) {
        const error = new Error('Account not found');
        error.t_code = 404;
        throw error;
      }
    } else {
      const ret = await am.updateExpire(account_id, expire_at);
      if (ret === 0) {
        const error = new Error('Account not found');
        error.t_code = 404;
        throw error;
      }
    }
    EventHelper.emit('theo:change', {
      func: 'account',
      action: 'edit',
      object: account_id,
      receiver: 'admin'
    });
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminGetAccount = async (db, account_id) => {
  const am = new AccountManager(db);

  let account;

  try {
    if (isNaN(account_id)) {
      account = await am.getFullByEmail(account_id);
    } else {
      account = await am.getFull(Number(account_id));
    }
    EventHelper.emit('theo:fetch', {
      func: 'account',
      action: 'get',
      object: account.id
    });
  } catch (err) {
    const error = new Error('Account not found');
    error.t_code = 404;
    throw error;
  }

  return account;
};

export const adminDeleteAccount = async (db, account_id) => {
  const am = new AccountManager(db);
  let accountEmail;
  try {
    if (isNaN(account_id)) {
      accountEmail = Object.assign('', account_id);
      account_id = await am.getIdByEmail(account_id);
    } else {
      const account = await am.get(account_id);
      accountEmail = account.email;
    }
    const ret = await am.delete(account_id);
    if (ret === 0) {
      const error = new Error('Account not found');
      error.t_code = 404;
      throw error;
    }
    const gm = new GroupManager(db);
    try {
      await gm.deleteInternal(accountEmail);
    } catch (e) {
      // I don't care
    }

    EventHelper.emit('theo:change', {
      func: 'account',
      action: 'delete',
      object: account_id,
      receiver: 'admin'
    });
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminAddAccountKey = async (db, account_id, keys) => {
  const am = new AccountManager(db);
  try {
    if (isNaN(account_id)) {
      account_id = await am.getIdByEmail(account_id);
    } else {
      const account = await am.get(account_id);
      account_id = account.id;
    }
  } catch (err) {
    err.t_code = 404;
    throw err;
  }
  const ret = {
    account_id,
    public_keys: []
  };
  const km = new KeyManager(db);
  const ah = AppHelper();
  const settingsKeys = ah.getSettings('keys');
  const signRequired = settingsKeys && settingsKeys.sign === true;
  try {
    for (let i = 0; i < keys.length; i++) {
      let __key = keys[i];
      let key;
      if (typeof __key === 'string') {
        if (signRequired) {
          const err = new Error('Key must be signed');
          err.t_code = 400;
          console.error('Key must be signed!');
          throw err;
        }

        const _key = __key.trim();
        if (!_key) {
          continue;
        }
        const fingerprint = SSHFingerprint(_key);
        const id = await km.create(account_id, _key, fingerprint);
        key = {
          id,
          public_key: keys[i]
        };
      } else {
        // Object, we got also sign
        const _key = __key.key.trim();
        const _signature = __key.signature.trim();
        if (!_key) {
          continue;
        }
        if (!_signature && signRequired) {
          const err = new Error('Key must be signed');
          err.t_code = 400;
          throw err;
        }
        const fingerprint = SSHFingerprint(_key);
        const id = await km.create(account_id, _key, fingerprint, _signature);
        key = {
          id,
          public_key: keys[i]
        };
      }
      ret.public_keys.push(key);
    }
    EventHelper.emit('theo:change', {
      func: 'account_keys',
      action: 'add',
      object: account_id,
      receiver: 'admin'
    });
    return ret;
  } catch (err) {
    if (!err.t_code) {
      err.t_code = 500;
    }
    throw err;
  }
};

export const adminAddAccountKeyFromService = async (db, account_id, service, username) => {
  const ah = AppHelper();
  const settingsKeys = ah.getSettings('keys');
  if (settingsKeys && settingsKeys.sign) {
    const err = new Error('Import function is not available when REQUIRE_SIGNED_KEY is set');
    err.t_code = 400;
    throw err;
  }

  const am = new AccountManager(db);
  try {
    if (isNaN(account_id)) {
      account_id = await am.getIdByEmail(account_id);
    } else {
      await am.get(account_id);
    }
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
      const fingerprint = ''; // TODO get ssh key's fingerprint
      const id = await km.create(account_id, _key, fingerprint);
      const key = {
        id,
        public_key: keys[i]
      };
      ret.public_keys.push(key);
    }
    EventHelper.emit('theo:change', {
      func: 'account_keys',
      action: 'add_from_service',
      object: account_id,
      receiver: 'admin'
    });
    return ret;
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminDeleteAccountKey = async (db, account_id, key_id) => {
  const am = new AccountManager(db);
  try {
    if (isNaN(account_id)) {
      account_id = await am.getIdByEmail(account_id);
    } else {
      await am.get(account_id);
    }
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
    EventHelper.emit('theo:change', {
      func: 'account_keys',
      action: 'delete',
      object: account_id,
      receiver: 'admin'
    });
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
  let account;
  try {
    if (isNaN(account_id)) {
      account_id = await am.getIdByEmail(account_id);
    }
    account = await am.get(account_id);
    account_id = account.id;
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  const gm = new GroupManager(db);
  const group_id = await gm.getIdByName(account.email);
  if (!group_id) {
    console.error('Unable to get default group for %s', account.email);
    const error = new Error('Unable to get default group for ' + account.email);
    error.code = 500;
    throw error;
  }
  const pm = new PermissionManager(db);
  try {
    const permission_id = await pm.create(group_id, user, host);
    EventHelper.emit('theo:change', {
      func: 'account_permissions',
      action: 'add',
      object: account_id,
      receiver: 'admin'
    });
    return { account_id, permission_id };
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminDeleteAccountPermission = async (db, account_id, permission_id) => {
  const am = new AccountManager(db);
  let account;
  try {
    if (isNaN(account_id)) {
      account_id = await am.getIdByEmail(account_id);
    }
    account = await am.get(account_id);
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  const gm = new GroupManager(db);
  const group_id = await gm.getIdByName(account.email);
  const pm = new PermissionManager(db);
  try {
    const ret = await pm.delete(group_id, permission_id);
    if (ret === 0) {
      const error = new Error('Permission not found');
      error.t_code = 404;
      throw error;
    }
    EventHelper.emit('theo:change', {
      func: 'account_permissions',
      action: 'delete',
      object: account_id,
      receiver: 'admin'
    });
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

// GROUP FUNCTIONS

export const adminCreateGroup = async (db, group, onlyId = false) => {
  if (!group.name) {
    const error = new Error('Malformed object, name is required');
    error.t_code = 400;
    throw error;
  }
  const gm = new GroupManager(db);
  const check = await gm.checkName(group.name);
  if (check) {
    const error = new Error('Group already exists');
    error.t_code = 409;
    throw error;
  }
  try {
    const id = await gm.create(group.name);
    EventHelper.emit('theo:change', {
      func: 'group',
      action: 'add',
      object: id,
      receiver: 'admin'
    });
    if (onlyId) return id;
    return gm.getFull(id);
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminGetGroup = async (db, id) => {
  const gm = new GroupManager(db);
  try {
    if (isNaN(id)) {
      id = await gm.getIdByName(id);
    }
    return gm.getFull(id);
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminEditGroup = async (db, group_id, active) => {
  const gm = new GroupManager(db);
  try {
    if (isNaN(group_id)) {
      group_id = await gm.getIdByName(group_id);
    }
    const ret = await gm.changeStatus(group_id, active);
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

export const adminDeleteGroup = async (db, group_id) => {
  const gm = new GroupManager(db);
  try {
    if (isNaN(group_id)) {
      group_id = await gm.getIdByName(group_id);
    }
    const ret = await gm.delete(group_id);
    console.log('Got: ', ret);
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

export const adminCreateGroupAccount = async (db, group_id, account_id) => {
  if (!account_id) {
    const error = new Error('Malformed object, id is required');
    error.t_code = 400;
    throw error;
  }
  const gam = new GroupAccountManager(db);
  try {
    const gm = new GroupManager(db);
    if (isNaN(group_id)) {
      group_id = await gm.getIdByName(group_id);
    } else {
      // Check group id...
      await gm.get(group_id);
    }
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
  try {
    const am = new AccountManager(db);
    if (isNaN(account_id)) {
      account_id = await am.getIdByEmail(account_id);
    } else {
      await am.get(account_id);
    }
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
  return gam.create(group_id, account_id);
};

export const adminCreateGroupAccounts = async (db, group_id, accounts_id) => {
  if (!accounts_id) {
    const error = new Error('Malformed object, ids is required');
    error.t_code = 400;
    throw error;
  }
  const ret = [];
  const gam = new GroupAccountManager(db);
  const gm = new GroupManager(db);
  try {
    if (isNaN(group_id)) {
      group_id = await gm.getIdByName(group_id);
    } else {
      // Check group id...
      await gm.get(group_id);
    }
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
  const am = new AccountManager(db);
  let invalidateCache = false;
  for (let i = 0; i < accounts_id.length; i++) {
    let account_id = accounts_id[i];
    try {
      if (isNaN(account_id)) {
        account_id = await am.getIdByEmail(account_id);
      } else {
        await am.get(account_id);
      }
    } catch (err) {
      if (!err.t_code) err.t_code = 500;
      ret.push({ account: accounts_id[i], status: err.t_code, reason: err.message });
      continue;
    }
    try {
      await gam.create(group_id, account_id, true);
      ret.push({ account: accounts_id[i], status: 200 });
      invalidateCache = true;
    } catch (err) {
      if (!err.t_code) err.t_code = 500;
      ret.push({ account: accounts_id[i], status: err.t_code, reason: err.message });
    }
  }
  if (invalidateCache) {
    try {
      await gm.setUpdatedAt(group_id);
    } catch (e) {
      console.error('Failed to invalidate cache!', e.message);
    }
  }
  return ret;
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
    if (isNaN(group_id)) {
      group_id = await gm.getIdByName(group_id);
    }
    await gm.get(group_id);
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  const pm = new PermissionManager(db);
  try {
    const permission_id = await pm.create(group_id, user, host);
    return { group_id, permission_id };
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminDeleteGroupPermission = async (db, group_id, permission_id) => {
  const gm = new GroupManager(db);
  try {
    if (isNaN(group_id)) {
      group_id = await gm.getIdByName(group_id);
    }
    await gm.get(group_id);
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  const pm = new PermissionManager(db);
  try {
    const ret = await pm.delete(group_id, permission_id);
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

export const adminDeleteGroupAccount = async (db, group_id, account_id) => {
  if (!group_id) {
    const error = new Error('Malformed url, group_id is required');
    error.t_code = 400;
    throw error;
  }
  if (!account_id) {
    const error = new Error('Malformed url, account_id is required');
    error.t_code = 400;
    throw error;
  }
  const gam = new GroupAccountManager(db);
  try {
    const gm = new GroupManager(db);
    if (isNaN(group_id)) {
      group_id = await gm.getIdByName(group_id);
    } else {
      await gm.get(group_id); // I need it to check if group exists!
    }
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
  try {
    const am = new AccountManager(db);
    if (isNaN(account_id)) {
      account_id = await am.getIdByEmail(account_id);
    } else {
      await am.get(account_id); // I need it to check if account exists!
    }
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
  return gam.delete(group_id, account_id);
};
