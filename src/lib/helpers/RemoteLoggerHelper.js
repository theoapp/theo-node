import packageJson from '../../../package';
import { http_post } from '../utils/httpUtils';

const { LOG_AUTH_KEYS_URL, LOG_AUTH_KEYS_TOKEN } = process.env;

class RemoteLoggerHelper {
  static getHttpHeaders() {
    return {
      'User-Agent': packageJson.name + '/' + packageJson.version,
      Authorization: 'Bearer ' + LOG_AUTH_KEYS_TOKEN,
      'Content-type': 'application/json'
    };
  }

  static log(data) {
    if (!LOG_AUTH_KEYS_URL) return;
    setImmediate(() => {
      http_post(LOG_AUTH_KEYS_URL, data, this.getHttpHeaders()).cache(e => {
        console.error('Failed to POST log: %s', e.message, data);
      });
    });
  }
}

export default RemoteLoggerHelper;
