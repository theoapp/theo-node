import CacheHelper from './lib/helpers/CacheHelper';
import { common_error, common_info } from './lib/utils/logUtils';

const redisSubscribe = async (cm, dm, ah) => {
  const client = await cm.open();
  client.on('message', async (channel, message) => {
    if (message === 'flush_tokens') {
      common_info('Flushing tokens!');
      const dbClient = dm.getClient();
      await dbClient.open();
      await ah.loadAuthTokens(dbClient);
    }
  });
  client.subscribe('core_tokens');
};

const initCache = function(subscribe_core_token, dm, ah) {
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
        redisSubscribe(cm, dm, ah).finally();
      }
    }
  }
  return cm;
};

export default initCache;
