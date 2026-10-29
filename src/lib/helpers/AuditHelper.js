// Copyright 2019 AuthKeys srl
// Copyright 2023 Fluidware srl
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
import { getInstance } from '../utils/instanceUtils';
import { LOG_AUDIT_CONSOLE, LOG_AUDIT_TOKEN, LOG_AUDIT_URL } from '../../const';
import { getLogger } from '@fluidware-it/saddlebag';

const auditEnable = LOG_AUDIT_CONSOLE || LOG_AUDIT_URL;

const getHTTPHeaders = function () {
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
    const source_ip = this.req.ip;
    const user_agent = this.req.headers['user-agent'] || 'unknown';
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
    if (LOG_AUDIT_CONSOLE) {
      setImmediate(() => {
        getLogger().info({ audit: obj }, 'AUDIT');
      });
      return;
    }
    if (LOG_AUDIT_URL) {
      setImmediate(() => {
        http_post(LOG_AUDIT_URL, obj, { ...auditHTTPHeaders, 'x-instance-code': getInstance() }).catch(e => {
          getLogger().error({ audit: obj, error_message: e.message }, 'Unable to send audit log');
        });
      });
    }
  }
}

export default AuditHelper;
