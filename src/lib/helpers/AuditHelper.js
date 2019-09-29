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

import packageJson from '../../../package';
import { http_post } from '../utils/httpUtils';
import { common_error, common_info } from '../utils/logUtils';

const { LOG_AUDIT_CONSOLE, LOG_AUDIT_URL, LOG_AUDIT_TOKEN } = process.env;

const auditEnable = (LOG_AUDIT_CONSOLE && LOG_AUDIT_CONSOLE === 'true') || LOG_AUDIT_URL;

const getHTTPHeaders = function() {
  if (!LOG_AUDIT_URL) return;
  const headers = {
    'User-Agent': packageJson.name + '/' + packageJson.version,
    'Content-type': 'application/json'
  };
  if (LOG_AUDIT_TOKEN) {
    headers.Authorization = 'Bearer ' + LOG_AUDIT_TOKEN;
  }
  return headers;
};

const auditHTTPHeaders = getHTTPHeaders();

class AuditHelper {
  constructor(req) {
    this.req = req;
  }

  log(context, action, entity, data) {
    if (!auditEnable) {
      return;
    }
    const source_ip = this.req.headers['x-forwarded-for']
      ? this.req.headers['x-forwarded-for'].split(',')[0].trim()
      : this.req.connection.remoteAddress;
    const user_agent = this.req.userAgent();
    const { auth_token: author } = this.req;
    const obj = {
      ts: new Date().getTime(),
      source_ip,
      user_agent,
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
        http_post(LOG_AUDIT_URL, obj, auditHTTPHeaders).catch(e => {
          common_error('Unable to send audit log', JSON.stringify(obj), e.message);
        });
      });
    }
  }
}

export default AuditHelper;
