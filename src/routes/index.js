import handleAccounts from './accounts';
import handleKeys from './keys';
import handleGroups from './groups';
import { requireAdminAuthMiddleware, requireCoreAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import DbHelper from '../lib/helpers/DbHelper';
import AppHelper from '../lib/helpers/AppHelper';
import handlePermissions from './permissions';
import handleImpExp from './impexp';
import AuthTokenManager from '../lib/managers/AuthTokenManager';
import { loadCacheManager } from '../lib/helpers/CacheHelper';

export const initRoutes = server => {
  server.get('/', (req, res, next) => {
    res.json({ status: 200 });
  });

  // /authorized_keys
  handleKeys(server);

  // Groups
  handleGroups(server);

  // /accounts
  handleAccounts(server);

  // /permissions
  handlePermissions(server);

  // import/export
  handleImpExp(server);

  server.post('/flushdb', requireAdminAuthMiddleware, async (req, res, next) => {
    if (!process.env.MODE || process.env.MODE !== 'test') {
      res.status(403);
      res.json({ status: 403, reason: 'Operation is forbidden' });
      return;
    }
    try {
      const dh = DbHelper();
      const done = await dh._flush();
      if (done) {
        res.send(204);
      } else {
        res.send(404);
      }
    } catch (err) {
      console.error('Error while flushing db', err);
      res.send(500);
    }
  });

  // Reload tokens, called using CORE token
  server.post('/tokens', requireCoreAuthMiddleware, async (req, res, next) => {
    try {
      const { tokens } = req.body;
      if (!tokens.admin || !tokens.clients) {
        res.status(400);
        res.json({ code: 400, reason: 'Invalid payload' });
        return;
      }
      const atm = new AuthTokenManager(req.db);
      await atm.delete();
      await atm.create(tokens.admin, 'admin');
      for (let i = 0; i < tokens.clients.length; i++) {
        await atm.create(tokens.clients[i], 'agent');
      }

      if (process.env.CLUSTER_MODE && process.env.CLUSTER_MODE === '1') {
        setImmediate(async () => {
          const cm = loadCacheManager();
          try {
            const client = await cm.open();
            client.publish('core_tokens', 'flush_tokens');
            cm.close(client);
            res.send(204);
          } catch (e) {
            console.error('Error while flushing cache tokens', e);
            res.status(500);
            res.json({ code: 500, reason: e.message });
          }
        });
      } else {
        const ah = AppHelper();
        ah.reloadAuthToken(tokens);
        res.send(204);
      }
    } catch (err) {
      console.error('Error while pushing tokens', err);
      res.status(500);
      res.json({ code: 500, reason: 'Fail to update tokens' });
    }
  });
};
