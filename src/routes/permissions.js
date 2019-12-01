// Copyright 2019 AuthKeys srl
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

import { requireAdminAuthMiddleware } from '../lib/middlewares/AuthMiddleware';
import { getAuthorizedKeysAsFullJson } from '../lib/helpers/KeysHelper';

export default function handlePermissions(express) {
  const router = express.Router();
  router.get('/:host/:user', requireAdminAuthMiddleware, async (req, res) => {
    const { host, user } = req.params;
    try {
      const keys = await getAuthorizedKeysAsFullJson(req.db, user, host);
      res.json(keys);
    } catch (err) {
      if (process.env.MODE === 'test') {
        console.error('Failed search permissions', err);
      }
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });
  return router;
}
