import crypto from 'crypto';

export const md5 = function(data) {
  return hash('md5', data);
};

export const sha256 = function(data) {
  return hash('sha256', data);
};

export const hash = function(type, data) {
  return crypto
    .createHash(type)
    .update(data)
    .digest('hex');
};
