import { requireAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import { getAuthorizedKeys, getAuthorizedKeysAsJson } from '../lib/helpers/KeysHelper';
import { dnsReverse } from '../lib/utils/dnsUtils';
import AppHelper from '../lib/helpers/AppHelper';

const checkUserHost = async function(db, accept, user, host, res) {
  if (accept && accept.indexOf('application/json') >= 0) {
    const { keys, cache } = await getAuthorizedKeysAsJson(db, user, host);
    res.header('X-From-Cache', cache);
    res.json(keys);
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

export default function handleKeys(server) {
  server.get('/authorized_keys/:host/:user', requireAuthMiddleware, async (req, res, next) => {
    const accept = req.header('Accept');
    const { host, user } = req.params;
    try {
      await checkUserHost(req.db, accept, user, host, res);
    } catch (err) {
      if (process.env.MODE === 'test') {
        console.error('Failed authorized_keys', err);
      }
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.get('/authorized_keys/:user', requireAuthMiddleware, async (req, res, next) => {
    const accept = req.header('Accept');
    const { user } = req.params;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    try {
      const host = await dnsReverse(ip);
      if (host && host.length > 0) {
        try {
          await checkUserHost(req.db, accept, user, host[0], res);
        } catch (err) {
          if (process.env.MODE === 'test') {
            console.error('Failed authorized_keys', err);
          }
          res.status(err.t_code || 500);
          res.json({ status: err.t_code || 500, reason: err.message });
          return;
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
}
