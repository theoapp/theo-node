const fetch = require('node-fetch');

const execute = (method, path, data, headers = {}) => {
  const fetchOpts = {
    method,
    headers
  };
  const dataType = typeof data;
  if (dataType !== 'undefined') {
    if (dataType !== 'string') {
      try {
        data = JSON.stringify(data);
      } catch (e) {
        console.error('Failed to stringify', data);
        throw e;
      }
    }
    fetchOpts.body = data;
  }
  return fetch(path, fetchOpts).then(res => {
    if (res.status >= 400) {
      const error = new Error(res.statusText);
      error.http_response = res;
      throw error;
    }
    return res.json();
  });
};

export const http_get = (path, headers) => {
  return execute('GET', path, undefined, headers);
};

export const http_del = (path, data, headers) => {
  return execute('DELETE', path, data, headers);
};

export const http_put = (path, data, contentType) => {
  return execute('PUT', path, data, headers);
};

export const http_post = (path, data, headers) => {
  return execute('POST', path, data, headers);
};
