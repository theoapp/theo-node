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
