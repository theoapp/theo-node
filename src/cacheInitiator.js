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

import CacheHelper from './lib/helpers/CacheHelper';
import { common_error, common_info, common_warn } from './lib/utils/logUtils';
import RedisManager from './lib/cache/redis';
import { getAsyncLocalStorage } from './lib/utils/instanceUtils';

const redisSubscribe = async (cm, dm, ah) => {
  const conn = cm.getClient();
  const subscriber = conn.duplicate();
  subscriber
    .on('connect', () => console.log('connect', new Date().toJSON()))
    .on('ready', () => console.log('ready', new Date().toJSON()))
    .on('error', err => console.error('error', err, new Date().toJSON()));
  try {
    await subscriber.connect();
  } catch (e) {
    console.error('redis.connect thrown an error', e.message);
  }

  try {
    await subscriber.subscribe('core_tokens', async message => {
      if (message.startsWith('flush_tokens')) {
        common_warn('Flushing tokens!');
        let dbClient;
        try {
          dbClient = dm.getClient();
          await dbClient.open();
          const asyncLocalStorage = getAsyncLocalStorage();
          await asyncLocalStorage.run({}, () => {
            const store = asyncLocalStorage.getStore();
            store.instance = message.split(':')[1];
            common_warn(`Loading tokens for ${store.instance}`);
            return ah.loadAuthTokens(dbClient);
          });
        } catch (e) {
          common_error('Failed to reload tokens!!!', e.message);
        } finally {
          if (dbClient) {
            dbClient.close();
          }
        }
      }
    });
  } catch (e) {
    console.error('redis.subscribe thrown an error', e.message);
  }
};

const initCache = function (subscribe_core_token, dm, ah) {
  let ch;
  let cm;
  try {
    ch = CacheHelper(ah.getSettings('cache'));
  } catch (err) {
    common_error('Unable to create CacheHelper %s', err.message);
  }
  if (ch) {
    cm = ch.getManager();
    if (cm) {
      if (!subscribe_core_token) {
        common_info('Flushing CacheManager');
        cm.flush().catch(er => {
          common_error('Failed to initialize CacheManager: %s', er.message);
        });
      } else {
        if (cm instanceof RedisManager) {
          redisSubscribe(cm, dm, ah)
            .then(() => common_info('Subscribed RedisManager'))
            .catch(console.error);
        }
      }
    }
  }
  return cm;
};

export default initCache;
