import sshpk from 'sshpk';
import fs from 'fs';
import { spawn } from 'child_process';

/**
 * @return {string}
 */
export const SSHFingerprint = function(keyPub) {
  const key = sshpk.parseKey(keyPub, 'ssh');
  return key.fingerprint().toString();
};

export const SSHKeygen = function(location, opts) {
  return new Promise((resolve, reject) => {
    opts || (opts = {});

    const pubLocation = location + '.pub';

    if (!opts.comment) opts.comment = '';
    if (!opts.password) opts.password = '';
    if (!opts.size) opts.size = '2048';

    const keygen = spawn('ssh-keygen', [
      '-t',
      'rsa',
      '-b',
      opts.size,
      '-C',
      opts.comment,
      '-N',
      opts.password,
      '-f',
      location
    ]);

    const { keep } = opts;

    const readKey = function() {
      fs.readFile(location, 'utf8', function(err, key) {
        if (err) {
          reject(err);
          return;
        }
        if (!keep) {
          fs.unlink(location, function(err) {
            if (err) return reject(err);
            readPubKey(key);
          });
        } else {
          readPubKey(key);
        }
      });
    };

    const readPubKey = function(key) {
      fs.readFile(pubLocation, 'utf8', function(err, pubKey) {
        if (err) {
          reject(err);
          return;
        }
        if (!keep) {
          fs.unlink(pubLocation, function(err) {
            if (err) return reject(err);
            key = key.toString();
            key = key.substring(0, key.lastIndexOf('\n')).trim();
            pubKey = pubKey.toString();
            pubKey = pubKey.substring(0, pubKey.lastIndexOf('\n')).trim();
            resolve({ key: key, pubKey: pubKey });
          });
        } else {
          resolve({ key: key, pubKey: pubKey });
        }
      });
    };

    keygen.on('exit', readKey);
  });
};
