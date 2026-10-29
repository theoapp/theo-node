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

import { getCacheModule } from '../cache/modules';
import EventHelper from './EventHelper';
import { getInstance as getCurrentInstance } from '../utils/instanceUtils';
import { getLogger } from '@fluidware-it/saddlebag';
let _instance;

class CacheHelper {
  constructor(settings) {
    if (!settings) {
      return;
    }
    if (settings.type && settings.type !== 'false') {
      const ManagerClass = getCacheModule(settings.type);
      if (!ManagerClass) {
        throw new Error('Invalid cache module ' + settings.type);
      }
      this.manager = new ManagerClass(settings.settings);
    }
    EventHelper.on('theo:flushdb', () => {
      setImmediate(() => {
        if (this.manager) {
          this.manager.flush().catch(e => getLogger().error(e, 'Failed to flush cache'));
        }
      });
    });
  }

  getManager() {
    return this.manager;
  }
}

const getInstance = settings => {
  if (!_instance) {
    _instance = new CacheHelper(settings);
  }
  return _instance;
};

export const loadCacheManager = function () {
  const ch = getInstance();
  const cm = ch.getManager();
  if (!cm) {
    return false;
  }
  return cm;
};

export const notifyReloadTokens = function () {
  setImmediate(async () => {
    const cm = loadCacheManager();
    try {
      const client = await cm.open();
      const instance = getCurrentInstance();
      await client.publish('core_tokens', 'flush_tokens:' + instance);
    } catch (e) {
      getLogger().error(e, 'Error while flushing cache tokens');
    }
  });
};

export default getInstance;
