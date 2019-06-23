import { requireAdminAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import AccountManager from '../lib/managers/AccountManager';
import {
  adminAddAccountKeys,
  adminAddAccountKeyFromService,
  adminAddAccountPermission,
  adminCreateAccount,
  adminDeleteAccount,
  adminDeleteAccountKey,
  adminDeleteAccountPermission,
  adminEditAccount,
  adminGetAccount
} from '../lib/helpers/AdminHelper';

export default function handleAccounts(express) {
  const router = express.Router();
  router.get('/', requireAdminAuthMiddleware, async (req, res, next) => {
    const am = new AccountManager(req.db);
    try {
      const { search, limit, offset, order_by, sort } = req.query;
      let ret;
      if (search) {
        ret = await am.search(search, search, Number(limit), Number(offset), order_by, sort);
      } else {
        ret = await am.getAll(Number(limit), Number(offset), false, order_by, sort);
      }
      res.json(ret);
    } catch (err) {
      console.error('GET /accounts', err);
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });

  router.post('/', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const ret = await adminCreateAccount(req.db, req.body, req);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.get('/search', requireAdminAuthMiddleware, async (req, res, next) => {
    const am = new AccountManager(req.db);
    try {
      const { search, limit, offset } = req.query;
      let { name, email } = req.query;
      if (search) {
        if (!name) {
          name = search;
        }
        if (!email) {
          email = search;
        }
      }
      const accounts = await am.search(name, email, Number(limit), Number(offset));
      res.json(accounts);
    } catch (err) {
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });

  router.get('/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const account = await adminGetAccount(req.db, req.params.id);
      res.json(account);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.put('/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    const { active, expire_at } = req.body;
    try {
      const done = await adminEditAccount(req.db, req.params.id, active, expire_at, req);
      if (done) {
        res.status(201);
        res.json({ status: 201 });
      } else {
        res.status(500);
        res.json({ status: 500, reason: 'Unkown error' });
      }
    } catch (err) {
      console.error(err);
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.delete('/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminDeleteAccount(req.db, req.params.id, req);
      if (done) {
        res.status(201);
        res.json({ status: 201 });
      } else {
        res.status(500);
        res.json({ status: 500, reason: 'Unkown error' });
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.post('/:id/keys', requireAdminAuthMiddleware, async (req, res) => {
    try {
      const ret = await adminAddAccountKeys(req.db, req.params.id, req.body.keys, req);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.delete('/:id/keys/:key_id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminDeleteAccountKey(req.db, req.params.id, Number(req.params.key_id), req);
      if (done) {
        res.status(201);
        res.json({ status: 201 });
      } else {
        res.status(500);
        res.json({ status: 500, reason: 'Unkown error' });
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.post('/:id/keys/import/:service', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const ret = await adminAddAccountKeyFromService(req.db, req.params.id, req.params.service, req.body.username);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.post('/:id/permissions', requireAdminAuthMiddleware, async (req, res, next) => {
    const { user, host } = req.body;
    try {
      const ret = await adminAddAccountPermission(req.db, req.params.id, user, host, req);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.delete('/:id/permissions/:permission_id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminDeleteAccountPermission(req.db, req.params.id, Number(req.params.permission_id), req);
      if (done) {
        res.status(201);
        res.json({ status: 201 });
      } else {
        res.status(500);
        res.json({ status: 500, reason: 'Unkown error' });
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });
  return router;
}
