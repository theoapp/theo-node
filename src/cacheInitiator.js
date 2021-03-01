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

const MAX_RETRY_TIMEOUT = 5000;
let retriesCount = 0;

const redisSubscribe = (cm, dm, ah) => {
  const conn = cm.getClient();
  conn.on('error', e => {
    retriesCount++;
    const nextRetry = Math.min(retriesCount * retriesCount * 50, MAX_RETRY_TIMEOUT);
    common_error('%s. Retrying in %d ms', e.message, nextRetry);
    // Close connection and try again...
    cm.close(conn);
    setTimeout(function () {
      redisSubscribe(cm, dm, ah);
    }, nextRetry);
  });

  conn.on('ready', () => {
    common_info('Connected to redis attempt #', retriesCount);
    conn.subscribe('core_tokens');
    retriesCount = 0;
  });

  conn.on('message', async (channel, message) => {
    if (channel === 'core_tokens' && message === 'flush_tokens') {
      common_warn('Flushing tokens!');
      let dbClient;
      try {
        dbClient = dm.getClient();
        await dbClient.open();
        await ah.loadAuthTokens(dbClient);
      } catch (e) {
        common_error('Failed to reload tokens!!!', e.message);
      } finally {
        if (dbClient) {
          dbClient.close();
        }
      }
    }
  });
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
          redisSubscribe(cm, dm, ah);
        }
      }
    }
  }
  return cm;
};

export default initCache;
