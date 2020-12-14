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

import AccountManager from '../../managers/AccountManager';
import GroupManager from '../../managers/GroupManager';
import PermissionManager from '../../managers/PermissionManager';
import EventHelper from '../EventHelper';

export const adminAddAccountPermission = async (db, account_id, user, host, ssh_options, req) => {
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
    const permission_id = await pm.create(group_id, user, host, ssh_options);
    EventHelper.emit('theo:change', {
      func: 'account_permissions',
      action: 'add',
      object: account_id,
      receiver: 'admin'
    });
    if (req && req.auditHelper) {
      req.auditHelper.log('accounts', 'add_permission', account.email, {
        user,
        host,
        ssh_options
      });
    }
    return { account_id, permission_id };
  } catch (err) {
    console.error(err);
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
      req.auditHelper.log('accounts', 'remove_permission', account.email, {
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

export const adminUpdateAccountPermission = async (db, account_id, permission_id, ssh_options, req) => {
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
    await pm.updateSSHOptions(group_id, permission_id, ssh_options);
    EventHelper.emit('theo:change', {
      func: 'account_permissions',
      action: 'update',
      object: account.id,
      receiver: 'admin'
    });
    if (req && req.auditHelper) {
      req.auditHelper.log('accounts', 'update_permission', account.email, {
        user: permission.user,
        host: permission.host,
        ssh_options_old: permission.ssh_options,
        ssh_options_new: req.body.ssh_options
      });
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};
