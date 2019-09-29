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
import { common_error, common_info } from '../../utils/logUtils';

let redis;
try {
  redis = require('redis');
} catch (e) {
  // not loaded
}

class RedisManager extends CachedManager {
  constructor(settings) {
    super(settings.options);
    if (!redis) {
      throw new Error('module redis not installed!');
    }
    // parse options..
    const _options = {};
    if (settings.options) {
      const parts = settings.options.split(',');
      parts.forEach(part => {
        const keyval = part.split('=');
        _options[keyval[0]] = keyval[1];
      });
    }
    this.options = {
      url: settings.uri,
      password: _options.password
    };
    this.testConn()
      .then()
      .catch();
  }

  async testConn() {
    try {
      const conn = await this.open();
      common_info('Redis server: ', conn.server_info.redis_version);
      this.close(conn);
    } catch (e) {
      common_error('Failed to test redis connection', e);
    }
  }

  set(key, value) {
    return new Promise((resolve, reject) => {
      this.open()
        .then(redis => {
          redis.set(key, value, err => {
            this.close(redis);
            if (err) {
              return reject(err);
            }
            resolve(true);
          });
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  get(key) {
    return new Promise((resolve, reject) => {
      this.open()
        .then(redis => {
          redis.get(key, (err, data) => {
            this.close(redis);
            if (err) {
              return reject(err);
            }
            resolve(data);
          });
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  del(key) {
    return new Promise((resolve, reject) => {
      this.open()
        .then(redis => {
          redis.del(key, value, err => {
            this.close(redis);
            if (err) {
              return reject(err);
            }
            resolve(true);
          });
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  flush() {
    return new Promise((resolve, reject) => {
      this.open()
        .then(redis => {
          redis.flushdb(err => {
            this.close(redis);
            if (err) {
              return reject(err);
            }
            resolve(true);
          });
        })
        .catch(e => {
          reject(e);
        });
    });
  }

  close(conn) {
    try {
      conn.quit();
    } catch (e) {
      common_error(e.message);
    }
  }

  open() {
    return new Promise((resolve, reject) => {
      const conn = redis.createClient(this.options);
      conn.on('error', e => {
        reject(e);
      });
      conn.on('ready', () => {
        resolve(conn);
      });
    });
  }

  getClient() {
    return redis.createClient(this.options);
  }
}

export default RedisManager;
