import GroupManager from '../../managers/GroupManager';
import EventHelper from '../EventHelper';

export const adminCreateGroup = async (db, group, onlyId = false) => {
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

export const adminEditGroup = async (db, group_id, active) => {
  const gm = new GroupManager(db);
  try {
    if (isNaN(group_id)) {
      group_id = await gm.getIdByName(group_id);
    }
    const ret = await gm.changeStatus(group_id, active);
    if (ret === 0) {
      const error = new Error('Group not found');
      error.t_code = 404;
      throw error;
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminDeleteGroup = async (db, group_id) => {
  const gm = new GroupManager(db);
  try {
    if (isNaN(group_id)) {
      group_id = await gm.getIdByName(group_id);
    }
    const ret = await gm.delete(group_id);
    console.log('Got: ', ret);
    if (ret === 0) {
      const error = new Error('Group not found');
      error.t_code = 404;
      throw error;
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};
