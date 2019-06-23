import { requireAdminAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import { exp, imp } from '../lib/helpers/ImpExpHelper';

export default function handleImpExp(express) {
  const router = express.Router();
  router.get('/', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const dump = await exp(req.db);
      res.json(dump);
    } catch (err) {
      if (process.env.MODE === 'test') {
        console.error('Failed to export', err);
      }
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.post('/', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      await imp(req.db, req.body);
      res.json(204);
    } catch (err) {
      console.log('Import failed ', err);
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });
  return router;
}
