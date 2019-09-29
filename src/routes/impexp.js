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
import { exp, imp } from '../lib/helpers/ImpExpHelper';

export default function handleImpExp(express) {
  const router = express.Router();
  router.get('/', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      const dump = await exp(req.db);
      res.json(dump);
    } catch (err) {
      if (process.env.MODE === 'test') {
        console.error('Failed to export', err);
      }
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });

  router.post('/', requireAdminAuthMiddleware, async (req, res, next) => {
    try {
      await imp(req.db, req.body);
      res.json(204);
    } catch (err) {
      console.log('Import failed ', err);
      res.status(err.t_code || 500);
      res.json({ status: err.t_code || 500, reason: err.message });
    }
  });
  return router;
}
