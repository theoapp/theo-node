import redis from 'redis';
import CachedManager from '../../managers/CacheManager';

class RedisManager extends CachedManager {
  constructor(settings) {
    super(settings);
    this.options = {
      url: settings.uri,
      password: settings.password,
      retry_strategy: function(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          // End reconnecting on a specific error and flush all commands with
          // a individual error
          return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          // End reconnecting after a specific timeout and flush all commands
          // with a individual error
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          // End reconnecting with built in error
          return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
      }
    };
    this.testConn()
      .then()
      .catch();
  }
  async testConn() {
    try {
      const conn = await this.open();
      console.log('Redis server: ', conn.server_info.redis_version);
      this.close(conn);
    } catch (e) {
      console.error('Failed to test redis connection', e);
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
        console.error('this.redis.flushdb failed', err);
      }
    });
  }
  close(conn) {
    try {
      conn.close();
    } catch (e) {}
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
}

export default RedisManager;
