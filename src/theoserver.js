import Microservice from '@authkeys-io/microservice';
import { initRoutes } from './routes';
import packageJson from '../package.json';
import { authMiddleware } from './lib/middlewares/AuthMiddleware';

const noDbUrls = [{ path: '/authorized_keys', partial: true }, { path: '/' }, { path: '/uptime' }];

const doURLneedDb = function(path) {
  for (let i = 0; i < noDbUrls.length; i++) {
    if (noDbUrls[i].partial) {
      if (path.indexOf(noDbUrls[i].path) === 0) {
        return false;
      }
    } else {
      if (path === noDbUrls[i]) {
        return false;
      }
    }
  }
  return true;
};

class TheoServer extends Microservice {
  dm;
  constructor(environment, dm) {
    super(environment);
    this.dm = dm;
  }
  setupRoutes(app, express) {
    app.disable('x-powered-by');
    app.use(authMiddleware);
    app.use(async (req, res, next) => {
      const { path, method } = req;
      req.dm = this.dm;
      if (method !== 'HEAD') {
        const needDb = doURLneedDb(path);
        if (needDb) {
          const client = this.dm.getClient(method === 'GET');
          try {
            await client.open();
          } catch (err) {
            // Ops..
            res.status(500);
            res.json({ status: 500, reason: 'A problem occured, please retry' });
            return;
          }
          req.db = client;

          res.on('finish', () => {
            try {
              client.close();
            } catch (e) {}
          });
        }
      }
      next();
    });
    app.use('/', initRoutes(express));
  }

  getName() {
    return packageJson.name;
  }

  getVersion() {
    return packageJson.version;
  }
}

export default TheoServer;
