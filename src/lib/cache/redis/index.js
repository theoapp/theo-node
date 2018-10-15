import redis from 'redis';
import CachedManager from '../../managers/CacheManager';

class RedisManager extends CachedManager {
  constructor(settings) {
    super(settings);
    const options = {
      url: settings.uri
    };
    this.redis = redis.createClient(options);
    console.log('RedisManager started');
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
    return new Promise((resolve, reject) => {
      this.redis.flushdb(err => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
    });
  }
}
export default RedisManager;
