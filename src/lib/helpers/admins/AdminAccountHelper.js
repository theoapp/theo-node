import AccountManager from '../../managers/AccountManager';
import EventHelper from '../EventHelper';
import AuditHelper from '../AuditHelper';
import GroupManager from '../../managers/GroupManager';
import { adminAddAccountKeys, adminCreateGroup, adminCreateGroupAccount } from '../AdminHelper';

export const adminCreateAccount = async (db, account, auth_token) => {
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
    AuditHelper.log(auth_token, 'accounts', 'create', account.email);
    const group_id = await adminCreateGroup(db, { name: account.email }, auth_token, true);
    await adminCreateGroupAccount(db, group_id, id, auth_token);
    if (account.keys) {
      await adminAddAccountKeys(db, id, account.keys, auth_token);
    }
    return am.getFull(id);
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminEditAccount = async (db, account_id, active, expire_at, auth_token) => {
  if (typeof active === 'undefined' && typeof expire_at === 'undefined') {
    return;
  }
  const am = new AccountManager(db);
  let account;
  try {
    if (isNaN(account_id)) {
      account = await am.getByEmail(account_id);
      account_id = account.id;
    } else {
      account = await am.get(account_id);
    }
    if (!account) {
      const error = new Error('Account not found');
      error.t_code = 404;
      throw error;
    }
    let ret;
    let newActive = account.active;
    let newExpireAt = account.expire_at;
    if (typeof active !== 'undefined' && typeof expire_at !== 'undefined') {
      newActive = active;
      newExpireAt = expire_at;
      ret = await am.update(account_id, active, expire_at);
    } else if (typeof active !== 'undefined') {
      newActive = active;
      ret = await am.changeStatus(account_id, active);
    } else {
      newExpireAt = expire_at;
      ret = await am.updateExpire(account_id, expire_at);
    }
    if (ret === 0) {
      return true;
    }
    EventHelper.emit('theo:change', {
      func: 'account',
      action: 'edit',
      object: account_id,
      receiver: 'admin'
    });
    AuditHelper.log(auth_token, 'accounts', 'edit', account.email, {
      active: {
        prev: account.active,
        next: newActive
      },
      expire_at: {
        prev: account.expire_at,
        next: newExpireAt
      }
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

export const adminDeleteAccount = async (db, account_id, auth_token) => {
  const am = new AccountManager(db);
  let account;
  let account_email;
  try {
    if (isNaN(account_id)) {
      account = await am.getByEmail(account_id);
      account_id = account.id;
    } else {
      account = await am.get(account_id);
      account_email = account.email;
    }

    const ret = await am.delete(account_id);
    if (ret === 0) {
      const error = new Error('Account not found');
      error.t_code = 404;
      throw error;
    }
    const gm = new GroupManager(db);
    try {
      await gm.deleteInternal(account_email);
    } catch (e) {
      // I don't care
    }

    EventHelper.emit('theo:change', {
      func: 'account',
      action: 'delete',
      object: account_id,
      receiver: 'admin'
    });
    AuditHelper.log(auth_token, 'accounts', 'delete', account_email);
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};
