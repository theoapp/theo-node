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
import { sendDone, sendError } from '../lib/utils/responseUtils';
import AccountManager from '../lib/managers/AccountManager';
import {
  adminAddAccountKeys,
  adminAddAccountKeyFromService,
  adminAddAccountPermission,
  adminCreateAccount,
  adminDeleteAccount,
  adminDeleteAccountKey,
  adminDeleteAccountPermission,
  adminEditAccount,
  adminGetAccount,
  adminUpdateAccountPermission,
  adminUpdateAccountKey
} from '../lib/helpers/AdminHelper';

export async function listAccounts(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  const am = new AccountManager(req.db);
  try {
    const { search, limit, offset, order_by, sort } = req.query;
    let ret;
    if (search) {
      ret = await am.search(search, search, Number(limit), Number(offset), order_by, sort);
    } else {
      ret = await am.getAll(Number(limit), Number(offset), false, order_by, sort);
    }
    res.json(ret);
  } catch (err) {
    console.error('GET /accounts', err);
    sendError(res, err);
  }
}

export async function addAccount(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const ret = await adminCreateAccount(req.db, req.body, req);
    res.json(ret);
  } catch (err) {
    sendError(res, err);
  }
}

export async function searchAccounts(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  const am = new AccountManager(req.db);
  try {
    const { search, limit, offset } = req.query;
    let { name, email } = req.query;
    if (search) {
      if (!name) {
        name = search;
      }
      if (!email) {
        email = search;
      }
    }
    const accounts = await am.search(name, email, Number(limit), Number(offset));
    res.json(accounts);
  } catch (err) {
    sendError(res, err);
  }
}

export async function getAccount(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const account = await adminGetAccount(req.db, req.params.id);
    res.json(account);
  } catch (err) {
    sendError(res, err);
  }
}

export async function editAccount(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  const { active, expire_at } = req.body;
  try {
    const done = await adminEditAccount(req.db, req.params.id, active, expire_at, req);
    sendDone(res, done);
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
}

export async function deleteAccount(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const done = await adminDeleteAccount(req.db, req.params.id, req);
    sendDone(res, done);
  } catch (err) {
    sendError(res, err);
  }
}

export async function addKeysToAccount(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const ret = await adminAddAccountKeys(req.db, req.params.id, req.body.keys, req);
    res.json(ret);
  } catch (err) {
    sendError(res, err);
  }
}

export async function editAccountKey(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  const { ssh_options } = req.body;
  if (!ssh_options || typeof ssh_options !== 'object') {
    res.status(400);
    res.json({ status: 400, reason: 'Invalid payload' });
    return;
  }
  try {
    const done = await adminUpdateAccountKey(req.db, req.params.id, Number(req.params.key_id), ssh_options, req);
    sendDone(res, done);
  } catch (err) {
    sendError(res, err);
  }
}

export async function deleteKeyFromAccount(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const done = await adminDeleteAccountKey(req.db, req.params.id, Number(req.params.key_id), req);
    sendDone(res, done);
  } catch (err) {
    sendError(res, err);
  }
}

export async function addKeysFromServiceToAccount(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const ret = await adminAddAccountKeyFromService(req.db, req.params.id, req.params.service, req.body.username);
    res.json(ret);
  } catch (err) {
    sendError(res, err);
  }
}

export async function addPermissionToAccount(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  const { user, host, ssh_options } = req.body;
  try {
    const ret = await adminAddAccountPermission(req.db, req.params.id, user, host, ssh_options, req);
    res.json(ret);
  } catch (err) {
    sendError(res, err);
  }
}

export async function editAccountPermission(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const done = await adminUpdateAccountPermission(
      req.db,
      req.params.id,
      Number(req.params.permission_id),
      req.body.ssh_options,
      req
    );
    sendDone(res, done);
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
}

export async function deletePermissionFromAccount(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const done = await adminDeleteAccountPermission(req.db, req.params.id, Number(req.params.permission_id), req);
    sendDone(res, done);
  } catch (err) {
    sendError(res, err);
  }
}
