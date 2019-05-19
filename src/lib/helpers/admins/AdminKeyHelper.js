import AccountManager from '../../managers/AccountManager';
import KeyManager from '../../managers/KeyManager';
import AppHelper from '../AppHelper';
import { SSHFingerprint } from '../../utils/sshUtils';
import EventHelper from '../EventHelper';
import { getKeysImporterModule, getKeysImporterModulesList } from '../../keys_importer/modules';
import AuditHelper from '../AuditHelper';

const adminAddAccountKey = async (km, signRequired, key, account, auth_token) => {
  let _key;
  let _signature;
  if (typeof key === 'string') {
    _key = key.trim();
  } else {
    // Object, we got also sign
    _key = key.key.trim();
    _signature = key.signature.trim();
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
    const fingerprint = SSHFingerprint(_key);
    const id = await km.create(account.id, _key, fingerprint, _signature);
    AuditHelper.log(auth_token, 'keys', 'create', { email: account.email, key: _key, fingerprint });
    return {
      id,
      public_key: key
    };
  } catch (e) {
    throw e;
  }
};

export const adminAddAccountKeys = async (db, account_id, keys, auth_token) => {
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
  const km = new KeyManager(db);
  const ah = AppHelper();
  const settingsKeys = ah.getSettings('keys');
  const signRequired = settingsKeys && settingsKeys.sign === true;
  try {
    for (let i = 0; i < keys.length; i++) {
      const key = await adminAddAccountKey(km, signRequired, keys[i], account, auth_token);
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

export const adminDeleteAccountKey = async (db, account_id, key_id) => {
  const am = new AccountManager(db);
  try {
    if (isNaN(account_id)) {
      account_id = await am.getIdByEmail(account_id);
    } else {
      await am.get(account_id);
    }
  } catch (err) {
    err.t_code = 404;
    console.log('Throw 404');
    throw err;
  }
  const km = new KeyManager(db);
  try {
    const ret = await km.delete(account_id, key_id);
    if (ret === 0) {
      const error = new Error('Key not found');
      error.t_code = 404;
      throw error;
    }
    EventHelper.emit('theo:change', {
      func: 'account_keys',
      action: 'delete',
      object: account_id,
      receiver: 'admin'
    });
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
  const km = new KeyManager(db);
  try {
    for (let i = 0; i < keys.length; i++) {
      const _key = keys[i].trim();
      if (!_key) {
        continue;
      }
      const fingerprint = ''; // TODO get ssh key's fingerprint
      const id = await km.create(account_id, _key, fingerprint);
      const key = {
        id,
        public_key: keys[i]
      };
      ret.public_keys.push(key);
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
