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

import GroupManager from '../managers/GroupManager';
import AccountManager from '../managers/AccountManager';
import { MAX_ROWS } from '../managers/BaseCacheManager';
import PermissionManager from '../managers/PermissionManager';
import KeyManager from '../managers/KeyManager';
import GroupAccountManager from '../managers/GroupAccountManager';

const getAllGroups = async db => {
  const gm = new GroupManager(db);
  const gam = new GroupAccountManager(db);
  const pm = new PermissionManager(db);
  const total = await gm.getAllCount('where is_internal = ? ', [0]);
  const items = [];
  while (items.length < total) {
    const itemIds = await gm.getAll(MAX_ROWS, items.length, false, 'id', 'asc');
    for (let i = 0; i < itemIds.rows.length; i++) {
      const account = await gm.getFull(itemIds.rows[i].id, gam, pm);
      items.push(account);
    }
  }
  return items;
};

const getAllAccounts = async db => {
  const am = new AccountManager(db);
  const total = await am.getAllCount();
  const items = [];
  while (items.length < total) {
    const itemIds = await am.getAll(MAX_ROWS, items.length, false, 'id', 'asc');
    for (let i = 0; i < itemIds.rows.length; i++) {
      const account = await am.getFull(itemIds.rows[i].id);
      items.push(account);
    }
  }
  return items;
};

export const exp = async db => {
  const groups = await getAllGroups(db);
  const accounts = await getAllAccounts(db);
  return {
    accounts,
    groups
  };
};

export const imp = async (db, dump) => {
  const pm = new PermissionManager(db);
  const gm = new GroupManager(db);
  if (dump.groups) {
    for (let i = 0; i < dump.groups.length; i++) {
      const group = dump.groups[i];
      try {
        const id = await gm.create(group.name, group.active);
        for (let ii = 0; ii < group.permissions.length; ii++) {
          const permission = group.permissions[ii];
          await pm.create(id, permission.user, permission.host, permission.ssh_options);
        }
      } catch (e) {
        console.error('IMP: Failed to create group %s', group.name, e);
      }
    }
  }
  if (dump.accounts) {
    const am = new AccountManager(db);
    const km = new KeyManager(db, am);
    const gam = new GroupAccountManager(db);
    for (let i = 0; i < dump.accounts.length; i++) {
      const account = dump.accounts[i];
      try {
        const id = await am.create(account);
        for (let ii = 0; ii < account.public_keys.length; ii++) {
          const public_key = account.public_keys[ii];
          if (!public_key.fingerprint) {
            // TODO get fingerprint!
          }
          await km.create(id, public_key.public_key, public_key.fingerprint, public_key.public_key_sig);
        }
        const group_id = await gm.create(account.email);
        for (let ii = 0; ii < account.groups.length; ii++) {
          const group = account.groups[ii];
          const group_id = await gm.getIdByName(group.name);
          await gam.create(group_id, id);
        }
        for (let ii = 0; ii < account.permissions.length; ii++) {
          const permission = account.permissions[ii];
          if (permission.is_internal) {
            await pm.create(group_id, permission.user, permission.host, permission.ssh_options);
          }
        }
      } catch (e) {
        console.error('IMP: Failed to create account %s', account.email, e);
      }
    }
  }
};
