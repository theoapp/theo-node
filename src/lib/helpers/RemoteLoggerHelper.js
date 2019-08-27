import packageJson from '../../../package';
import { http_post } from '../utils/httpUtils';
import { common_error } from '../utils/logUtils';

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
      http_post(LOG_AUTH_KEYS_URL, data, this.getHttpHeaders()).catch(e => {
        common_error('Failed to POST log: %s', e.message, data);
      });
    });
  }
}

export default RemoteLoggerHelper;
