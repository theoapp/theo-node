import GroupManager from '../managers/GroupManager';
import AccountManager from '../managers/AccountManager';
import { MAX_ROWS } from '../managers/BaseCacheManager';
import PermissionManager from '../managers/PermissionManager';
import KeyManager from '../managers/KeyManager';
import GroupAccountManager from '../managers/GroupAccountManager';

const getAll = async manager => {
  const total = await manager.getAllCount();
  const items = [];
  while (items.length < total) {
    const itemIds = await manager.getAll(MAX_ROWS, items.length, true);
    for (let i = 0; i < itemIds.rows.length; i++) {
      const account = await manager.getFull(itemIds.rows[i].id);
      items.push(account);
    }
  }
  return items;
};

export const exp = async db => {
  return {
    groups: await getAll(new GroupManager(db)),
    accounts: await getAll(new AccountManager(db))
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
          await pm.create(id, permission.user, permission.host);
        }
      } catch (e) {
        console.error('IMP: Failed to create group %s', group.name, e);
      }
    }
  }
  if (dump.accounts) {
    const am = new AccountManager(db);
    const km = new KeyManager(db);
    const gam = new GroupAccountManager(db);
    for (let i = 0; i < dump.accounts.length; i++) {
      const account = dump.accounts[i];
      try {
        const id = await am.create(account);
        for (let ii = 0; ii < account.public_keys.length; ii++) {
          const public_key = account.public_keys[ii];
          await km.create(id, public_key.public_key, public_key.public_key_sig);
        }
        for (let ii = 0; ii < account.groups.length; ii++) {
          const group = account.groups[ii];
          const group_id = await gm.getIdByName(group.name);
          await gam.create(group_id, id);
        }
      } catch (e) {
        console.error('IMP: Failed to create account %s', account.email, e);
      }
    }
  }
};
