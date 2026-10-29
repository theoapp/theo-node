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
import GroupManager from '../lib/managers/GroupManager';
import {
  adminAddGroupPermission,
  adminCreateGroup,
  adminCreateGroupAccount,
  adminCreateGroupAccounts,
  adminDeleteGroup,
  adminDeleteGroupAccount,
  adminDeleteGroupPermission,
  adminEditGroup,
  adminGetGroup,
  adminUpdateGroupPermission
} from '../lib/helpers/AdminHelper';

export async function listGroups(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  const gm = new GroupManager(req.db);
  try {
    const { limit, offset, order_by, sort, name } = req.query;
    let ret;
    if (name) {
      ret = await gm.search(name, Number(limit), Number(offset), order_by, sort);
    } else {
      ret = await gm.getAll(Number(limit), Number(offset), false, order_by, sort);
    }
    res.json(ret);
  } catch (err) {
    sendError(res, err);
  }
}

export async function addGroup(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const ret = await adminCreateGroup(req.db, req.body, req);
    res.json(ret);
  } catch (err) {
    sendError(res, err);
  }
}

export async function getGroup(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const ret = await adminGetGroup(req.db, req.params.id);
    res.json(ret);
  } catch (err) {
    sendError(res, err);
  }
}

export async function deprecatedAddAccountsToGroup(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  res.set('X-Sunset', '1.0.0');
  try {
    const { id, ids } = req.body;
    if (id && ids) {
      res.status(400);
      res.json({ status: 400, reason: 'Only one between id and ids must be used' });
      return;
    }
    if (!id && !ids) {
      res.status(400);
      res.json({ status: 400, reason: 'One between id and ids must be used' });
      return;
    }
    if (id) {
      await adminCreateGroupAccount(req.db, req.params.id, id, req);
      res.status(204);
      res.end();
    } else {
      const done = await adminCreateGroupAccounts(req.db, req.params.id, ids, req);
      res.status(200);
      res.json(done);
    }
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
}

export async function editGroup(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  const { active } = req.body;
  try {
    const done = await adminEditGroup(req.db, req.params.id, active, req);
    sendDone(res, done);
  } catch (err) {
    sendError(res, err);
  }
}

export async function deleteGroup(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const done = await adminDeleteGroup(req.db, req.params.id, req);
    sendDone(res, done);
  } catch (err) {
    sendError(res, err);
  }
}

export async function addAccountToGroup(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const { id } = req.body;
    if (!id) {
      res.status(400);
      res.json({ status: 400, reason: 'Invalid payload' });
      return;
    }
    await adminCreateGroupAccount(req.db, req.params.id, id, req);
    res.status(204);
    res.end();
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
}

export async function addAccountsToGroup(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const { ids } = req.body;
    if (!ids) {
      res.status(400);
      res.json({ status: 400, reason: 'Invalid payload' });
      return;
    }
    const done = await adminCreateGroupAccounts(req.db, req.params.id, ids, req);
    res.status(200);
    res.json(done);
  } catch (err) {
    console.error(err);
    sendError(res, err);
  }
}

export async function deleteAccountFromGroup(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const done = await adminDeleteGroupAccount(req.db, req.params.id, req.params.account_id, req);
    if (done > 0) {
      res.status(204);
      res.end();
    } else {
      res.status(404);
      res.json({ status: 404, reason: 'Account was not in this group' });
    }
  } catch (err) {
    sendError(res, err);
  }
}

export async function addPermissionToGroup(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  const { user, host, ssh_options } = req.body;
  try {
    const ret = await adminAddGroupPermission(req.db, req.params.id, user, host, ssh_options, req);
    res.json(ret);
  } catch (err) {
    sendError(res, err);
  }
}

export async function editGroupPermission(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const done = await adminUpdateGroupPermission(
      req.db,
      req.params.id,
      Number(req.params.permission_id),
      req.body.ssh_options,
      req
    );
    sendDone(res, done);
  } catch (err) {
    sendError(res, err);
  }
}

export async function deletePermissionFromGroup(req, res) {
  try {
    checkAdminAuth(req);
  } catch (e) {
    sendError(res, e);
    return;
  }
  try {
    const done = await adminDeleteGroupPermission(req.db, req.params.id, Number(req.params.permission_id), req);
    sendDone(res, done);
  } catch (err) {
    sendError(res, err);
  }
}
