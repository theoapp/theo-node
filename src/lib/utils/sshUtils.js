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

import sshpk from 'sshpk';
import { common_debug } from './logUtils';

/**
 * @return {string}
 */
export const SSHFingerprint = function(keyPub) {
  const key = sshpk.parseKey(keyPub, 'ssh');
  return key.fingerprint().toString();
};

export const getSSH2Comment = function(keyPub) {
  let comment = '';
  keyPub.split('\n').forEach(line => {
    if (line.toLowerCase().indexOf('comment:') === 0) {
      const _comment = line.substring(8).trim();
      if (_comment[0] === '"') {
        comment = _comment.substring(1, _comment.length - 1);
      } else {
        comment = _comment;
      }
    }
  });
  return comment;
};

export const getOpenSSHPublicKey = function(keyPub, signRequired) {
  keyPub = keyPub.trim();
  const key = sshpk.parseKey(keyPub);
  let openssh = key.toString('ssh');
  if (!openssh) {
    common_debug('Key %s is not a valid OpenSSH Public Key', keyPub);
    return false;
  }
  if (openssh !== keyPub) {
    if (signRequired) {
      throw new Error('You must sign an OpenSSH Public Key');
    }
    if (key.comment === '(unnamed)') {
      if (keyPub.indexOf('---- BEGIN SSH2 PUBLIC KEY ----') === 0) {
        key.comment = getSSH2Comment(keyPub);
        openssh = key.toString('ssh');
      }
    }
  }
  return openssh;
};
