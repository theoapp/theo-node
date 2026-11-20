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

import dotenv from 'dotenv';
import { NAME, VERSION } from './version';

const { error } = dotenv.config({ quiet: true });

// A missing .env is fine: the environment can come from the process. A .env that exists but cannot be read (e.g. a file
// mounted with a mode the image's unprivileged user has no access to) must not be ignored: theo would start with its
// defaults, on an empty sqlite db.
if (error && error.code !== 'ENOENT') {
  // saddlebag reads its own settings from the environment at import time, so it is only loaded here, on the way out
  const { getLogger } = require('@fluidware-it/saddlebag');
  getLogger().fatal(error, 'Unable to load .env file');
  process.exit(1);
}

function setEnvIfNotSet(envVar, value) {
  /* eslint-disable n/no-process-env */
  if (!process.env[envVar]) {
    process.env[envVar] = value;
  }
  /* eslint-enable n/no-process-env */
}
setEnvIfNotSet('npm_package_version', VERSION);
setEnvIfNotSet('npm_package_name', NAME);
