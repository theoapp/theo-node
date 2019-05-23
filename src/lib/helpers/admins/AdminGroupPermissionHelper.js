import GroupManager from '../../managers/GroupManager';
import PermissionManager from '../../managers/PermissionManager';

export const adminAddGroupPermission = async (db, group_id, user, host, req) => {
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
  let group;
  try {
    if (isNaN(group_id)) {
      group = await gm.getByName(group_id);
      group_id = group.id;
    } else {
      group = await gm.get(group_id);
    }
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  const pm = new PermissionManager(db);
  try {
    const permission_id = await pm.create(group_id, user, host);
    if (req && req.auditHelper) {
      req.auditHelper.log('group', 'add_permission', group.name, { host, user });
    }
    return { group_id, permission_id };
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminDeleteGroupPermission = async (db, group_id, permission_id, req) => {
  const gm = new GroupManager(db);
  let group;
  try {
    if (isNaN(group_id)) {
      group = await gm.getByName(group_id);
      group_id = group.id;
    } else {
      group = await gm.get(group_id);
    }
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  const pm = new PermissionManager(db);
  try {
    const permission = await pm.get(group_id, permission_id);
    if (!permission) {
      const error = new Error('Permission not found');
      error.t_code = 404;
      throw error;
    }
    const ret = await pm.delete(group_id, permission_id);
    if (ret === 0) {
      const error = new Error('Permission not found');
      error.t_code = 404;
      throw error;
    }
    const { host, user } = permission;
    if (req && req.auditHelper) {
      req.auditHelper.log('group', 'remove_permission', group.name, { host, user });
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};
