// Copyright 2020 AuthKeys srl
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

let loadDbEnvSettings;
try {
  loadDbEnvSettings = require('@authkeys/mysql-connman').loadDbEnvSettings;
} catch (e) {
  loadDbEnvSettings = function(settings) {
    throw new Error(
      'loadDbEnvSettings not loaded. Are you using a specialized version of theo-node without mysql support?'
    );
  };
}
export const getLoadDbEnvSettings = function() {
  return loadDbEnvSettings;
};
