import os from 'os';
import packageJson from '../../package';
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
import { millisecondsToStr } from '../lib/utils/dateUtils';

const notifyReloadTokens = function() {
  setImmediate(async () => {
    const cm = loadCacheManager();
    try {
      const client = await cm.open();
      client.publish('core_tokens', 'flush_tokens');
      cm.close(client);
    } catch (e) {
      console.error('Error while flushing cache tokens', e);
    }
  });
};

const uptime_start = Date.now();

export const initRoutes = express => {
  const router = express.Router();
  router.get('/', (req, res, next) => {
    res.json({ status: 200 });
  });

  router.get('/uptime', requireAdminAuthMiddleware, (req, res) => {
    const { name, version } = packageJson;
    const uptime = Date.now() - uptime_start;
    const ret = {
      name,
      version,
      node_version: process.version,
      hostname: os.hostname(),
      uptime: Math.floor(uptime / 1000),
      uptime_hr: millisecondsToStr(uptime),
      memory_usage: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'M'
    };
    res.json(ret);
  });

  // /authorized_keys
  router.use('/authorized_keys', handleKeys(express));

  // Groups
  router.use('/groups', handleGroups(express));

  // /accounts
  router.use('/accounts', handleAccounts(express));

  // /permissions
  router.use('/permissions', handlePermissions(express));

  // import/export
  router.use('/permissions', handleImpExp(express));

  router.post('/flushdb', requireAdminAuthMiddleware, async (req, res, next) => {
    if (!process.env.MODE || process.env.MODE !== 'test') {
      res.status(403);
      res.json({ status: 403, reason: 'Operation is forbidden' });
      return;
    }
    try {
      const dh = DbHelper();
      const done = await dh._flush(req.db);
      if (done) {
        if (process.env.CLUSTER_MODE && process.env.CLUSTER_MODE === '1') {
          notifyReloadTokens();
        }
        res.sendStatus(204);
      } else {
        res.sendStatus(404);
      }
    } catch (err) {
      console.error('Error while flushing db', err);
      res.sendStatus(500);
    }
  });

  // Reload tokens, called using CORE token
  router.post('/tokens', requireCoreAuthMiddleware, async (req, res, next) => {
    try {
      const { tokens } = req.body;
      if (!tokens.admin && !tokens.admins && !tokens.clients) {
        res.status(400);
        res.json({ code: 400, reason: 'Invalid payload' });
        return;
      }
      const atm = new AuthTokenManager(req.db);
      await atm.delete();
      if (tokens.admin) {
        const { token, assignee } = AuthTokenManager.getTokenAssignee(tokens.admin, true);
        await atm.create(token, 'admin', assignee);
      }
      if (tokens.admins) {
        for (let i = 0; i < tokens.admins.length; i++) {
          const { token, assignee } = AuthTokenManager.getTokenAssignee(tokens.admins[i]);
          await atm.create(token, 'admin', assignee);
        }
      }
      if (tokens.clients) {
        for (let i = 0; i < tokens.clients.length; i++) {
          await atm.create(tokens.clients[i], 'agent');
        }
      }
      if (process.env.CLUSTER_MODE && process.env.CLUSTER_MODE === '1') {
        notifyReloadTokens();
        res.sendStatus(204);
      } else {
        const ah = AppHelper();
        const tokens = await atm.getAll();
        ah.reloadAuthToken(tokens);
        res.sendStatus(204);
      }
    } catch (err) {
      console.error('Error while pushing tokens', err);
      res.status(500);
      res.json({ code: 500, reason: 'Fail to update tokens' });
    }
  });
  return router;
};
