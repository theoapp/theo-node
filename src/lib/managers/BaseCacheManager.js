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

import { loadCacheManager } from '../helpers/CacheHelper';

let _cm;

export const MAX_ROWS = 100;

class BaseCacheManager {
  constructor(db) {
    this.db = db;
  }

  invalidateCache() {
    if (_cm === undefined) {
      _cm = loadCacheManager();
    }
    if (_cm !== false) {
      _cm.flush().catch(err => {
        console.error('Failed to flush cache', err.message);
      });
    }
  }
}

export default BaseCacheManager;
