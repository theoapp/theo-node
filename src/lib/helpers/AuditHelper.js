import packageJson from '../../../package';
import { http_post } from '../utils/httpUtils';

const { LOG_AUDIT_URL, LOG_AUDIT_TOKEN } = process.env;

class AuditHelper {
  static getHttpHeaders() {
    return {
      'User-Agent': packageJson.name + '/' + packageJson.version,
      Authorization: 'Bearer ' + LOG_AUDIT_TOKEN,
      'Content-type': 'application/json'
    };
  }

  static log(token, context, action, data) {
    if (!LOG_AUDIT_URL) return;
    if (!token) {
      try {
        throw new Error('Called AuditHelper.log without token');
      } catch (e) {
        console.error(e.message, e);
      }
    }
    const obj = {
      ts: new Date().getTime(),
      token,
      context,
      action,
      data
    };
    setImmediate(() => {
      http_post(LOG_AUDIT_URL, obj, this.getHttpHeaders()).cache(e => {
        console.e('Unable to send audit log', obj, e.message);
      });
    });
  }
}

export default AuditHelper;
