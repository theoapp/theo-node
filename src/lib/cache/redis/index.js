import redis from 'redis';
import CachedManager from '../../managers/CacheManager';

class RedisManager extends CachedManager {
  constructor(settings) {
    super(settings);
    const options = {
      url: settings.uri,
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
    this.redis = redis.createClient(options);
    console.log('RedisManager started');
    this.redis.on('error', () => {});
  }
  set(key, value) {
    return new Promise((resolve, reject) => {
      this.redis.set(key, value, err => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  }
  get(key) {
    return new Promise((resolve, reject) => {
      this.redis.get(key, (err, data) => {
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
    });
  }
  del(key) {
    return new Promise((resolve, reject) => {
      this.redis.del(key, value, err => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  }
  flush() {
    console.log('Flushing Redis');
    return new Promise((resolve, reject) => {
      try {
        this.redis.flushdb(err => {
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
  close() {
    try {
      this.redis.close();
    } catch (e) {}
  }
}

export default RedisManager;
