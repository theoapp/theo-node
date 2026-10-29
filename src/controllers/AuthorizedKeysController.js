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

import { checkAuth } from '../lib/middlewares/AuthMiddleware';
import { sendError } from '../lib/utils/responseUtils';
import { getAuthorizedKeys as getKeys, getAuthorizedKeysAsJson } from '../lib/helpers/KeysHelper';
import { dnsReverse } from '../lib/utils/dnsUtils';
import AppHelper from '../lib/helpers/AppHelper';
import RemoteLoggerHelper from '../lib/helpers/RemoteLoggerHelper';
import KeyManager from '../lib/managers/KeyManager';
import { MODE } from '../const';
import { getLogger } from '@fluidware-it/saddlebag';

const checkFingerPrint = async function (user, host, fingerprint, keys) {
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].fingerprint === fingerprint) {
      const data = {
        user,
        host,
        email: keys[i].email,
        ts: Date.now()
      };
      RemoteLoggerHelper.log(data);
      return keys[i];
    }
  }
  getLogger().debug('No public key found for %s on %s with %s fingerprint', user, host, fingerprint);
};

const checkUserHost = async function (dm, accept, user, host, res, fingerprint) {
  if (accept && accept.indexOf('application/json') >= 0) {
    const { keys, cache } = await getAuthorizedKeysAsJson(dm, user, host);
    res.header('X-From-Cache', cache);
    res.json(keys);
    if (fingerprint) {
      try {
        const key = await checkFingerPrint(user, host, fingerprint, keys);
        if (key) {
          setImmediate(() => {
            const db = dm.getClient('rw');
            db.open()
              .then(() => {
                return KeyManager.setLastUsed(db, fingerprint);
              })
              .catch(e => {
                getLogger().error(e, 'Failed to update last_used_at');
              })
              .finally(() => {
                const ret = db.close();
                if (ret && ret instanceof Promise) {
                  ret.catch(err => getLogger().error(err, 'Failed to close db'));
                }
              });
          });
        }
      } catch (_e) {
        //
      }
    }
  } else {
    const ah = AppHelper();
    const settingsKeys = ah.getSettings('keys');
    if (settingsKeys && settingsKeys.sign) {
      const err = new Error('Not Acceptable when FORCE_SIGNED_KEY is true');
      err.t_code = 406;
      throw err;
    }
    const { keys, cache } = await getKeys(dm, user, host);
    res.header('X-From-Cache', cache);
    res.header('Content-Type', 'text/plain');
    res.send(keys);
  }
};

export async function getAuthorizedKeys(req, res) {
  try {
    checkAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  const accept = req.header('Accept');
  const { host, user } = req.params;
  const { f } = req.query;
  try {
    await checkUserHost(req.dm, accept, user, host, res, f);
  } catch (err) {
    getLogger().error(err, 'Failed authorized_keys');
    sendError(res, err);
  }
}

export async function getAuthorizedKeysByReverseDNS(req, res) {
  try {
    checkAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  const accept = req.header('Accept');
  const { user } = req.params;
  const { f } = req.query;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  try {
    const host = await dnsReverse(ip);
    if (host && host.length > 0) {
      try {
        await checkUserHost(req.dm, accept, user, host[0], res, f);
      } catch (err) {
        if (MODE === 'test') {
          getLogger().error({ error_message: err.message }, 'Failed authorized_keys');
        }
        sendError(res, err);
      }
    } else {
      res.status(400);
      res.json({ status: 400, reason: 'Unable to get hostname for ' + ip });
    }
  } catch (err) {
    if (MODE === 'test') {
      getLogger().error({ error_message: err.message }, 'Failed reverse %s', ip);
    }
    res.status(400);
    res.json({ status: 400, reason: 'Unable to get hostname for ' + ip });
  }
}
