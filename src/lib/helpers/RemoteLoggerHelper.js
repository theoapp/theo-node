import packageJson from '../../../package';
import { http_post } from '../utils/httpUtils';

class RemoteLoggerHelper {
  static getHttpHeaders() {
    return {
      'User-Agent': packageJson.name + '/' + packageJson.version,
      Authorization: 'Bearer ' + process.env.LOG_AUTH_KEYS_TOKEN,
      'Content-type': 'application/json'
    };
  }

  static async log(data) {
    try {
      await http_post(process.env.LOG_AUTH_KEYS_URL, data, this.getHttpHeaders());
    } catch (e) {
      console.error('Failed to POST log: %s', e.message, data);
    }
  }
}

export default RemoteLoggerHelper;
