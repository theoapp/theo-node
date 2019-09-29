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

const fetch = require('node-fetch');

const execute = (method, path, data, headers = {}) => {
  const fetchOpts = {
    method,
    headers
  };
  const dataType = typeof data;
  if (dataType !== 'undefined') {
    if (dataType !== 'string') {
      data = JSON.stringify(data);
      if (!fetchOpts.headers['Content-Type']) {
        fetchOpts.headers['Content-Type'] = 'application/json';
      }
    }
    fetchOpts.body = data;
  }
  return fetch(path, fetchOpts).then(res => {
    if (res.status >= 400) {
      const error = new Error(res.statusText);
      error.code = res.status;
      error.http_response = res;
      throw error;
    }
    return res.json();
  });
};

export const http_get = (path, headers) => {
  return execute('GET', path, undefined, headers);
};

export const http_post = (path, data, headers) => {
  return execute('POST', path, data, headers);
};
