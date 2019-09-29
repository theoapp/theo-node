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

import AuthTokenManager from '../managers/AuthTokenManager';

let _instance;

class AppHelper {
  constructor(settings) {
    this.settings = settings;
  }

  getSettings(root) {
    return root ? this.settings[root] : this.settings;
  }

  async loadAuthTokens(db) {
    const atm = new AuthTokenManager(db);
    const tokens = await atm.getAll();
    this.reloadAuthToken(tokens);
    return true;
  }

  reloadAuthToken(tokens) {
    this.settings.admin.token = undefined;
    this.settings.admin.tokens = tokens.admins || {};
    if (tokens.admin) {
      const { token, assignee } = AuthTokenManager.getTokenAssignee(tokens.admin, true);
      this.settings.admin.tokens[token] = assignee;
    }
    this.settings.client.tokens = tokens.clients;
  }
}

const getInstance = settings => {
  if (!_instance) {
    if (!settings) {
      throw new Error('AppHelper needs to be initialized with settings');
    }
    _instance = new AppHelper(settings);
  } else {
    if (settings) {
      _instance.settings = settings;
    }
  }
  return _instance;
};

export default getInstance;
