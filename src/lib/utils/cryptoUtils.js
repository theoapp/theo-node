import crypto from 'crypto';

export const md5 = function(data) {
  return crypto
    .createHash('md5')
    .update(data)
    .digest('hex');
};
