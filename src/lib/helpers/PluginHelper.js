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

export const loadPlugins = async () => {
  try {
    const files = await getDirFiles(PLUGIN_PATH);
    if (files) {
      for (let i = 0; i < files.length; i++) {
        try {
          await loadPlugin(files[i]);
        } catch (e) {
          console.error('Failed to load plugin %s', files[i], e.message);
        }
      }
    }
  } catch (err) {
    console.error('Unable to initialize plugins', err.message);
  }
};
