import GroupAccountManager from '../../managers/GroupAccountManager';
import GroupManager from '../../managers/GroupManager';
import AccountManager from '../../managers/AccountManager';

export const adminCreateGroupAccount = async (db, group_id, account_id, req) => {
  if (!account_id) {
    const error = new Error('Malformed object, id is required');
    error.t_code = 400;
    throw error;
  }
  let group;
  let account;
  const gam = new GroupAccountManager(db);
  try {
    const gm = new GroupManager(db);
    if (isNaN(group_id)) {
      group = await gm.getByName(group_id);
      group_id = group.id;
    } else {
      // Check group id...
      group = await gm.get(group_id);
    }
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
  if (!group) {
    const err = new Error('Group not found');
    err.t_code = 404;
    throw err;
  }
  try {
    const am = new AccountManager(db);
    if (isNaN(account_id)) {
      account = await am.getByEmail(account_id);
      account_id = account.id;
    } else {
      account = await am.get(account_id);
    }
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
  if (!account) {
    const err = new Error('Account not found');
    err.t_code = 404;
    throw err;
  }
  const ret = await gam.create(group_id, account_id);
  if (req && req.auditHelper) {
    if (account.email !== group.name) {
      req.auditHelper.log('accounts', 'add_to_group', account.email, group.name);
      req.auditHelper.log('groups', 'add_account', group.name, account.email);
    }
  }
  return ret;
};

export const adminCreateGroupAccounts = async (db, group_id, accounts_id, req) => {
  if (!accounts_id) {
    const error = new Error('Malformed object, ids is required');
    error.t_code = 400;
    throw error;
  }
  if (typeof accounts_id !== 'object' || typeof accounts_id.length !== 'number') {
    const error = new Error('Malformed object, ids must be an array');
    error.t_code = 400;
    throw error;
  }
  const ret = [];
  const gam = new GroupAccountManager(db);
  const gm = new GroupManager(db);
  let group;
  try {
    if (isNaN(group_id)) {
      group = await gm.getByName(group_id);
      group_id = group.id;
    } else {
      // Check group id...
      group = await gm.get(group_id);
    }
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
  const am = new AccountManager(db);
  let invalidateCache = false;
  for (let i = 0; i < accounts_id.length; i++) {
    let account;
    let account_id = accounts_id[i];
    try {
      if (isNaN(account_id)) {
        account = await am.getByEmail(account_id);
        account_id = account.id;
      } else {
        account = await am.get(account_id);
      }
    } catch (err) {
      if (!err.t_code) err.t_code = 500;
      ret.push({ account: accounts_id[i], status: err.t_code, reason: err.message });
      continue;
    }
    try {
      await gam.create(group_id, account_id, true);
      ret.push({ account: accounts_id[i], status: 200 });
      if (req && req.auditHelper) {
        if (account.email !== group.name) {
          req.auditHelper.log('accounts', 'add_to_group', account.email, group.name);
          req.auditHelper.log('groups', 'add_account', group.name, account.email);
        }
      }
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

export const adminDeleteGroupAccount = async (db, group_id, account_id, req) => {
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
  let group;
  let account;
  const gam = new GroupAccountManager(db);
  try {
    const gm = new GroupManager(db);
    if (isNaN(group_id)) {
      group = await gm.getByName(group_id);
      group_id = group.id;
    } else {
      group = await gm.get(group_id); // I need it to check if group exists!
    }
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
  try {
    const am = new AccountManager(db);
    if (isNaN(account_id)) {
      account = await am.getIdByEmail(account_id);
      account_id = account.id;
    } else {
      account = await am.get(account_id); // I need it to check if account exists!
    }
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
  const ret = await gam.delete(group_id, account_id);
  if (req && req.auditHelper) {
    if (account.email !== group.name) {
      req.auditHelper.log('accounts', 'remove_from_group', account.email, group.name);
      req.auditHelper.log('groups', 'remove_account', group.name, account.email);
    }
  }
  return ret;
};
