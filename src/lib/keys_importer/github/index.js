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

import KeysImporterManager from '../../managers/KeysImporterManager';
import { http_get } from '../../utils/httpUtils';

class GithubImporter extends KeysImporterManager {
  async get(username) {
    try {
      const keys = await http_get(`https://api.github.com/users/${username}/keys`, {
        Accept: 'application/vnd.github.v3+json'
      });
      return keys.map(key => {
        return key.key;
      });
    } catch (err) {
      console.error('Failed to import from github', err);
    }
  }
}

export default GithubImporter;
