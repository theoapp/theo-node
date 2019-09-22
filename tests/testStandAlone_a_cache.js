import assert from 'assert';
import RedisManager from '../src/lib/cache/redis';
import MemcachedManager from '../src/lib/cache/memcached';
import { getCacheModule } from '../src/lib/cache/modules';

describe('Testing cache', () => {
  describe('Testing getCacheModule', () => {
    it('Should return the RedisManager class ', () => {
      const clazz = getCacheModule('redis');
      assert(clazz === RedisManager);
    });

    it('Should return the Memcached class ', () => {
      const clazz = getCacheModule('memcached');
      assert(clazz === MemcachedManager);
    });
  });
});
