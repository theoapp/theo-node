import { requireAdminAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import { getAuthorizedKeysAsFullJson } from '../lib/helpers/KeysHelper';

export default function handlePermissions(server) {
  server.get('/permissions/:host/:user', requireAdminAuthMiddleware, async (req, res, next) => {
    const { host, user } = req.params;
    try {
      const keys = await getAuthorizedKeysAsFullJson(req.db, user, host);
      res.json(keys);
    } catch (err) {
      if (process.env.MODE === 'test') {
        console.error('Failed search permissions', err);
      }
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });
}
