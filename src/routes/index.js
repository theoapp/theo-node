import handleAccounts from './accounts';
import handleKeys from './keys';
import handleGroups from './groups';
import { requireAdminAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import DbHelper from '../lib/helpers/DbHelper';
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
      const dh = DbHelper();
      const done = await dh._flush();
      if (done) {
        res.send(204);
      } else {
        res.send(404);
      }
    } catch (err) {
      console.error(err);
      res.send(500);
    }
  });
};
