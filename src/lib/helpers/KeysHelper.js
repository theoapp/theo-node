import PermissionManager from '../managers/PermissionManager';

export const getAuthorizedKeys = async (db, user, host) => {
  const pm = new PermissionManager(db);
  try {
    const keys = await pm.match(user, host);
    return keys.map(key => key.public_key).join('\n');
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};
