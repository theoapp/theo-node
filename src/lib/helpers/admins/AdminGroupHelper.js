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
import EventHelper from '../EventHelper';

export const adminCreateGroup = async (db, group, req, onlyId = false) => {
  if (!group.name) {
    const error = new Error('Malformed object, name is required');
    error.t_code = 400;
    throw error;
  }
  const gm = new GroupManager(db);
  const check = await gm.checkName(group.name);
  if (check) {
    const error = new Error('Group already exists');
    error.t_code = 409;
    throw error;
  }
  try {
    const id = await gm.create(group.name);
    EventHelper.emit('theo:change', {
      func: 'group',
      action: 'add',
      object: id,
      receiver: 'admin'
    });
    if (req && req.auditHelper) {
      if (group.name.indexOf('@') < 0) {
        req.auditHelper.log('groups', 'create', group.name);
      }
    }
    if (onlyId) return id;
    return gm.getFull(id);
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};

export const adminGetGroup = async (db, id) => {
  const gm = new GroupManager(db);
  try {
    if (isNaN(id)) {
      id = await gm.getIdByName(id);
    }
    return gm.getFull(id);
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminEditGroup = async (db, group_id, active, req) => {
  const gm = new GroupManager(db);
  let group;
  try {
    if (isNaN(group_id)) {
      group = await gm.getByName(group_id);
      group_id = group.id;
    } else {
      group = await gm.get(group_id);
    }
    if (!group) {
      const error = new Error('Group not found');
      error.t_code = 404;
      throw error;
    }
    if (!!group.active === active) {
      return false;
    }
    await gm.changeStatus(group_id, active);
    if (req && req.auditHelper) {
      req.auditHelper.log('groups', 'edit', group.name, {
        active: { prev: group.active ? 'true' : 'false', next: active ? 'true' : 'false' }
      });
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminDeleteGroup = async (db, group_id, req) => {
  const gm = new GroupManager(db);
  let group;
  try {
    if (isNaN(group_id)) {
      group = await gm.getByName(group_id);
      group_id = group.id;
    } else {
      group = await gm.get(group_id);
    }
    if (!group) {
      const error = new Error('Group not found');
      error.t_code = 404;
      throw error;
    }
    await gm.delete(group_id);
    if (req && req.auditHelper) {
      req.auditHelper.log('groups', 'delete', group.name);
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};
