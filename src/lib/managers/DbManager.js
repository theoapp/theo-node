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

class DbManager {
  constructor(options) {
    this.options = options;
  }

  getEngine() {
    throw new Error('Not implemented');
  }

  initDb() {
    throw new Error('Not implemented');
  }

  upgradeDb(fromVersion) {
    throw new Error('Not implemented');
  }

  getCurrentVersion() {
    throw new Error('Not implemented');
  }

  createVersionTable() {
    throw new Error('Not implemented');
  }

  flushDb() {
    throw new Error('Not implemented');
  }

  getClient(pool = false) {
    throw new Error('Not implemented');
  }

  setClient(client) {
    throw new Error('Not implemented');
  }

  close() {
    throw new Error('Not implemented');
  }
}

export default DbManager;
