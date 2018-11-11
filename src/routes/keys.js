import { requireAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import { getAuthorizedKeys, getAuthorizedKeysAsJson } from '../lib/helpers/KeysHelper';

export default function handleKeys(server) {
  server.get('/authorized_keys/:host/:user', requireAuthMiddleware, async (req, res, next) => {
    const accept = req.header('Accept');
    const { host, user } = req.params;
    try {
      if (accept && accept.indexOf('application/json') >= 0) {
        const { keys, cache } = await getAuthorizedKeysAsJson(req.db, user, host);
        res.header('X-From-Cache', cache);
        res.json(keys);
      } else {
        const { keys, cache } = await getAuthorizedKeys(req.db, user, host);
        res.header('X-From-Cache', cache);
        res.header('Content-Type', 'text/plain');
        res.send(keys);
      }
    } catch (err) {
      if (process.env.MODE === 'test') {
        console.error('Failed authorized_keys', err);
      }
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });
}
