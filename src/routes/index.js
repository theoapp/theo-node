import handleAccounts from './accounts';
import handleKeys from './keys';
import handleGroups from './groups';
import { requireAdminAuthMiddleware, requireCoreAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import DbHelper from '../lib/helpers/DbHelper';
import AppHelper from '../lib/helpers/AppHelper';
import handlePermissions from './permissions';
import handleImpExp from './impexp';
import AuthTokenManager from '../lib/managers/AuthTokenManager';

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
      res.status(401);
      res.json({ status: 401, reason: 'Operation not permitted' });
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
      const ah = AppHelper();
      ah.reloadAuthToken(tokens);
      res.send(204);
    } catch (err) {
      console.error('Error while pushing tokens', err);
      res.send(500);
    }
  });
};
