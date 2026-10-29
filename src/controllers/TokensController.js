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

import { checkCoreAuth } from '../lib/middlewares/AuthMiddleware';
import { sendError } from '../lib/utils/responseUtils';
import AppHelper from '../lib/helpers/AppHelper';
import AuthTokenManager from '../lib/managers/AuthTokenManager';
import { notifyReloadTokens } from '../lib/helpers/CacheHelper';
import { CLUSTER_MODE } from '../const';

// Reload tokens, called using CORE token
export async function replaceTokens(req, res) {
  try {
    checkCoreAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const { tokens } = req.body;
    if (!tokens || (!tokens.core && !tokens.admin && !tokens.admins && !tokens.clients)) {
      res.status(400);
      res.json({ code: 400, reason: 'Invalid payload' });
      return;
    }
    const atm = new AuthTokenManager(req.db);
    await atm.delete();
    if (tokens.core) {
      await atm.create(tokens.core, 'core', 'core');
    }
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
    if (CLUSTER_MODE) {
      notifyReloadTokens();
      res.sendStatus(204);
    } else {
      const ah = AppHelper();
      const tokens = await atm.getAll(false);
      ah.reloadAuthToken(tokens);
      res.sendStatus(204);
    }
  } catch (err) {
    console.error('Error while pushing tokens', err);
    res.status(500).json({ code: 500, reason: 'Fail to update tokens' });
  }
}

// Reload tokens, called using CORE token
export async function deleteTokens(req, res) {
  try {
    checkCoreAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  const atm = new AuthTokenManager(req.db);
  await atm.delete();
  if (CLUSTER_MODE) {
    notifyReloadTokens();
    res.sendStatus(204);
  } else {
    const ah = AppHelper();
    await ah.loadAuthTokens(true);
    res.sendStatus(204);
  }
}
