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
