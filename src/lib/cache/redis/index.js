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
      let parts = settings.options.split(',');
      parts.forEach(part => {
        let keyval = part.split('=');
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
    return new Promise(async (resolve, reject) => {
      let redis;
      try {
        redis = await this.open();
      } catch (e) {
        reject(e);
        return;
      }
      redis.set(key, value, err => {
        this.close(redis);
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  }
  get(key) {
    return new Promise(async (resolve, reject) => {
      let redis;
      try {
        redis = await this.open();
      } catch (e) {
        reject(e);
        return;
      }
      redis.get(key, (err, data) => {
        this.close(redis);
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
    });
  }
  del(key) {
    return new Promise(async (resolve, reject) => {
      let redis;
      try {
        redis = await this.open();
      } catch (e) {
        reject(e);
        return;
      }
      redis.del(key, value, err => {
        this.close(redis);
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  }
  flush() {
    return new Promise(async (resolve, reject) => {
      let redis;
      try {
        redis = await this.open();
      } catch (e) {
        reject(e);
        return;
      }
      try {
        redis.flushdb(err => {
          this.close(redis);
          if (err) {
            return reject(err);
          }
          resolve(true);
        });
      } catch (err) {
        common_error('this.redis.flushdb failed', err);
      }
    });
  }
  close(conn) {
    try {
      conn.quit();
    } catch (e) {
      console.error(e.message);
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
