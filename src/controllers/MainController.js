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

import packageJson from '../../package.json';
import os from 'os';
import { millisecondsToStr } from '../lib/utils/dateUtils';
import { checkAdminAuth, checkCoreAuth } from '../lib/middlewares/AuthMiddleware';
import { sendError } from '../lib/utils/responseUtils';
import DbHelper from '../lib/helpers/DbHelper';
import { loadCacheManager, notifyReloadTokens } from '../lib/helpers/CacheHelper';
import { getInstance, isMultiInstances } from '../lib/utils/instanceUtils';
import { getLogger } from '@fluidware-it/saddlebag';
import { CLUSTER_MODE, MODE } from '../const';

const uptime_start = Date.now();

export function getInfo(req, res) {
  const { name, description } = packageJson;
  res.json({ name, description });
}

export function healthCheck(req, res) {
  res.set('Content-Type', 'text/plain').send('OK');
}

export function getUptime(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
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
}

export async function flushDB(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  if (!MODE || MODE !== 'test') {
    res.status(403);
    res.json({ status: 403, reason: 'Operation is forbidden' });
    return;
  }
  try {
    const dh = DbHelper();
    const done = await dh._flush(req.db);
    if (done) {
      if (CLUSTER_MODE) {
        notifyReloadTokens();
      }
      res.sendStatus(204);
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    getLogger().error(err, 'Error while flushing db');
    res.sendStatus(500);
  }
}

export async function deleteInstance(req, res) {
  try {
    checkCoreAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  if (!isMultiInstances()) {
    res.status(409).json({ code: 409, reason: 'Not available' });
    return;
  }
  const logger = getLogger();
  const instance = getInstance();
  const sql = 'delete from XXX where instance = ?';
  const tables = ['auth_tokens', 'accounts', 'tgroups'];
  let deleted = 0;
  for (const table of tables) {
    try {
      const rows = await req.db.delete(sql.replace('XXX', table), [instance]);
      logger.info(`delete ${rows} rows from ${table}`);
      deleted += rows;
    } catch (e) {
      logger.warn({ error_message: e.message }, `failed to delete instance rows from ${table}`);
    }
  }
  const cm = loadCacheManager();
  if (cm) {
    try {
      const client = await cm.open();
      await client.del(instance);
    } catch (e) {
      getLogger().error(e, 'Error while flushing cache');
    }
  }
  if (deleted > 0) {
    res.json({ status: 200, message: 'instance deleted' });
  } else {
    res.status(404).json({ status: 404, reason: 'not found' });
  }
}
