import sshpk from 'sshpk';

/**
 * @return {string}
 */
export const SSHFingerprint = function(keyPub) {
  const key = sshpk.parseKey(keyPub, 'ssh');
  return key.fingerprint().toString();
};
