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
import { exp, imp } from '../lib/helpers/ImpExpHelper';
import { MODE } from '../const';

export async function exportData(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const dump = await exp(req.db);
    res.json(dump);
  } catch (err) {
    if (MODE === 'test') {
      console.error('Failed to export', err);
    }
    sendError(res, err);
  }
}

export async function importData(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    await imp(req.db, req.body);
    res.sendStatus(204);
  } catch (err) {
    console.log('Import failed ', err);
    sendError(res, err);
  }
}
