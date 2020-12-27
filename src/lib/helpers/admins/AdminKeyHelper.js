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

import AccountManager from '../../managers/AccountManager';
import KeyManager from '../../managers/KeyManager';
import AppHelper from '../AppHelper';
import { getOpenSSHPublicKey, SSHFingerprint } from '../../utils/sshUtils';
import EventHelper from '../EventHelper';
import { getKeysImporterModule, getKeysImporterModulesList } from '../../keys_importer/modules';

const adminAddAccountKey = async (km, signRequired, key, account, req) => {
  let _key;
  let _signature;
  let ssh_options;
  if (typeof key === 'string') {
    _key = key.trim();
  } else {
    // Object, we got also the signature
    _key = key.key && key.key.trim();
    _signature = key.signature && key.signature.trim();
    // .. and/or maybe ssh_options
    ssh_options = key.ssh_options;
  }
  if (!_key) {
    return false;
  }
  if (signRequired && !_signature) {
    const err = new Error('Key must be signed');
    err.t_code = 400;
    console.error('Key must be signed!');
    throw err;
  }
  try {
    _key = getOpenSSHPublicKey(_key, signRequired);
  } catch (e) {
    e.t_code = 400;
    throw e;
  }
  if (!_key) {
    const err = new Error('Invalid key format');
    err.t_code = 400;
    throw err;
  }

  const fingerprint = SSHFingerprint(_key);
  const fpExists = await km.checkFingerprint(fingerprint);
  if (fpExists) {
    const am = new AccountManager(km.db);
    const _account = await am.get(fpExists.account_id);
    const err = new Error('This key already exists, linked to account ' + _account.email);
    err.t_code = 409;
    throw err;
  }
  if (!ssh_options && ssh_options !== '') {
    ssh_options = '';
  } else {
    if (typeof ssh_options !== 'object') {
      const err = new Error('ssh_options is not an object: ' + typeof ssh_options);
      err.t_code = 400;
      throw err;
    }
    ssh_options = JSON.stringify(ssh_options);
  }
  const id = await km.create(account.id, _key, fingerprint, _signature, ssh_options);
  if (req && req.auditHelper) {
    req.auditHelper.log('accounts', 'add_key', account.email, { key: _key, fingerprint, ssh_options });
  }
  return {
    id,
    public_key: _signature ? { key: _key, signature: _signature } : _key
  };
};

export const adminAddAccountKeys = async (db, account_id, keys, req) => {
  const am = new AccountManager(db);
  let account;
  try {
    if (isNaN(account_id)) {
      account = await am.getByEmail(account_id);
      account_id = account.id;
    } else {
      account = await am.get(account_id);
      account_id = account.id;
    }
  } catch (err) {
    err.t_code = 404;
    throw err;
  }
  const ret = {
    account_id,
    public_keys: []
  };
  const km = new KeyManager(db, am);
  const ah = AppHelper();
  const settingsKeys = ah.getSettings('keys');
  const signRequired = settingsKeys && settingsKeys.sign === true;
  try {
    for (let i = 0; i < keys.length; i++) {
      const key = await adminAddAccountKey(km, signRequired, keys[i], account, req);
      if (key) {
        ret.public_keys.push(key);
      }
    }
    EventHelper.emit('theo:change', {
      func: 'account_keys',
      action: 'add',
      object: account_id,
      receiver: 'admin'
    });
    return ret;
  } catch (err) {
    if (!err.t_code) {
      err.t_code = 500;
    }
    throw err;
  }
};

export const adminUpdateAccountKey = async function(db, account_id, key_id, ssh_options, req) {
  const am = new AccountManager(db);
  let account;
  try {
    if (isNaN(account_id)) {
      account = await am.getByEmail(account_id);
      account_id = account.id;
    } else {
      account = await am.get(account_id);
    }
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  if (!ssh_options && ssh_options !== '') {
    ssh_options = '';
  } else {
    if (typeof ssh_options !== 'object') {
      const err = new Error('ssh_options is not an object: ' + typeof ssh_options);
      err.t_code = 400;
      throw err;
    }
    ssh_options = JSON.stringify(ssh_options);
  }
  const km = new KeyManager(db, am);
  try {
    const key = await km.get(account_id, key_id);
    if (!key) {
      const error = new Error('Key not found');
      error.t_code = 404;
      throw error;
    }
    await km.update(account_id, key_id, ssh_options);
    EventHelper.emit('theo:change', {
      func: 'account_keys',
      action: 'update',
      object: account_id,
      receiver: 'admin',
      ssh_options
    });
    if (req && req.auditHelper) {
      req.auditHelper.log('accounts', 'update_key', account.email, {
        key: key.public_key,
        fingerprint: key.fingerprint,
        ssh_options
      });
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminDeleteAccountKey = async (db, account_id, key_id, req) => {
  const am = new AccountManager(db);
  let account;
  try {
    if (isNaN(account_id)) {
      account = await am.getByEmail(account_id);
      account_id = account.id;
    } else {
      account = await am.get(account_id);
    }
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  const km = new KeyManager(db, am);
  try {
    const key = await km.get(account_id, key_id);
    if (!key) {
      const error = new Error('Key not found');
      error.t_code = 404;
      throw error;
    }
    await km.delete(account_id, key_id);
    EventHelper.emit('theo:change', {
      func: 'account_keys',
      action: 'delete',
      object: account_id,
      receiver: 'admin'
    });
    if (req && req.auditHelper) {
      req.auditHelper.log('accounts', 'remove_key', account.email, {
        key: key.public_key,
        fingerprint: key.fingerprint
      });
    }
    return true;
  } catch (err) {
    if (!err.t_code) err.t_code = 500;
    throw err;
  }
};

export const adminAddAccountKeyFromService = async (db, account_id, service, username) => {
  const ah = AppHelper();
  const settingsKeys = ah.getSettings('keys');
  if (settingsKeys && settingsKeys.sign) {
    const err = new Error('Import function is not available when REQUIRE_SIGNED_KEY is set');
    err.t_code = 400;
    throw err;
  }

  const am = new AccountManager(db);
  try {
    if (isNaN(account_id)) {
      account_id = await am.getIdByEmail(account_id);
    } else {
      await am.get(account_id);
    }
  } catch (err) {
    err.t_code = 404;
    throw err;
  }
  if (!service) {
    const error = new Error('Service not valid');
    error.t_code = 400;
    throw error;
  }
  if (!username) {
    const error = new Error('Username not valid');
    error.t_code = 400;
    throw error;
  }
  let keys;
  try {
    const KimClass = getKeysImporterModule(service);
    if (!KimClass) {
      const error = new Error(
        'Service ' + service + ' not found. Valid services are: ' + getKeysImporterModulesList().join(', ')
      );
      error.t_code = 400;
      throw error;
    }
    const kim = new KimClass();
    keys = (await kim.get(username)) || [];
  } catch (err) {
    err.t_code = 400;
    throw err;
  }
  const ret = {
    account_id,
    public_keys: []
  };
  const km = new KeyManager(db, am);
  try {
    for (let i = 0; i < keys.length; i++) {
      const _key = keys[i].trim();
      if (!_key) {
        continue;
      }
      const fingerprint = SSHFingerprint(_key);
      const fpExists = await km.checkFingerprint(fingerprint);
      if (!fpExists) {
        const id = await km.create(account_id, _key, fingerprint);
        const key = {
          id,
          public_key: keys[i]
        };
        ret.public_keys.push(key);
      }
    }
    EventHelper.emit('theo:change', {
      func: 'account_keys',
      action: 'add_from_service',
      object: account_id,
      receiver: 'admin'
    });
    return ret;
  } catch (err) {
    err.t_code = 500;
    throw err;
  }
};
