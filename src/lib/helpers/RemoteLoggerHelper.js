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

import packageJson from '../../../package';
import { http_post } from '../utils/httpUtils';
import { common_error } from '../utils/logUtils';

const { LOG_AUTH_KEYS_URL, LOG_AUTH_KEYS_TOKEN } = process.env;

class RemoteLoggerHelper {
  static getHttpHeaders() {
    return {
      'User-Agent': packageJson.name + '/' + packageJson.version,
      Authorization: 'Bearer ' + LOG_AUTH_KEYS_TOKEN,
      'Content-type': 'application/json'
    };
  }

  static log(data) {
    if (!LOG_AUTH_KEYS_URL) return;
    setImmediate(() => {
      http_post(LOG_AUTH_KEYS_URL, data, this.getHttpHeaders()).catch(e => {
        common_error('Failed to POST log: %s', e.message, data);
      });
    });
  }
}

export default RemoteLoggerHelper;
