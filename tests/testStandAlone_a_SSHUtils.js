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

import { getOpenSSHPublicKey, getSSH2Comment, SSHFingerprint } from '../src/lib/utils/sshUtils';
import assert from 'assert';

const keys = [
  {
    k:
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCgSW1myQsEQd5nAz8eJjn93xXqNgJj0p9gbj5L7M71ITH9Ti7NzMoUZdn0wMGgI7PLb5sxlrv0/m05pRkmG0qoQaUuZACS4xMSBSjkb+z0KcdAZgE7f4slKQzBarfugNsWpLWEKV6NTn2JqV4gXBDTSDsbhXXllbVeUSyuKo7d8KlAov4GZKnCe025hCh1fJScHdWJvHouCQx2LUkzcayL3fxImEs+no9GTN7Hp81BrBUcLq3LWTcJpMxYoiLjO0lZaEwhR/NPof0mwqvnmgRYT2Bk3scAGiGma0pHpIBjvY1A5FlnCEBEgT0//XoSe5QGVorhoffhrdMA6EOh1fOR/Zwatx35xZG9cHWRBkgn+3DBYq9orVxbjra4Tf2HXVJXGB9cFn/y7nOyLALXCdvk4/jpcLvOKVUcXJ6NMpCV4ELLLj7/b4XuW5s8THEvU4wc31fnfH03sU70rr24zvQ47vxVMJU72kT25uuQYRepZ/sMh5MaP19ZV7zXhUv4dgg/z7Me8i4HNFsrdmTNlFmk1jXnVPQ2ICrFEr04VzIFPsgUS+0/R2Ab8Oi14WUPWAcNem5C2oVzgMztuOVZL2SSfu/1t4kEgxR+ei/RqRu2HR/g1/8JJKFNYpG2B4kQ21vuXQnet4aoMxOGxACL+6+V1MGxNejbp9p+BDuci9PSYw== macno@habanero',
    fp: 'SHA256:jVnggyF95YXyPgNpeeMA++T8Oko+FhDKpUGoKlRV0z0'
  },
  {
    k:
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCcHb8ko2Hrd/QKWvem7UP26XXuNUWnD2hm/X//Q4wznPwj2sUQCEpuFtn6+9w2hWD/wWlZjCq30i+X+D9rF5SBN5vVdxPn4RNArmMcevtbTrBt7nBCA/kiNJW0pinLJa/45/RC3TejZB+vtEKgrQiV5MDPucUQzGlfIFXZMxtn2KfYNcsUTwtzQlEK+gW94DnxsxH3kZM+FWl1+ra9XJ9urJSoizQPq1ALKuc8YH/Rx6+qezBhMmCJrw4dIRt+epyENqt09I6A6k9BgpOn7qg3eC4bQT/zwqvJH7eD0Q4fHaMuj+JPewhpIo6EclcLLkvuCmz7i6R2y7eHrFqPScEBanMBiX7Re+qznNaXTDWZUZ+VlFMGbZWsVTrq4h0/WpmE6HTCEIZH8qF25CnRTTMhsxmwTjLdj6uDFVksedqXZICT0wfR89jXT0WiC38Uyk2hPIBj0+yplDmzQyvWabc+xgqxaqJ7ofxJtQFP2xPel7Md6D0beWKv1hLGFScKfBBFS4JM+Xt6p4RBjdxXYiQ5Vlh2CON+xeBlflqUSCKkEYqnADV+PvAInq0fSbxJ1aKmVTst4LqLTL2PpAqdc0x0ieTGXr4hNosriJkXyPyuh3rsl3JOjUDmOA7480yf71W4pVj31PK0wvfs862a2yaDMgYGbdyAx56Ha+M2IP9uOw==',
    fp: 'SHA256:nzfiS3UxNnfffvF48FrTN7cTWIDUT8P/ymxFID5q4tY'
  }
];

const invalid_keys = [
  'fake',
  '',
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCcHb8ko2Hrd/QKWvem7UP26XXuNUWnD2hm/X//Q4wznPwj2s test@host'
];

const valid_keys = [
  {
    k: `---- BEGIN SSH2 PUBLIC KEY ----
Comment: "usern@hostrc"
AAAAB3NzaC1yc2EAAAABJQAAAQEAlBoHzKTp9Al4nA6AN2y1Lw2geuvvUn1CJw2e
gYGmOmoZvl9kYjc0VRu7xR2NbwapgwNRSmB/7p2gXKsAyzQH1FIV2wc8CG7Ve4px
Cjzbqa6fNVJyq1JTKmCaVG/m0qtSSWCMuU40xsfYfN9mOVYL7rG4E1BXZetPCo4R
VDuljdLr0S97fow0CxdmbOVHU0CsZgff6KdaGHOZKTFpQ5bstSRAu6tK4QuowT44
nKijfc3u79vD+UzI32nQIPWvHXK5JNpeWCkZlll+4BbhAYgrFd3Yuvi/9wO/MdcF
JPynHFDyk1dudUznyoY2JBdMqvsG0eQ5ZEppDyvsXR9aB2+UUw==
---- END SSH2 PUBLIC KEY ----`,
    s: `ssh-rsa AAAAB3NzaC1yc2EAAAABJQAAAQEAlBoHzKTp9Al4nA6AN2y1Lw2geuvvUn1CJw2egYGmOmoZvl9kYjc0VRu7xR2NbwapgwNRSmB/7p2gXKsAyzQH1FIV2wc8CG7Ve4pxCjzbqa6fNVJyq1JTKmCaVG/m0qtSSWCMuU40xsfYfN9mOVYL7rG4E1BXZetPCo4RVDuljdLr0S97fow0CxdmbOVHU0CsZgff6KdaGHOZKTFpQ5bstSRAu6tK4QuowT44nKijfc3u79vD+UzI32nQIPWvHXK5JNpeWCkZlll+4BbhAYgrFd3Yuvi/9wO/MdcFJPynHFDyk1dudUznyoY2JBdMqvsG0eQ5ZEppDyvsXR9aB2+UUw== usern@hostrc`
  },
  {
    k: `ssh-rsa AAAAB3NzaC1yc2EAAAABJQAAAQEAqIr9zeWOhGmL6kPmo5pqInlbR41NW/R9cfCR
b3PvasmOIJCZ5BBjlqmok3sBDVkwMvkOqYGkqhOceRzGoh9sTZsEMCgXs7LsRhA7
jjTxkqolwunn7OQ1DDHYdDFG61g0Mjs1WjvEd9lYeUwGF5ARGALxV+OEDTD/zi4Q
IKp5TjGKBoSGBLcU+KSfPcN4+vKMUBdoHMVBFIeXLTBeTzmtbGkg+q7bspPso4Kt
CHN0d7TQ7rBSgPSXgdkzXDcH0cfz3UV6fOG8wpfpxj3PVNXoF7sGFOARcEhYt65W
gzOsqCDwx8aS8MqO6JxWBvWRTRp1+tvoawMCYeksryiWfJT/JQ== mdiaz@smartlis`,
    s: `ssh-rsa AAAAB3NzaC1yc2EAAAABJQAAAQEAqIr9zeWOhGmL6kPmo5pqInlbR41NW/R9cfCRb3PvasmOIJCZ5BBjlqmok3sBDVkwMvkOqYGkqhOceRzGoh9sTZsEMCgXs7LsRhA7jjTxkqolwunn7OQ1DDHYdDFG61g0Mjs1WjvEd9lYeUwGF5ARGALxV+OEDTD/zi4QIKp5TjGKBoSGBLcU+KSfPcN4+vKMUBdoHMVBFIeXLTBeTzmtbGkg+q7bspPso4KtCHN0d7TQ7rBSgPSXgdkzXDcH0cfz3UV6fOG8wpfpxj3PVNXoF7sGFOARcEhYt65WgzOsqCDwx8aS8MqO6JxWBvWRTRp1+tvoawMCYeksryiWfJT/JQ== mdiaz@smartlis`
  }
];

const SSH2Comments = [
  {
    k: `---- BEGIN SSH2 PUBLIC KEY ----
AAAAB3NzaC1yc2EAAAABJQAAAQEAlBoHzKTp9Al4nA6AN2y1Lw2geuvvUn1CJw2e
gYGmOmoZvl9kYjc0VRu7xR2NbwapgwNRSmB/7p2gXKsAyzQH1FIV2wc8CG7Ve4px
Cjzbqa6fNVJyq1JTKmCaVG/m0qtSSWCMuU40xsfYfN9mOVYL7rG4E1BXZetPCo4R
VDuljdLr0S97fow0CxdmbOVHU0CsZgff6KdaGHOZKTFpQ5bstSRAu6tK4QuowT44
nKijfc3u79vD+UzI32nQIPWvHXK5JNpeWCkZlll+4BbhAYgrFd3Yuvi/9wO/MdcF
JPynHFDyk1dudUznyoY2JBdMqvsG0eQ5ZEppDyvsXR9aB2+UUw==
---- END SSH2 PUBLIC KEY ----`,
    c: ''
  },
  {
    k: `---- BEGIN SSH2 PUBLIC KEY ----
Comment: "usern@hostrc"
AAAAB3NzaC1yc2EAAAABJQAAAQEAlBoHzKTp9Al4nA6AN2y1Lw2geuvvUn1CJw2e
gYGmOmoZvl9kYjc0VRu7xR2NbwapgwNRSmB/7p2gXKsAyzQH1FIV2wc8CG7Ve4px
Cjzbqa6fNVJyq1JTKmCaVG/m0qtSSWCMuU40xsfYfN9mOVYL7rG4E1BXZetPCo4R
VDuljdLr0S97fow0CxdmbOVHU0CsZgff6KdaGHOZKTFpQ5bstSRAu6tK4QuowT44
nKijfc3u79vD+UzI32nQIPWvHXK5JNpeWCkZlll+4BbhAYgrFd3Yuvi/9wO/MdcF
JPynHFDyk1dudUznyoY2JBdMqvsG0eQ5ZEppDyvsXR9aB2+UUw==
---- END SSH2 PUBLIC KEY ----`,
    c: 'usern@hostrc'
  },
  {
    k: `---- BEGIN SSH2 PUBLIC KEY ----
Comment: usern@hostrc
AAAAB3NzaC1yc2EAAAABJQAAAQEAlBoHzKTp9Al4nA6AN2y1Lw2geuvvUn1CJw2e
gYGmOmoZvl9kYjc0VRu7xR2NbwapgwNRSmB/7p2gXKsAyzQH1FIV2wc8CG7Ve4px
Cjzbqa6fNVJyq1JTKmCaVG/m0qtSSWCMuU40xsfYfN9mOVYL7rG4E1BXZetPCo4R
VDuljdLr0S97fow0CxdmbOVHU0CsZgff6KdaGHOZKTFpQ5bstSRAu6tK4QuowT44
nKijfc3u79vD+UzI32nQIPWvHXK5JNpeWCkZlll+4BbhAYgrFd3Yuvi/9wO/MdcF
JPynHFDyk1dudUznyoY2JBdMqvsG0eQ5ZEppDyvsXR9aB2+UUw==
---- END SSH2 PUBLIC KEY ----`,
    c: 'usern@hostrc'
  },
  {
    k: `---- BEGIN SSH2 PUBLIC KEY ----
Comment: "mdiaz@smartlis"
AAAAB3NzaC1yc2EAAAABJQAAAQEAqIr9zeWOhGmL6kPmo5pqInlbR41NW/R9cfCR
b3PvasmOIJCZ5BBjlqmok3sBDVkwMvkOqYGkqhOceRzGoh9sTZsEMCgXs7LsRhA7
jjTxkqolwunn7OQ1DDHYdDFG61g0Mjs1WjvEd9lYeUwGF5ARGALxV+OEDTD/zi4Q
IKp5TjGKBoSGBLcU+KSfPcN4+vKMUBdoHMVBFIeXLTBeTzmtbGkg+q7bspPso4Kt
CHN0d7TQ7rBSgPSXgdkzXDcH0cfz3UV6fOG8wpfpxj3PVNXoF7sGFOARcEhYt65W
gzOsqCDwx8aS8MqO6JxWBvWRTRp1+tvoawMCYeksryiWfJT/JQ==
---- END SSH2 PUBLIC KEY ----`,
    c: 'mdiaz@smartlis'
  },
  {
    k: `---- BEGIN SSH2 PUBLIC KEY ----
Comment: mdiaz@smartlis
AAAAB3NzaC1yc2EAAAABJQAAAQEAqIr9zeWOhGmL6kPmo5pqInlbR41NW/R9cfCR
b3PvasmOIJCZ5BBjlqmok3sBDVkwMvkOqYGkqhOceRzGoh9sTZsEMCgXs7LsRhA7
jjTxkqolwunn7OQ1DDHYdDFG61g0Mjs1WjvEd9lYeUwGF5ARGALxV+OEDTD/zi4Q
IKp5TjGKBoSGBLcU+KSfPcN4+vKMUBdoHMVBFIeXLTBeTzmtbGkg+q7bspPso4Kt
CHN0d7TQ7rBSgPSXgdkzXDcH0cfz3UV6fOG8wpfpxj3PVNXoF7sGFOARcEhYt65W
gzOsqCDwx8aS8MqO6JxWBvWRTRp1+tvoawMCYeksryiWfJT/JQ==
---- END SSH2 PUBLIC KEY ----`,
    c: 'mdiaz@smartlis'
  }
];
describe('Testing SSHUtils', function() {
  describe('Test getSSH2Comment', function() {
    it('should return right comment', function() {
      for (let i = 0; i < SSH2Comments.length; i++) {
        const comment = getSSH2Comment(SSH2Comments[i].k);
        assert.strictEqual(comment, SSH2Comments[i].c);
      }
    });
  });
  describe('Test SSHPublicKeyCheck', function() {
    it('Should return false with invalid keys', function() {
      for (let i = 0; i < invalid_keys.length; i++) {
        const valid = getOpenSSHPublicKey(invalid_keys[i]);
        assert.strictEqual(valid, false);
      }
    });
    it('Should return true with valid keys', function() {
      for (let i = 0; i < valid_keys.length; i++) {
        const opensshFormat = getOpenSSHPublicKey(valid_keys[i].k);
        assert.strictEqual(opensshFormat, valid_keys[i].s);
      }
    });
  });
  describe('SSHFingerprint', function() {
    for (let i = 0; i < keys.length; i++) {
      it('should return the correct fingerprint', function() {
        const fp = SSHFingerprint(keys[i].k);
        assert.strictEqual(fp, keys[i].fp);
      });
    }
  });
});
