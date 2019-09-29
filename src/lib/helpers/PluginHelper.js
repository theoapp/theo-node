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

import path from 'path';
import { getDirFiles } from '../utils/fsUtils';
import EventHelper from './EventHelper';

const PLUGIN_PATH = 'plugins';

const loadPlugin = async name => {
  const plugin = require(path.join(path.resolve(PLUGIN_PATH), name));
  if (plugin) {
    plugin.init(EventHelper);
  }
};

export const loadPlugins = async plugins => {
  const _plugins = plugins.split(',');
  try {
    const files = await getDirFiles(PLUGIN_PATH);
    if (files) {
      for (let i = 0; i < files.length; i++) {
        if (_plugins.indexOf(files[i]) >= 0) {
          try {
            await loadPlugin(files[i]);
          } catch (e) {
            console.error('[ %s ] Failed to load plugin %s:', new Date().toISOString(), files[i], e.message);
          }
        }
      }
    }
  } catch (err) {
    console.error('[ %s ] Unable to initialize plugins', new Date().toISOString(), err.message);
  }
};
