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

import GroupManager from '../../managers/GroupManager';
import PermissionManager from '../../managers/PermissionManager';

export const adminAddGroupPermission = async (db, group_id, user, host, ssh_options, req) => {
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
    const permission_id = await pm.create(group_id, user, host, ssh_options);
    if (req && req.auditHelper) {
      req.auditHelper.log('groups', 'add_permission', group.name, { host, user, ssh_options });
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
      req.auditHelper.log('groups', 'remove_permission', group.name, { host, user });
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminUpdateGroupPermission = async (db, group_id, permission_id, ssh_options, req) => {
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
    const ret = await pm.updateSSHOptions(group_id, permission_id, ssh_options);
    if (ret === 0) {
      const error = new Error('Permission not found');
      error.t_code = 404;
      throw error;
    }
    const { host, user, ssh_options: ssh_options_old } = permission;
    if (req && req.auditHelper) {
      req.auditHelper.log('groups', 'update_permission', group.name, {
        host,
        user,
        ssh_options_old,
        ssh_options_new: ssh_options
      });
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};
