import { requireAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import PermissionManager from '../lib/managers/PermissionManager';

export default function handleKeys(server) {
  server.get('/authorized_keys/:host/:user', requireAuthMiddleware, async (req, res, next) => {
    const { host, user } = req.params;
    const pm = new PermissionManager(req.db);
    try {
      const keys = await pm.match(user, host);
      res.header('Content-Type', 'text/plain');
      let ret = '';
      keys.forEach(key => {
        ret += key.public_key + '\n';
      });
      res.send(ret);
    } catch (err) {
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });
}
