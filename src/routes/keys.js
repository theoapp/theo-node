import { requireAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import { getAuthorizedKeys } from '../lib/helpers/KeysHelper';

export default function handleKeys(server) {
  server.get('/authorized_keys/:host/:user', requireAuthMiddleware, async (req, res, next) => {
    const { host, user } = req.params;
    try {
      const keys = await getAuthorizedKeys(req.db, user, host);
      res.header('Content-Type', 'text/plain');
      res.send(keys);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });
}
