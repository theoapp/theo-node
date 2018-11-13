import { requireAdminAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import AccountManager from '../lib/managers/AccountManager';
import {
  adminAddAccountKey,
  adminAddAccountKeyFromService,
  adminAddAccountPermission,
  adminCreateAccount,
  adminDeleteAccount,
  adminDeleteAccountKey,
  adminDeleteAccountPermission,
  adminEditAccount,
  adminGetAccount
} from '../lib/helpers/AdminHelper';

export default function handleAccounts(server) {
  server.get('/accounts', requireAdminAuthMiddleware, async (req, res, next) => {
    const am = new AccountManager(req.db);
    try {
      const { limit, offset } = req.query;
      const ret = await am.getAll(Number(limit), Number(offset));
      res.json(ret);
    } catch (err) {
      console.error('GET /accounts', err);
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });

  server.get('/accounts/search', requireAdminAuthMiddleware, async (req, res, next) => {
    const am = new AccountManager(req.db);
    try {
      const { name, email, limit, offset } = req.query;
      const accounts = await am.search(name, email, Number(limit), Number(offset));
      res.json(accounts);
    } catch (err) {
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });

  server.post('/accounts', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const ret = await adminCreateAccount(req.db, req.body);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.get('/accounts/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const account = await adminGetAccount(req.db, req.params.id);
      res.json(account);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.put('/accounts/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    const { active, expire_at } = req.body;
    console.log('Mod: ', active, expire_at);
    try {
      const done = await adminEditAccount(req.db, req.params.id, active, expire_at);
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

  server.del('/accounts/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminDeleteAccount(req.db, req.params.id);
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

  server.post('/accounts/:id/keys', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const ret = await adminAddAccountKey(req.db, req.params.id, req.body.keys);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.post('/accounts/:id/keys/import/:service', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const ret = await adminAddAccountKeyFromService(req.db, req.params.id, req.params.service, req.body.username);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.del('/accounts/:id/keys/:key_id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminDeleteAccountKey(req.db, req.params.id, Number(req.params.key_id));
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

  server.post('/accounts/:id/permissions', requireAdminAuthMiddleware, async (req, res, next) => {
    const { user, host } = req.body;
    try {
      const ret = await adminAddAccountPermission(req.db, req.params.id, user, host);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.del('/accounts/:id/permissions/:permission_id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminDeleteAccountPermission(req.db, req.params.id, Number(req.params.permission_id));
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
}
