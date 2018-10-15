import KeysImporterManager from '../../managers/KeysImporterManager';
import { http_get } from '../../utils/httpUtils';

class GitlabImporter extends KeysImporterManager {
  async get(username) {
    try {
      const res = await http_get(`https://gitlab.com/api/v4/users?username=${username}`);
      if (res && res.length === 1) {
        const keys = await http_get(`https://gitlab.com/api/v4/users/${res[0].id}/keys`);
        return keys.map(key => {
          return key.key;
        });
      } else {
        return [];
      }
    } catch (err) {
      console.error('Failed to import from gitlab', err);
    }
  }
}

export default GitlabImporter;
