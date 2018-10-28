import { requireAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import { getAuthorizedKeys, getAuthorizedKeysAsJson } from '../lib/helpers/KeysHelper';

export default function handleKeys(server) {
  server.get('/authorized_keys/:host/:user', requireAuthMiddleware, async (req, res, next) => {
    const accept = req.header('Accept');
    const { host, user } = req.params;
    try {
      if (accept && accept.indexOf('application/json') >= 0) {
        const keys = await getAuthorizedKeysAsJson(req.db, user, host);
        res.json(keys);
      } else {
        const keys = await getAuthorizedKeys(req.db, user, host);
        res.header('Content-Type', 'text/plain');
        res.send(keys);
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });
}
