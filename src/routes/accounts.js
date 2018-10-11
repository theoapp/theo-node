import { requireAdminAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import AccountManager from '../lib/managers/AccountManager';
import KeyManager from '../lib/managers/KeyManager';
import PermissionManager from '../lib/managers/PermissionManager';

export default function handleAccounts(server) {
  server.get('/accounts', requireAdminAuthMiddleware, async (req, res, next) => {
    const am = new AccountManager(req.db);
    try {
      const accounts = await am.getAll();
      res.json(accounts);
    } catch (err) {
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });

  server.post('/accounts', requireAdminAuthMiddleware, async (req, res, next) => {
    const am = new AccountManager(req.db);
    const account = req.body;
    if (!account.email) {
      res.status(400);
      res.json({ status: 400, reason: 'Malformed object, email is required' });
      return;
    }
    if (!account.name) {
      res.status(400);
      res.json({ status: 400, reason: 'Malformed object, name is required' });
      return;
    }
    try {
      account.id = await am.create(account);
      if (account.keys) {
        const km = new KeyManager(req.db);
        const keys = [];
        for (let i = 0; i < account.keys.length; i++) {
          const id = await km.create(account.id, account.keys[i]);
          const key = {
            id,
            key: account.keys[i]
          };
          keys.push(key);
        }
        account.keys = keys;
      }
      const ret = await am.getFull(account.id);
      res.json(ret);
    } catch (err) {
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });

  server.get('/accounts/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    const am = new AccountManager(req.db);
    try {
      const account = await am.getFull(req.params.id);
      res.json(account);
    } catch (err) {
      res.status(404);
      res.json({ status: 404, reason: 'Account not found' });
    }
  });

  server.put('/accounts/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    const am = new AccountManager(req.db);
    const { active } = req.body;
    try {
      const ret = await am.changeStatus(req.params.id, active);
      if (ret === 0) {
        res.status(404);
        res.json({ status: 404, reason: 'Account not found' });
      }
      res.json({ status: 201 });
    } catch (err) {
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });

  server.del('/accounts/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    const am = new AccountManager(req.db);
    try {
      const ret = await am.delete(req.params.id);
      if (ret === 0) {
        res.status(404);
        res.json({ status: 404, reason: 'Account not found' });
      }
      res.json({ status: 201 });
    } catch (err) {
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });

  server.post('/accounts/:id/keys', requireAdminAuthMiddleware, async (req, res, next) => {
    const km = new KeyManager(req.db);
    const { keys } = req.body;
    const ret = {
      account_id: req.params.id,
      keys: []
    };
    try {
      for (let i = 0; i < keys.length; i++) {
        const id = await km.create(req.params.id, keys[i]);
        const key = {
          id,
          key: keys[i]
        };
        ret.keys.push(key);
      }
      res.json(ret);
    } catch (err) {
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });

  server.del('/accounts/:id/keys/:key_id', requireAdminAuthMiddleware, async (req, res, next) => {
    const km = new KeyManager(req.db);
    try {
      const ret = await km.delete(req.params.id, req.params.key_id);
      if (ret === 0) {
        res.status(404);
        res.json({ status: 404, reason: 'Key not found' });
      }
      res.json({ status: 201 });
    } catch (err) {
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });

  server.post('/accounts/:id/permissions', requireAdminAuthMiddleware, async (req, res, next) => {
    const pm = new PermissionManager(req.db);
    const { user, host } = req.body;
    try {
      const ret = await pm.create(req.params.id, user, host);
      res.json({ account_id: req.params.id, permission_id: ret });
    } catch (err) {
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });

  server.del('/accounts/:id/permissions/:permission_id', requireAdminAuthMiddleware, async (req, res, next) => {
    const pm = new PermissionManager(req.db);
    try {
      const ret = await pm.delete(req.params.id, req.params.permission_id);
      if (ret === 0) {
        res.status(404);
        res.json({ status: 404, reason: 'Permission not found' });
      }
      res.json({ status: 200 });
    } catch (err) {
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });
}
