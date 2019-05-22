import { requireAdminAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import GroupManager from '../lib/managers/GroupManager';
import {
  adminAddGroupPermission,
  adminCreateGroup,
  adminCreateGroupAccount,
  adminCreateGroupAccounts,
  adminDeleteGroup,
  adminDeleteGroupAccount,
  adminDeleteGroupPermission,
  adminEditGroup,
  adminGetGroup
} from '../lib/helpers/AdminHelper';

export default function handleGroups(server) {
  server.get('/groups', requireAdminAuthMiddleware, async (req, res, next) => {
    const gm = new GroupManager(req.db);
    try {
      const { limit, offset, order_by, sort, name } = req.query;
      let ret;
      if (name) {
        ret = await gm.search(name, Number(limit), Number(offset), order_by, sort);
      } else {
        ret = await gm.getAll(Number(limit), Number(offset), false, order_by, sort);
      }
      res.json(ret);
    } catch (err) {
      res.status(500);
      res.json({ status: 500, reason: err.message });
    }
  });

  server.post('/groups', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const ret = await adminCreateGroup(req.db, req.body, req.auth_token);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.get('/groups/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const ret = await adminGetGroup(req.db, req.params.id);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.post('/groups/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    res.set('X-Sunset', '1.0.0');
    try {
      const { id, ids } = req.body;
      if (id && ids) {
        res.status(400);
        res.json({ status: 400, reason: 'Only one between id and ids must be used' });
        return;
      }
      if (!id && !ids) {
        res.status(400);
        res.json({ status: 400, reason: 'One between id and ids must be used' });
        return;
      }
      let done;
      if (id) {
        done = await adminCreateGroupAccount(req.db, req.params.id, id, req.auth_token);
        res.status(204);
        res.end();
      } else if (ids) {
        done = await adminCreateGroupAccounts(req.db, req.params.id, ids, req.auth_token);
        res.status(200);
        res.json(done);
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

  server.put('/groups/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    const { active } = req.body;
    try {
      const done = await adminEditGroup(req.db, req.params.id, active, req.auth_token);
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

  server.del('/groups/:id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminDeleteGroup(req.db, req.params.id, req.auth_token);
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

  server.post('/groups/:id/account', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const { id } = req.body;
      if (!id) {
        res.status(400);
        res.json({ status: 400, reason: 'Invalid payload' });
        return;
      }
      await adminCreateGroupAccount(req.db, req.params.id, id, req.auth_token);
      res.status(204);
      res.end();
    } catch (err) {
      console.error(err);
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.post('/groups/:id/accounts', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const { ids } = req.body;
      if (!ids) {
        res.status(400);
        res.json({ status: 400, reason: 'Invalid payload' });
        return;
      }
      const done = await adminCreateGroupAccounts(req.db, req.params.id, ids, req.auth_token);
      res.status(200);
      res.json(done);
    } catch (err) {
      console.error(err);
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.del('/groups/:id/:account_id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminDeleteGroupAccount(req.db, req.params.id, req.params.account_id, req.auth_token);
      if (done > 0) {
        res.status(204);
        res.end();
      } else {
        res.status(404);
        res.json({ status: 404, reason: 'Account was not in this group' });
      }
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.post('/groups/:id/permissions', requireAdminAuthMiddleware, async (req, res, next) => {
    const { user, host } = req.body;
    try {
      const ret = await adminAddGroupPermission(req.db, req.params.id, user, host, req.auth_token);
      res.json(ret);
    } catch (err) {
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  server.del('/groups/:id/permissions/:permission_id', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const done = await adminDeleteGroupPermission(req.db, req.params.id, Number(req.params.permission_id), req.auth_token);
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
