import PermissionManager from '../managers/PermissionManager';
import { loadCacheManager } from './CacheHelper';

let _cm;

const checkCache = async key => {
  if (_cm === undefined) {
    _cm = loadCacheManager();
  }
  if (_cm !== false) {
    try {
      const keys = await _cm.get(key);
      if (keys !== null) {
        return keys;
      }
    } catch (err) {
      console.error('Failed to fetch from cache, using db', err.message);
    }
  }
  return false;
};

export const getAuthorizedKeys = async (db, user, host) => {
  const cache_key = `${user}_${host}`;
  const _cache = await checkCache(cache_key);
  if (_cache) return { keys: _cache, cache: true };
  const { keys, cache } = await getAuthorizedKeysAsJson(db, user, host);
  const skeys = keys
    .filter(key => {
      return key !== undefined;
    })
    .map(key => key.public_key)
    .join('\n');
  if (_cm !== false) {
    _cm
      .set(cache_key, skeys)
      .then()
      .catch();
  }
  return { keys: skeys, cache };
};

export const getAuthorizedKeysAsJson = async (db, user, host) => {
  const cache_key = `json:${user}_${host}`;
  const cache = await checkCache(cache_key);
  if (cache) {
    return { keys: JSON.parse(cache), cache: true };
  }
  const pm = new PermissionManager(db);
  let keys;
  try {
    keys = await pm.match(user, host);
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
  if (_cm !== false) {
    _cm
      .set(cache_key, JSON.stringify(keys))
      .then()
      .catch(err => console.error('Failed to save cache for %s', cache_key, err));
  }
  return { keys, cache: false };
};

export const getAuthorizedKeysAsFullJson = async (db, user, host) => {
  const pm = new PermissionManager(db);
  let keys;
  try {
    keys = await pm.search(user, host);
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
  return keys;
};
