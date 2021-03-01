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
import { http_get } from '../utils/httpUtils';
import semver from 'semver';
import { common_debug, common_warn } from '../utils/logUtils';

const CHECK_UPDATE_URL = 'https://update.theo.authkeys.io/version';

class UpdateHelper {
  static _getHttpHeaders() {
    return {
      'User-Agent': packageJson.name + '/' + packageJson.version,
      Accept: 'application/json'
    };
  }

  static checkUpdate = function (quick = false) {
    const timeout = quick ? 0 : Math.floor(Math.random() * (60000 - 1000) + 1000);
    if (!quick) {
      common_debug('checkUpdate in %s ms', timeout);
    }
    setTimeout(function () {
      http_get(CHECK_UPDATE_URL, UpdateHelper._getHttpHeaders())
        .then(data => {
          if (!data) {
            common_warn('Failed to check new version, empty response');
            return;
          }
          let version;
          let securityUpdate = false;
          if (typeof data === 'object') {
            version = data.version;
            securityUpdate = data.security_update;
          } else {
            version = data;
          }
          if (semver.gt(version, packageJson.version)) {
            common_warn('');
            common_warn('   !!! %s Update available: %s !!!', securityUpdate ? 'Security' : '', version);
            common_warn('');
          }
        })
        .catch(e => {
          common_warn('Failed to check new version:', e.message);
        });
    }, timeout);
  };
}

export default UpdateHelper;
