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
      this.memcached.del(key, value, err => {
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
