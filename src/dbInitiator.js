// Copyright 2020 AuthKeys srl
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

import fs from 'fs';
import util from 'util';
import {
  DB_CLUSTER,
  DB_CONNECTION_LIMIT,
  DB_HOST,
  DB_NAME,
  DB_NOPOOL,
  DB_PASSWORD,
  DB_PASSWORD_FILE,
  DB_PORT,
  DB_QUEUE_LIMIT,
  DB_SSL_CA,
  DB_USER
} from './const';

// DB_CLUSTER format: rw:host[:port],ro:host[:port],...
export const parseDbClusterEnv = function (string) {
  const config = {
    rw: [],
    ro: []
  };
  string.split(',').forEach(part => {
    if (!part.trim()) {
      return;
    }
    const [ns, host, port] = part.trim().split(':');
    if (!config[ns]) {
      throw new Error(util.format('namespace %s is unknown. It must be "rw" or "ro"', ns));
    }
    if (!host) {
      throw new Error(util.format('no host defined: %s. Format is namespace:host:[port]', part));
    }
    config[ns].push({
      host,
      port: Number(port) || 3306
    });
  });
  if (config.rw.length === 0) {
    throw new Error('no primary server defined');
  }
  return config;
};

export const loadMariadbEnvSettings = function (dbSettings) {
  if (!dbSettings.config) {
    dbSettings.config = {};
  }
  if (!DB_USER && !dbSettings.config.user) {
    throw new Error('DB ERROR! mysql requires DB_USER');
  }

  if (!DB_PASSWORD && !DB_PASSWORD_FILE && !dbSettings.config.password) {
    throw new Error('DB ERROR! mysql requires DB_PASSWORD');
  }

  if (!DB_NAME && !dbSettings.config.database) {
    throw new Error('DB ERROR! mysql requires DB_NAME');
  }

  if (!DB_CLUSTER && !dbSettings.cluster && !DB_HOST && !dbSettings.config.host) {
    throw new Error('DB ERROR! mysql requires DB_HOST or DB_CLUSTER');
  }

  if (DB_NOPOOL) {
    dbSettings.noDbPool = true;
  } else if (!dbSettings.noDbPool) {
    dbSettings.noDbPool = false;
  }

  if (DB_USER) {
    dbSettings.config.user = DB_USER;
  }

  if (DB_PASSWORD_FILE) {
    dbSettings.config.password = fs.readFileSync(DB_PASSWORD_FILE, 'utf8');
  } else if (DB_PASSWORD) {
    dbSettings.config.password = DB_PASSWORD;
  }

  if (DB_NAME) {
    dbSettings.config.database = DB_NAME;
  }

  if (DB_CLUSTER) {
    try {
      dbSettings.cluster = parseDbClusterEnv(DB_CLUSTER);
    } catch (e) {
      throw new Error(util.format('DB ERROR! Unable to parse DB_CLUSTER: %s', e.message));
    }
  } else {
    if (DB_HOST) {
      dbSettings.config.host = DB_HOST;
    }

    if (DB_PORT) {
      dbSettings.config.port = Number(DB_PORT);
    }

    if (isNaN(dbSettings.config.port)) {
      dbSettings.config.port = 3306;
    }
  }

  if (DB_CONNECTION_LIMIT !== undefined) {
    dbSettings.config.connectionLimit = Number(DB_CONNECTION_LIMIT) || 10;
  }

  if (DB_QUEUE_LIMIT !== undefined) {
    dbSettings.config.queueLimit = Number(DB_QUEUE_LIMIT) || 4;
  }

  if (typeof dbSettings.config.timezone === 'undefined') {
    dbSettings.config.timezone = 'Z';
  }

  if (typeof dbSettings.config.waitForConnections === 'undefined') {
    dbSettings.config.waitForConnections = true;
  }

  if (DB_SSL_CA) {
    dbSettings.config.ssl = {
      ca: fs.readFileSync(DB_SSL_CA)
    };
  }
};

export const loadPostgresEnvSettings = function (dbSettings) {
  if (!dbSettings.config) {
    dbSettings.config = {};
  }
  if (!DB_USER && !dbSettings.config.user) {
    throw new Error('DB ERROR! postgres requires DB_USER');
  }

  if (!DB_PASSWORD && !dbSettings.config.password) {
    throw new Error('DB ERROR! postgres requires DB_PASSWORD');
  }

  if (!DB_NAME && !dbSettings.config.database) {
    throw new Error('DB ERROR! postgres requires DB_NAME');
  }

  if (DB_USER) {
    dbSettings.config.user = DB_USER;
  }

  if (DB_PASSWORD) {
    dbSettings.config.password = DB_PASSWORD;
  }

  if (DB_NAME) {
    dbSettings.config.database = DB_NAME;
  }

  if (DB_HOST) {
    dbSettings.config.host = DB_HOST;
  } else {
    dbSettings.config.host = '127.0.0.1';
  }

  if (DB_PORT) {
    dbSettings.config.port = Number(DB_PORT);
  }

  if (isNaN(dbSettings.config.port)) {
    dbSettings.config.port = 5432;
  }
};
