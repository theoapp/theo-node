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
