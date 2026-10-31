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

import { loadCacheManager } from '../helpers/CacheHelper';
import { getLogger } from '@fluidware-it/saddlebag';

let _cm;

export const MAX_ROWS = 100;

export const SORT_VALUES = ['asc', 'desc'];

// order_by and sort come from the query string and are interpolated in sql: accept only known values
export const buildOrderBy = (order_by, sort, columns, defaultColumn) => {
  order_by = order_by || defaultColumn;
  sort = sort || 'asc';
  if (!columns.includes(order_by)) {
    const error = new Error('Invalid order_by, valid values are: ' + columns.join(', '));
    error.t_code = 400;
    throw error;
  }
  if (!SORT_VALUES.includes(sort)) {
    const error = new Error('Invalid sort, valid values are: ' + SORT_VALUES.join(', '));
    error.t_code = 400;
    throw error;
  }
  return `order by ${order_by} ${sort}`;
};

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
        getLogger().error({ error_message: err.message }, 'Failed to flush cache');
      });
    }
  }
}

export default BaseCacheManager;
