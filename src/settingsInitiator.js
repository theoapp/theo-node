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

import { common_error, common_warn } from './lib/utils/logUtils';
import { md5 } from './lib/utils/cryptoUtils';
import { getLoadDbEnvSettings, loadPostgresEnvSettings } from './dbInitiator';
import { DEFAULT_INSTANCE_NAME, isMultiInstances } from './lib/utils/instanceUtils';
import {
  ADMIN_TOKEN,
  ADMIN_TOKENS,
  CACHE_ENABLED,
  CACHE_OPTIONS,
  CACHE_URI,
  CLIENT_TOKENS,
  CLUSTER_MODE,
  CORE_TOKEN,
  DATA_PATH,
  DB_ENGINE,
  DB_STORAGE,
  HTTP_PORT,
  PORT,
  REQUIRE_SIGNED_KEY,
  SETTINGS_FILE
} from './const';

function convertTokens(settings) {
  if (settings.admin) settings.instances[DEFAULT_INSTANCE_NAME].admin = settings.admin;
  if (settings.client) settings.instances[DEFAULT_INSTANCE_NAME].client = settings.client;
}

function setEnvTokens(settings) {
  const adminToken = ADMIN_TOKEN || false;
  const adminTokens = ADMIN_TOKENS || false;
  if (adminToken && adminTokens) {
    common_error('ADMIN_TOKEN && ADMIN_TOKENS must not be used together');
    process.exit(2);
  }
  if (adminToken) {
    settings.instances[DEFAULT_INSTANCE_NAME].admin.token = adminToken;
  }
  if (settings.instances[DEFAULT_INSTANCE_NAME].admin.token) {
    settings.instances[DEFAULT_INSTANCE_NAME].admin.tokens[settings.instances[DEFAULT_INSTANCE_NAME].admin.token] =
      'admin';
    settings.instances[DEFAULT_INSTANCE_NAME].admin.token = undefined;
  }
  if (adminTokens) {
    settings.instances[DEFAULT_INSTANCE_NAME].admin.tokens = {};
    const _adminTokens = adminTokens.split(',');
    _adminTokens.forEach(_adminToken => {
      let [token, assignee] = _adminToken.split(':');
      if (!assignee) {
        console.warn('[WARN] ADMIN_TOKENS must be in the form: token:assignee. See documentation');
        console.warn('[WARN] We will use md5(token) as assignee');
        assignee = md5(token);
      }
      const _token = md5(`${DEFAULT_INSTANCE_NAME}:${token}`);
      settings.instances[DEFAULT_INSTANCE_NAME].admin.tokens[_token] = assignee;
    });
  } else {
    if (typeof settings.instances[DEFAULT_INSTANCE_NAME].admin.tokens.length === 'number') {
      const adminTokens = {};
      settings.instances[DEFAULT_INSTANCE_NAME].admin.tokens.forEach(_adminToken => {
        let assignee;
        let token;
        if (typeof _adminToken === 'string') {
          console.warn('[WARN] settings.admin.tokens must be an object: { token, assignee }. See documentation');
          console.warn('[WARN] We will use md5(token) as assignee');
          assignee = md5(_adminToken);
          token = _adminToken;
        } else {
          assignee = _adminToken.assignee;
          token = _adminToken.token;
        }
        const _token = md5(`${DEFAULT_INSTANCE_NAME}:${token}`);
        adminTokens[_token] = assignee;
      });
      settings.instances[DEFAULT_INSTANCE_NAME].admin.tokens = adminTokens;
    } else {
      const tokens = {};
      for (const token in settings.instances[DEFAULT_INSTANCE_NAME].admin.tokens) {
        const _token = md5(`${DEFAULT_INSTANCE_NAME}:${token}`);
        tokens[_token] = settings.instances[DEFAULT_INSTANCE_NAME].admin.tokens[token];
      }
      settings.instances[DEFAULT_INSTANCE_NAME].admin.tokens = tokens;
    }
  }
  const clientTokens = CLIENT_TOKENS || false;
  if (clientTokens) {
    settings.instances[DEFAULT_INSTANCE_NAME].client.tokens = clientTokens
      .split(',')
      .map(t => md5(`${DEFAULT_INSTANCE_NAME}:${t}`));
  }
}

const initSettings = function () {
  const settings = {
    server: {
      http_port: 9100
    },
    db: {
      engine: 'sqlite',
      storage: './data/theo.db'
    },
    keys: {
      sign: false
    },
    instances: {}
  };

  if (!isMultiInstances()) {
    settings.instances[DEFAULT_INSTANCE_NAME] = {
      admin: {
        token: undefined,
        tokens: {}
      },
      client: {
        tokens: []
      }
    };
  }

  const settingsJson = SETTINGS_FILE;
  if (settingsJson) {
    const _settings = require(settingsJson);
    if (_settings.admin || _settings.client) {
      convertTokens(_settings);
    }
    Object.assign(settings, _settings);
  }

  settings.cluster_mode = CLUSTER_MODE;

  const setDbEnv = () => {
    if (DB_ENGINE) {
      settings.db.engine = DB_ENGINE;
    }
    if (settings.db.engine === 'sqlite') {
      if (CLUSTER_MODE) {
        common_error('DB ERROR! Engine mariadb/mysql is required for CLUSTER_MODE');
        process.exit(1);
      }
      if (DB_STORAGE) {
        settings.db.storage = DB_STORAGE;
      } else {
        const sqlite_path = DATA_PATH || false;
        if (sqlite_path) {
          console.warn('DB WARNING! DATA_PATH has been deprecated, please use DB_STORAGE');
          settings.db.storage = sqlite_path;
        }
      }
    } else if (settings.db.engine === 'postgres') {
      loadPostgresEnvSettings(settings.db);
    } else {
      const loadDbEnvSettings = getLoadDbEnvSettings();
      loadDbEnvSettings(settings.db);
    }
  };

  const setEnv = () => {
    const coreToken = CORE_TOKEN || false;
    if (coreToken) {
      settings.core = {
        token: coreToken
      };
    }

    if (!coreToken && isMultiInstances()) {
      common_error('CORE TOKEN is required with MULTI_INSTANCES');
      process.exit(1);
    }

    if (PORT) {
      settings.server.http_port = Number(PORT);
    } else if (HTTP_PORT) {
      common_warn('HTTP_PORT is deprecated. Please use PORT instead');
      settings.server.http_port = Number(HTTP_PORT);
    }

    const cache = CACHE_ENABLED || false;

    if (cache) {
      settings.cache = {
        type: cache,
        settings: {
          uri: CACHE_URI || false,
          options: CACHE_OPTIONS || false
        }
      };
    }
    if (REQUIRE_SIGNED_KEY) {
      settings.keys.sign = true;
    }
    setDbEnv();

    if (!settings.core || !settings.core.token) {
      setEnvTokens(settings);
    }
  };

  setEnv();

  return settings;
};

export default initSettings;
