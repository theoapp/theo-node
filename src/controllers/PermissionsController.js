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

import { checkAdminAuth } from '../lib/middlewares/AuthMiddleware';
import { sendError } from '../lib/utils/responseUtils';
import { getAuthorizedKeysAsFullJson } from '../lib/helpers/KeysHelper';
import { MODE } from '../const';
import { getLogger } from '@fluidware-it/saddlebag';

export async function searchPermissions(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  const { host, user } = req.params;
  try {
    const keys = await getAuthorizedKeysAsFullJson(req.db, user, host);
    res.json(keys);
  } catch (err) {
    if (MODE === 'test') {
      getLogger().error(err, 'Failed search permissions');
    }
    sendError(res, err);
  }
}
