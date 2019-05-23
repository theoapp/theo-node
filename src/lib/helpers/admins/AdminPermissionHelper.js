import AccountManager from '../../managers/AccountManager';
import GroupManager from '../../managers/GroupManager';
import PermissionManager from '../../managers/PermissionManager';
import EventHelper from '../EventHelper';
import AuditHelper from '../AuditHelper';

export const adminAddAccountPermission = async (db, account_id, user, host, req) => {
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
    if (req && req.auditHelper) {
      req.auditHelper.log('permissions', 'add', account.email, {
        user,
        host
      });
    }
    return { account_id, permission_id };
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminDeleteAccountPermission = async (db, account_id, permission_id, req) => {
  const am = new AccountManager(db);
  let account;
  try {
    if (isNaN(account_id)) {
      account = await am.getByEmail(account_id);
    } else {
      account = await am.get(account_id);
    }
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  const gm = new GroupManager(db);
  const group_id = await gm.getIdByName(account.email);
  const pm = new PermissionManager(db);
  try {
    const permission = await pm.get(group_id, permission_id);
    if (!permission) {
      const error = new Error('Permission not found');
      error.t_code = 404;
      throw error;
    }
    await pm.delete(group_id, permission_id);
    EventHelper.emit('theo:change', {
      func: 'account_permissions',
      action: 'delete',
      object: account.id,
      receiver: 'admin'
    });
    if (req && req.auditHelper) {
      req.auditHelper.log('permissions', 'delete', account.email, {
        user: permission.user,
        host: permission.host
      });
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};
