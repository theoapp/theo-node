// Copyright 2021 AuthKeys srl
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

const cache = {};

class InMemoryCacheManager extends CachedManager {
  constructor(settings) {
    super(settings.options);
  }

  set(key, value) {
    return new Promise(resolve => {
      cache[key] = value;
      resolve(true);
    });
  }

  get(key) {
    return new Promise(resolve => {
      resolve(cache[key]);
    });
  }

  del(key) {
    return new Promise(resolve => {
      if (key in cache) {
        delete cache[key];
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  flush() {
    return new Promise((resolve, reject) => {
      Object.keys(cache).forEach(k => {
        delete cache[k];
      });
      resolve(true);
    });
  }

  quit() {}
}

export default InMemoryCacheManager;
