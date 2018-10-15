import PermissionManager from '../managers/PermissionManager';
import { loadCacheManager } from './CacheHelper';

let _cm;

export const getAuthorizedKeys = async function(db, user, host) {
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
  const pm = new PermissionManager(db);
  try {
    const keys = await pm.match(user, host);
    const skeys = keys.map(key => key.public_key).join('\n');
    if (_cm !== false) {
      await _cm.set(`${user}_${host}`, skeys);
    }
    return skeys;
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};
