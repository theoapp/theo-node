import packageJson from '../../../package';
import { http_post } from '../utils/httpUtils';
import { common_error, common_info } from '../utils/logUtils';

const { LOG_AUDIT_CONSOLE, LOG_AUDIT_URL, LOG_AUDIT_TOKEN } = process.env;

const auditEnable = (LOG_AUDIT_CONSOLE && LOG_AUDIT_CONSOLE === 'true') || LOG_AUDIT_URL;

class AuditHelper {
  static getHttpHeaders() {
    const headers = {
      'User-Agent': packageJson.name + '/' + packageJson.version,
      'Content-type': 'application/json'
    };
    if (LOG_AUDIT_TOKEN) {
      headers.Authorization = 'Bearer ' + LOG_AUDIT_TOKEN;
    }
    return headers;
  }

  static log(author, context, action, entity, data) {
    if (!auditEnable) {
      return;
    }
    if (!author) {
      try {
        // FIXME remove try/catch when audit functions are fully implemented
        throw new Error('Called AuditHelper.log without author');
      } catch (e) {
        console.error(e.message, e);
      }
    }
    const obj = {
      ts: new Date().getTime(),
      author,
      context,
      action,
      entity,
      data
    };
    if (LOG_AUDIT_CONSOLE && LOG_AUDIT_CONSOLE === 'true') {
      setImmediate(() => {
        common_info('[AUDIT]', JSON.stringify(obj));
      });
      return;
    }
    if (LOG_AUDIT_URL) {
      setImmediate(() => {
        http_post(LOG_AUDIT_URL, obj, this.getHttpHeaders()).cache(e => {
          common_error('Unable to send audit log', JSON.stringify(obj), e.message);
        });
      });
    }
  }
}

export default AuditHelper;
