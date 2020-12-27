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
import { adminCreateGroup } from './AdminGroupHelper';
import EventHelper from '../EventHelper';
import { adminAddAccountKeys } from './AdminKeyHelper';
import { adminCreateGroupAccount } from './AdminGroupAccountHelper';

export const adminCreateAccount = async (db, account, req) => {
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
    if (req && req.auditHelper) {
      req.auditHelper.log('accounts', 'create', account.email);
    }
    const group_id = await adminCreateGroup(db, { name: account.email }, req, true);
    await adminCreateGroupAccount(db, group_id, id, req);
    if (account.keys) {
      await adminAddAccountKeys(db, id, account.keys, req);
    }
    return am.getFull(id);
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminEditAccount = async (db, account_id, active, expire_at, req) => {
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
    if (req && req.auditHelper) {
      req.auditHelper.log('accounts', 'edit', account.email, {
        active: {
          prev: account.active ? 'true' : 'false',
          next: newActive ? 'true' : 'false'
        },
        expire_at: {
          prev: account.expire_at,
          next: newExpireAt
        }
      });
    }
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
  } catch (err) {
    if (err.t_code) {
      throw err;
    }
    const error = new Error('Account not found');
    error.t_code = 404;
    throw error;
  }

  return account;
};

export const adminDeleteAccount = async (db, account_id, req) => {
  const am = new AccountManager(db);
  let account;
  let account_email;
  try {
    if (isNaN(account_id)) {
      account = await am.getByEmail(account_id);
      account_id = account.id;
    } else {
      account = await am.get(account_id);
    }
    account_email = account.email;
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
    if (req && req.auditHelper) {
      req.auditHelper.log('accounts', 'delete', account_email);
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};
