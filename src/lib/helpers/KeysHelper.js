import PermissionManager from '../managers/PermissionManager';
import { loadCacheManager } from './CacheHelper';

let _cm;

export const getAuthorizedKeys = async (db, user, host) => {
  if (_cm === undefined) {
    _cm = loadCacheManager();
  }
  if (_cm !== false) {
    try {
      const keys = await _cm.get(`${user}_${host}`);
      if (keys !== null) {
        return keys;
      }
    } catch (err) {
      console.error('Failed to fetch from cache, using db', err.message);
    }
  }
  const keys = await getAuthorizedKeysAsJson(db, user, host);
  const skeys = keys
    .filter(key => {
      return key !== undefined;
    })
    .map(key => key.public_key)
    .join('\n');
  if (_cm !== false) {
    await _cm.set(`${user}_${host}`, skeys);
  }
  return skeys;
};

export const getAuthorizedKeysAsJson = async (db, user, host) => {
  const pm = new PermissionManager(db);
  try {
    return pm.match(user, host);
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};
