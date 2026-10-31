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

import { getLogger } from '@fluidware-it/saddlebag';

const noDbUrls = [{ path: '/authorized_keys', partial: true }, { path: '/' }, { path: '/uptime' }];

export const doURLneedDb = function (path) {
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

const closeClient = function (client) {
  try {
    const ret = client.close();
    if (ret && typeof ret.catch === 'function') {
      ret.catch(e => getLogger().error({ error_message: e.message }, 'failed to close db'));
    }
  } catch (e) {
    getLogger().error({ error_message: e.message }, 'failed to close db');
  }
};

// Waits at most `timeout` ms for a connection. If it arrives later, nobody is waiting for it any more: release it.
const openClient = function (client, timeout) {
  const opening = client.open();
  if (!timeout) {
    return opening;
  }
  let timer;
  const expired = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      opening.then(
        () => closeClient(client),
        () => {}
      );
      reject(new Error(`no db connection available after ${timeout}ms`));
    }, timeout);
  });
  return Promise.race([opening, expired]).finally(() => clearTimeout(timer));
};

// Needs req.dm
export const dbMiddleware = function (acquireTimeout) {
  return async (req, res, next) => {
    const { path, method } = req;
    if (method === 'HEAD' || !doURLneedDb(path)) {
      next();
      return;
    }
    const client = req.dm.getClient(method === 'GET' ? 'ro' : 'rw');
    try {
      await openClient(client, acquireTimeout);
    } catch (err) {
      getLogger().error({ error_message: err.message }, 'Failed to open db');
      if (!res.headersSent && !res.destroyed) {
        res.status(500);
        res.json({
          status: 500,
          reason: 'A problem occurred, please retry'
        });
      }
      return;
    }
    // The client went away while we were waiting for the connection: 'close' has already been emitted,
    // a listener added now would never run and the connection would never go back to the pool
    if (res.closed || res.destroyed) {
      closeClient(client);
      return;
    }
    req.db = client;
    res.once('close', () => closeClient(client));
    next();
  };
};
