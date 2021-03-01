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

import CachedManager from '../../managers/CacheManager';

const MAX_EXPIRATION = 2592000;

class MemcachedManager extends CachedManager {
  constructor(settings) {
    super(settings);
    const options = {
      failures: 1,
      timeout: 1000,
      retries: 1,
      retry: 1000
    };
    try {
      const Memcached = require('memcached');
      this.memcached = new Memcached(settings.uri, options);
      console.log('MemcachedManager started');
    } catch (e) {
      // Module not loaded
    }
  }

  set(key, value) {
    return new Promise((resolve, reject) => {
      this.memcached.set(key, value, MAX_EXPIRATION, err => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  }

  get(key) {
    return new Promise((resolve, reject) => {
      this.memcached.get(key, (err, data) => {
        if (err) {
          return reject(err);
        }
        if (data === undefined) {
          data = null;
        }
        resolve(data);
      });
    });
  }

  del(key) {
    return new Promise((resolve, reject) => {
      this.memcached.delete(key, err => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  }

  flush() {
    return new Promise((resolve, reject) => {
      this.memcached.flush(err => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  }

  quit() {
    try {
      this.memcached.end();
    } catch (e) {}
  }
}

export default MemcachedManager;
