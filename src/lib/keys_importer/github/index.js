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
