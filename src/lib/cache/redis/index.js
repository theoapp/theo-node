// Copyright 2019 AuthKeys srl
// Copyright 2023 Fluidware srl
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
import { getInstance } from '../../utils/instanceUtils';
import { REDIS_CONNECTION_RETRY_INTERVAL, REDIS_MAX_CONNECTION_RETRIES } from '../../../const';

const MAX_RETRIES = Number(REDIS_MAX_CONNECTION_RETRIES) || 10;
const MAX_RETRY_TIMEOUT = Number(REDIS_CONNECTION_RETRY_INTERVAL) * 1000 || 5000;

let redisConn;
let createClient;

try {
  createClient = require('redis').createClient;
} catch (e) {
  // not loaded
}

class RedisManager extends CachedManager {
  constructor(settings) {
    super(settings.options);
    if (!createClient) {
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
      password: _options.password,
      socket: {
        reconnectStrategy(retriesCount) {
          if (retriesCount > MAX_RETRIES) {
            process.exit(1);
          }
          return Math.min(retriesCount * 250, MAX_RETRY_TIMEOUT);
        }
      }
    };
    this.testConn()
      .then()
      .catch(e => {
        process.exit(1);
      });
  }

  async testConn() {
    try {
      await this.open();
      common_info('Redis server OK ');
      this.close();
    } catch (e) {
      common_error('Failed to test redis connection', e);
    }
  }

  async set(key, value) {
    const conn = await this.open();
    const instance = getInstance();
    return conn.hSet(instance, key, value);
  }

  async get(key) {
    const conn = await this.open();
    const instance = getInstance();
    return conn.hGet(instance, key);
  }

  async del(key) {
    const conn = await this.open();
    const instance = getInstance();
    return conn.hDel(instance, key);
  }

  async flush() {
    const conn = await this.open();
    const instance = getInstance();
    return conn.del(instance);
  }

  close(conn) {
    try {
      if (conn) {
        conn.quit();
      } else {
        redisConn.quit();
        redisConn = undefined;
      }
    } catch (e) {
      common_error(e.message);
    }
  }

  async open() {
    if (!redisConn) {
      redisConn = createClient(this.options);
      redisConn.on('error', e => {
        console.log('Redis Client Error', e);
      });
      await redisConn.connect();
    }
    return redisConn;
  }

  getClient() {
    return createClient(this.options);
  }
}

export default RedisManager;
