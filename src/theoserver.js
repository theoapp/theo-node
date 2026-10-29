// Copyright 2019 AuthKeys srl
// Copyright 2023 Fluidware srl
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Microservice } from '@fluidware-it/express-microservice';
import packageJson from '../package.json';
import { authMiddleware } from './lib/middlewares/AuthMiddleware';
import { auditMiddleware } from './lib/middlewares/AuditMiddleware';
import { common_error, common_warn } from './lib/utils/logUtils';
import UpdateHelper from './lib/helpers/UpdateHelper';
import { getAsyncLocalStorage, isMultiInstances } from './lib/utils/instanceUtils';
import os from 'os';
import path from 'path';
import { ADDRESS, ADDRESSES, DEBUG_AUTH, SKIP_UPDATECHECK, TRUST_PROXY, TRUST_PROXY_LIST } from './const';

const noDbUrls = [{ path: '/authorized_keys', partial: true }, { path: '/' }, { path: '/uptime' }];

let last_check = 0;

const CHECK_INTERVAL = 604800000; // 7days: 7 * 24 * 60 * 60 * 1000;

const doURLneedDb = function (path) {
  for (let i = 0; i < noDbUrls.length; i++) {
    if (noDbUrls[i].partial) {
      if (path.indexOf(noDbUrls[i].path) === 0) {
        return false;
      }
    } else {
      if (path === noDbUrls[i].path) {
        return false;
      }
    }
  }
  return true;
};

// Keep the bind options of @authkeys/microservice (PORT, ADDRESSES, ADDRESS)
// and let theo's own authMiddleware handle bearer tokens
const getMicroserviceConfig = function (port) {
  const config = { port, forwardUnknownBearer: true };
  if (ADDRESSES) {
    config.addresses = ADDRESSES.split(',')
      .map(a => a.trim())
      .filter(a => !!a);
  } else if (ADDRESS) {
    config.address = ADDRESS;
  }
  return config;
};

class TheoServer extends Microservice {
  dm;

  constructor(port, dm) {
    super(getMicroserviceConfig(port));
    this.dm = dm;
    this.skip_updatecheck = SKIP_UPDATECHECK;
    if (!this.skip_updatecheck) {
      last_check = Date.now();
      UpdateHelper.checkUpdate(true);
    } else {
      common_warn('         SKIP_UPDATECHECK');
      common_warn('    we will not check for new versions!');
      common_warn('    be sure to star https://github.com/theoapp/theo-node');
      common_warn('    to be notified when a new release is out!');
    }
  }

  setupRoutes() {
    this.express.disable('x-powered-by');
    if (TRUST_PROXY) {
      this.express.set('trust proxy', TRUST_PROXY_LIST);
    }
    const hostname = os.hostname();
    const asyncLocalStorage = getAsyncLocalStorage();
    const _isMultiInstances = isMultiInstances();
    this.express.use((req, res, next) => {
      res.set('x-served-by', hostname);
      req.debugAuth = DEBUG_AUTH;
      asyncLocalStorage.run({}, () => {
        const store = asyncLocalStorage.getStore();
        store.instance = _isMultiInstances ? req.hostname : 'theo';
        store.reqId = req.id;
        next();
      });
    });
    this.express.use(authMiddleware);
    this.express.use(auditMiddleware);
    this.express.use(async (req, res, next) => {
      const { path, method } = req;
      res.set('Connection', 'close');
      req.dm = this.dm;
      if (method !== 'HEAD') {
        const needDb = doURLneedDb(path);
        if (needDb) {
          const client = this.dm.getClient(method === 'GET' ? 'ro' : 'rw');
          try {
            await client.open();
          } catch (err) {
            common_error('Failed to open db:', err.message);
            // Ops..
            res.status(500);
            res.json({
              status: 500,
              reason: 'A problem occurred, please retry'
            });
            return;
          }
          req.db = client;
          res.on('close', () => {
            try {
              client.close();
            } catch (e) {
              common_error('failed to close db:', e.message);
            }
          });
        }
      }
      if (!this.skip_updatecheck) {
        res.on('close', () => {
          if (Date.now() - last_check > CHECK_INTERVAL) {
            last_check = Date.now();
            UpdateHelper.checkUpdate();
          }
        });
      }
      next();
    });
    this.useOpenapiValidatorMiddleware(
      path.join(__dirname, '..', 'api', 'openapi-spec', 'openapi.yaml'),
      path.join(__dirname, 'controllers'),
      true
    );
  }

  getName() {
    return packageJson.name;
  }

  getVersion() {
    return packageJson.version;
  }
}

export default TheoServer;
