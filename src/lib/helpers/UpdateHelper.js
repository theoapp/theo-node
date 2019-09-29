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
import { common_info } from '../utils/logUtils';

class UpdateHelper {
  static _getHttpHeaders() {
    return {
      'User-Agent': packageJson.name + '/' + packageJson.version
    };
  }

  static checkUpdate = function(cb) {
    console.log('checkUpdate');
    const timeout = Math.floor(Math.random() * (60000 - 1000) + 1000);
    setTimeout(function() {
      http_get('https://update.theo.authkeys.io/version', UpdateHelper._getHttpHeaders())
        .then(version => {
          if (semver.gt(version, packageJson.version)) {
            common_info('\n\n\t!!! Update available: %s !!!\n', version);
          }
          if (cb) {
            cb(null, true);
          }
        })
        .catch(e => {
          cb(e);
        });
    }, timeout);
  };
}

export default UpdateHelper;
