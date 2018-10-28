import handleAccounts from './accounts';
import handleKeys from './keys';
import handleGroups from './groups';
import { requireAdminAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import SqliteHelper from '../lib/helpers/SqliteHelper';

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

  server.post('/flushdb', requireAdminAuthMiddleware, async (req, res, next) => {
    if (!process.env.MODE || process.env.MODE !== 'test') {
      res.status(401);
      res.json({ status: 401, reason: 'Operation not permitted' });
      return;
    }
    try {
      await SqliteHelper()._flush();
      res.send(204);
    } catch (err) {
      console.error(err);
      res.send(500);
    }
  });
};
