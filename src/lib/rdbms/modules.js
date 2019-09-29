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

const modules = {};

try {
  const Mariadb = require('./mariadb');
  modules.mariadb = Mariadb.default;
  modules.mysql = Mariadb.default;
} catch (e) {
  console.error('failed to load mariadb');
}
try {
  const Sqlite = require('./sqlite');
  modules.sqlite = Sqlite.default;
} catch (e) {
  console.error('failed to load sqlite');
}

export const getRdbmsModule = name => {
  return modules[name];
};
