import { requireAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import { getAuthorizedKeys, getAuthorizedKeysAsJson } from '../lib/helpers/KeysHelper';
import { dnsReverse } from '../lib/utils/dnsUtils';
import AppHelper from '../lib/helpers/AppHelper';
import RemoteLoggerHelper from '../lib/helpers/RemoteLoggerHelper';
import { common_debug } from '../lib/utils/logUtils';

const checkFingerPrint = async function(user, host, fingerprint, keys) {
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].fingerprint === fingerprint) {
      const data = {
        user,
        host,
        email: keys[i].email,
        ts: new Date().getTime()
      };
      RemoteLoggerHelper.log(data);
      return;
    }
  }
  common_debug('No public key found for %s on %s with %s fingerprint', user, host, fingerprint);
};

const checkUserHost = async function(db, accept, user, host, res, fingerprint) {
  if (accept && accept.indexOf('application/json') >= 0) {
    const { keys, cache } = await getAuthorizedKeysAsJson(db, user, host);
    res.header('X-From-Cache', cache);
    res.json(keys);
    if (fingerprint) {
      checkFingerPrint(user, host, fingerprint, keys).finally();
    }
  } else {
    const ah = AppHelper();
    const settingsKeys = ah.getSettings('keys');
    if (settingsKeys && settingsKeys.sign) {
      const err = new Error('Not Acceptable when FORCE_SIGNED_KEY is true');
      err.t_code = 406;
      throw err;
    }
    const { keys, cache } = await getAuthorizedKeys(db, user, host);
    res.header('X-From-Cache', cache);
    res.header('Content-Type', 'text/plain');
    res.send(keys);
  }
};

export default function handleKeys(express) {
  const router = express.Router();
  router.get('/:host/:user', requireAuthMiddleware, async (req, res, next) => {
    const accept = req.header('Accept');
    const { host, user } = req.params;
    const { f } = req.query;
    try {
      await checkUserHost(req.db, accept, user, host, res, f);
    } catch (err) {
      if (process.env.MODE === 'test') {
        console.error('Failed authorized_keys', err);
      }
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.get('/:user', requireAuthMiddleware, async (req, res, next) => {
    const accept = req.header('Accept');
    const { user } = req.params;
    const { f } = req.query;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    try {
      const host = await dnsReverse(ip);
      if (host && host.length > 0) {
        try {
          await checkUserHost(req.db, accept, user, host[0], res, f);
        } catch (err) {
          if (process.env.MODE === 'test') {
            console.error('Failed authorized_keys', err);
          }
          res.status(err.t_code || 500);
          res.json({ status: err.t_code || 500, reason: err.message });
        }
      } else {
        res.status(400);
        res.json({ status: 400, reason: 'Unable to get hostname for ' + ip });
      }
    } catch (err) {
      if (process.env.MODE === 'test') {
        console.error('Failed reverse %s', ip, err);
      }
      res.status(400);
      res.json({ status: 400, reason: 'Unable to get hostname for ' + ip });
    }
  });
  return router;
}
