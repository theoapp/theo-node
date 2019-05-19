import AccountManager from '../managers/AccountManager';
import PermissionManager from '../managers/PermissionManager';
import GroupManager from '../managers/GroupManager';
import GroupAccountManager from '../managers/GroupAccountManager';
import EventHelper from './EventHelper';

export * from './admins/AdminAccountHelper';
export * from './admins/AdminKeyHelper';

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
