import AccountManager from '../managers/AccountManager';
import KeyManager from '../managers/KeyManager';
import PermissionManager from '../managers/PermissionManager';

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
