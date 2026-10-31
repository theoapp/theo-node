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

import CacheHelper from './lib/helpers/CacheHelper';
import RedisManager from './lib/cache/redis';
import { getAsyncLocalStorage } from './lib/utils/instanceUtils';
import { getLogger } from '@fluidware-it/saddlebag';

const redisSubscribe = async (cm, dm, ah) => {
  const conn = cm.getClient();
  const subscriber = conn.duplicate();
  subscriber
    .on('connect', () => getLogger().info('redis subscriber connect'))
    .on('ready', () => getLogger().info('redis subscriber ready'))
    .on('error', err => getLogger().error(err, 'redis subscriber error'));
  try {
    await subscriber.connect();
  } catch (e) {
    getLogger().error({ error_message: e.message }, 'redis.connect thrown an error');
  }

  try {
    await subscriber.subscribe('core_tokens', async message => {
      if (message.startsWith('flush_tokens')) {
        getLogger().warn('Flushing tokens!');
        let dbClient;
        try {
          dbClient = dm.getClient();
          await dbClient.open();
          const asyncLocalStorage = getAsyncLocalStorage();
          await asyncLocalStorage.run({}, () => {
            const store = asyncLocalStorage.getStore();
            store.instance = message.split(':')[1];
            getLogger().warn(`Loading tokens for ${store.instance}`);
            return ah.loadAuthTokens(dbClient);
          });
        } catch (e) {
          getLogger().error({ error_message: e.message }, 'Failed to reload tokens!!!');
        } finally {
          if (dbClient) {
            dbClient.close();
          }
        }
      }
    });
  } catch (e) {
    getLogger().error({ error_message: e.message }, 'redis.subscribe thrown an error');
  }
};

const initCache = function (subscribe_core_token, dm, ah) {
  let ch;
  let cm;
  try {
    ch = CacheHelper(ah.getSettings('cache'));
  } catch (err) {
    getLogger().error('Unable to create CacheHelper %s', err.message);
  }
  if (ch) {
    cm = ch.getManager();
    if (cm) {
      if (!subscribe_core_token) {
        getLogger().info('Flushing CacheManager');
        cm.flush().catch(er => {
          getLogger().error('Failed to initialize CacheManager: %s', er.message);
        });
      } else {
        if (cm instanceof RedisManager) {
          redisSubscribe(cm, dm, ah)
            .then(() => getLogger().info('Subscribed RedisManager'))
            .catch(e => getLogger().error(e, 'Failed to subscribe RedisManager'));
        }
      }
    }
  }
  return cm;
};

export default initCache;
