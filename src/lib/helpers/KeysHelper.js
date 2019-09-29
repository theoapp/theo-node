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

export const getAuthorizedKeys = async (dm, user, host) => {
  const cache_key = `${user}_${host}`;
  const _cache = await checkCache(cache_key);
  if (_cache) return { keys: _cache, cache: true };
  const { keys, cache } = await getAuthorizedKeysAsJson(dm, user, host, true);
  const skeys = keys
    .filter(key => {
      return key !== undefined;
    })
    .map(key => key.public_key)
    .join('\n');
  if (_cm !== false) {
    _cm.set(cache_key, skeys).catch(err => console.error('Failed to save cache for %s', cache_key, err));
  }
  return { keys: skeys, cache };
};

export const getAuthorizedKeysAsJson = async (dm, user, host, skip_cache = false) => {
  const cache_key = `json:${user}_${host}`;
  const cache = await checkCache(cache_key);
  if (!skip_cache) {
    if (cache) {
      return { keys: JSON.parse(cache), cache: true };
    }
  }
  const db = dm.getClient('ro');
  await db.open();
  const pm = new PermissionManager(db);
  let keys;
  try {
    keys = await pm.match(user, host);
  } catch (err) {
    err.t_code = 500;
    throw err;
  } finally {
    db.close();
  }
  if (!skip_cache) {
    if (_cm !== false) {
      setImmediate(() => {
        _cm
          .set(cache_key, JSON.stringify(keys))
          .catch(err => console.error('Failed to save cache for %s', cache_key, err));
      });
    }
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
