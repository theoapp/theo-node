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

import assert from 'assert';
import {
  calculateDistance,
  mergeSSHOptions,
  parseKeySSHOptions,
  parseSSHOptions,
  renderSSHOptions
} from '../src/lib/utils/sshOptionsUtils';

describe('Testing SSH Options Utils', function() {
  describe('Test calculateDistance', function() {
    const host = 'wwwserver';
    const user = 'nobody';
    const matchLen = host.length + user.length;
    const data = [
      {
        permission: {
          host: 'wwwserver',
          user: 'nobody'
        },
        distance: 0
      },
      {
        permission: {
          host: '%',
          user: '%'
        },
        distance: 13
      },
      {
        permission: {
          host: 'wwwserver%',
          user: 'nobody%'
        },
        distance: 0
      },
      {
        permission: {
          host: 'www%',
          user: '%'
        },
        distance: 10
      }
    ];
    data.forEach((v, i) => {
      it(`should return a distance [${i}]`, function() {
        calculateDistance(matchLen, v.permission);
        assert.strictEqual(v.permission.distance, v.distance);
      });
    });
  });

  describe('Test parseSSHOptions', function() {
    ['', false, undefined].forEach((v, i) => {
      it(`should return false if ssh_options is empty [${i}]`, function() {
        const ret = parseSSHOptions({ ssh_options: v });
        assert.strictEqual(ret.ssh_options, false);
      });
    });
    [
      '{"from": ["10.10.10.1"],"no-user-rc": true}',
      '{"from": ["10.10.10.1","172.16.1.3"],"no-user-rc": true, "no-pty": true}'
    ].forEach((v, i) => {
      it(`should return an object if ssh_options is populated string [${i}]`, function() {
        const ret = parseSSHOptions({ ssh_options: v });
        assert.strictEqual(typeof ret.ssh_options, 'object');
      });
    });
  });

  describe('Test parseKeySSHOptions', function() {
    ['', false, undefined].forEach((v, i) => {
      it(`should return false if key_ssh_options is empty [${i}]`, function() {
        const ret = parseKeySSHOptions({ key_ssh_options: v });
        assert.strictEqual(ret.key_ssh_options, false);
      });
    });
    [
      '{"from": ["10.10.10.1"],"no-user-rc": true}',
      '{"from": ["10.10.10.1","172.16.1.3"],"no-user-rc": true, "no-pty": true}'
    ].forEach((v, i) => {
      it(`should return an object if key_ssh_options is populated string [${i}]`, function() {
        const ret = parseKeySSHOptions({ key_ssh_options: v });
        assert.strictEqual(typeof ret.key_ssh_options, 'object');
      });
    });
  });

  describe('Test mergeSSHOptions', function() {
    const data = [
      {
        a: {
          from: ['192.168.2.1']
        },
        b: false,
        ret: {
          from: ['192.168.2.1']
        }
      },
      {
        a: {
          from: ['192.168.2.1']
        },
        b: {},
        ret: {
          from: ['192.168.2.1']
        }
      },
      {
        a: false,
        b: {
          from: ['192.168.2.1']
        },
        ret: {
          from: ['192.168.2.1']
        }
      },
      {
        a: {},
        b: {
          from: ['192.168.2.1']
        },
        ret: {
          from: ['192.168.2.1']
        }
      },
      {
        a: {
          from: ['192.168.3.1']
        },
        b: {
          from: ['192.168.2.1']
        },
        ret: {
          from: ['192.168.3.1', '192.168.2.1']
        }
      },
      {
        a: {
          from: ['192.168.2.1']
        },
        b: {
          from: ['192.168.2.1']
        },
        ret: {
          from: ['192.168.2.1']
        }
      },
      {
        a: {
          from: ['192.168.3.1', '192.168.4.1']
        },
        b: {
          from: ['192.168.2.1']
        },
        ret: {
          from: ['192.168.3.1', '192.168.4.1', '192.168.2.1']
        }
      },
      {
        a: {
          from: ['192.168.3.1']
        },
        b: {
          'no-pty': true
        },
        ret: {
          from: ['192.168.3.1'],
          'no-pty': true
        }
      },
      {
        a: {
          from: ['192.168.3.1', '192.168.4.1'],
          'no-pty': true
        },
        b: {
          from: ['192.168.2.1'],
          permitopen: ['10.10.10.10:80']
        },
        ret: {
          from: ['192.168.3.1', '192.168.4.1', '192.168.2.1'],
          'no-pty': true,
          permitopen: ['10.10.10.10:80']
        }
      },
      {
        a: {
          from: ['192.168.3.1', '192.168.4.1'],
          'no-pty': true,
          permitopen: ['10.10.10.10:80']
        },
        b: {
          from: ['192.168.2.1']
        },
        ret: {
          from: ['192.168.3.1', '192.168.4.1', '192.168.2.1'],
          'no-pty': true,
          permitopen: ['10.10.10.10:80']
        }
      },
      {
        a: {
          from: ['192.168.3.1', '192.168.4.1'],
          'no-pty': true,
          permitopen: ['10.10.20.10:80']
        },
        b: {
          from: ['192.168.2.1'],
          permitopen: ['10.10.10.10:80']
        },
        ret: {
          from: ['192.168.3.1', '192.168.4.1', '192.168.2.1'],
          'no-pty': true,
          permitopen: ['10.10.20.10:80', '10.10.10.10:80']
        }
      },
      {
        a: {
          from: ['192.168.3.1', '192.168.4.1'],
          'no-pty': true,
          permitopen: ['10.10.20.10:80']
        },
        b: {
          environment: ['THEO_USER=macno'],
          from: ['192.168.2.1'],
          permitopen: ['10.10.10.10:80']
        },
        ret: {
          from: ['192.168.3.1', '192.168.4.1', '192.168.2.1'],
          'no-pty': true,
          environment: ['THEO_USER=macno'],
          permitopen: ['10.10.20.10:80', '10.10.10.10:80']
        }
      },
      {
        a: {
          from: ['192.168.3.1', '192.168.4.1'],
          'no-pty': true,
          environment: ['THEO_USER=macno'],
          permitopen: ['10.10.20.10:80']
        },
        b: {
          from: ['192.168.2.1'],
          permitopen: ['10.10.10.10:80']
        },
        ret: {
          from: ['192.168.3.1', '192.168.4.1', '192.168.2.1'],
          'no-pty': true,
          environment: ['THEO_USER=macno'],
          permitopen: ['10.10.20.10:80', '10.10.10.10:80']
        }
      },
      {
        a: {
          from: ['192.168.3.1', '192.168.4.1'],
          'no-pty': true,
          environment: ['ENV1=yyy'],
          permitopen: ['10.10.20.10:80']
        },
        b: {
          environment: ['ENV2=xxx'],
          from: ['192.168.2.1'],
          permitopen: ['10.10.10.10:80']
        },
        ret: {
          from: ['192.168.3.1', '192.168.4.1', '192.168.2.1'],
          'no-pty': true,
          environment: ['ENV1=yyy', 'ENV2=xxx'],
          permitopen: ['10.10.20.10:80', '10.10.10.10:80']
        }
      },
      {
        a: {
          from: ['192.168.3.1', '192.168.4.1'],
          'no-pty': true,
          environment: ['THEO_USER=macno'],
          permitopen: ['10.10.20.10:80']
        },
        b: {
          environment: ['THEO_USER=macno'],
          from: ['192.168.2.1'],
          permitopen: ['10.10.10.10:80']
        },
        ret: {
          from: ['192.168.3.1', '192.168.4.1', '192.168.2.1'],
          'no-pty': true,
          environment: ['THEO_USER=macno'],
          permitopen: ['10.10.20.10:80', '10.10.10.10:80']
        }
      },
      {
        a: {
          command: '/bin/bash'
        },
        b: {},
        ret: {
          command: '/bin/bash'
        }
      },
      {
        a: {},
        b: {
          command: '/bin/bash'
        },
        ret: {
          command: '/bin/bash'
        }
      },
      {
        a: { command: '/bin/sh' },
        b: {
          command: '/bin/bash'
        },
        ret: {
          command: '/bin/sh'
        }
      },
      {
        a: { 'no-agent-forwarding': true, 'no-port-forwarding': true },
        b: {
          'no-X11-forwarding': true,
          'no-user-rc': true
        },
        ret: {
          'no-agent-forwarding': true,
          'no-port-forwarding': true,
          'no-X11-forwarding': true,
          'no-user-rc': true
        }
      }
    ];
    data.forEach((o, i) => {
      it(`should return merged options [${i}]`, function() {
        const ret = mergeSSHOptions(o.a, o.b);
        assert.deepStrictEqual(ret, o.ret);
      });
    });
  });
  describe('Test renderSSHOptions', function() {
    const data = [
      {
        in: {
          from: ['192.168.2.1']
        },
        out: 'from="192.168.2.1"'
      },
      {
        in: {
          from: ['192.168.3.1', '192.168.2.1']
        },
        out: 'from="192.168.3.1,192.168.2.1"'
      },
      {
        in: {
          from: ['192.168.3.1', '192.168.4.1', '192.168.2.1']
        },
        out: 'from="192.168.3.1,192.168.4.1,192.168.2.1"'
      },
      {
        in: {
          from: ['192.168.3.1'],
          'no-pty': true
        },
        out: 'from="192.168.3.1",no-pty'
      },
      {
        in: {
          from: ['192.168.3.1', '192.168.4.1', '192.168.2.1'],
          'no-pty': true,
          permitopen: ['10.10.10.10:80']
        },
        out: 'from="192.168.3.1,192.168.4.1,192.168.2.1",permitopen="10.10.10.10:80",no-pty'
      },
      {
        in: {
          from: ['192.168.3.1', '192.168.4.1', '192.168.2.1'],
          'no-pty': true,
          permitopen: ['10.10.20.10:80', '10.10.10.10:80']
        },
        out: 'from="192.168.3.1,192.168.4.1,192.168.2.1",permitopen="10.10.20.10:80,10.10.10.10:80",no-pty'
      },
      {
        in: {
          from: ['192.168.3.1', '192.168.4.1', '192.168.2.1'],
          'no-pty': true,
          environment: ['THEO_USER=macno'],
          permitopen: ['10.10.20.10:80', '10.10.10.10:80']
        },
        out:
          'from="192.168.3.1,192.168.4.1,192.168.2.1",permitopen="10.10.20.10:80,10.10.10.10:80",environment="THEO_USER=macno",no-pty'
      },
      {
        in: {
          from: ['192.168.3.1', '192.168.4.1', '192.168.2.1'],
          'no-pty': true,
          environment: ['ENV1=yyy', 'ENV2=xxx'],
          permitopen: ['10.10.20.10:80', '10.10.10.10:80']
        },
        out:
          'from="192.168.3.1,192.168.4.1,192.168.2.1",permitopen="10.10.20.10:80,10.10.10.10:80",environment="ENV1=yyy,ENV2=xxx",no-pty'
      },
      {
        in: {
          command: '/bin/sh'
        },
        out: 'command="/bin/sh"'
      },
      {
        in: {
          from: ['192.168.3.1', '192.168.4.1', '192.168.2.1'],
          'no-pty': true,
          command: '/bin/sh',
          environment: ['ENV1=yyy', 'ENV2=xxx'],
          permitopen: ['10.10.20.10:80', '10.10.10.10:80']
        },
        out:
          'from="192.168.3.1,192.168.4.1,192.168.2.1",permitopen="10.10.20.10:80,10.10.10.10:80",environment="ENV1=yyy,ENV2=xxx",command="/bin/sh",no-pty'
      },
      {
        in: {
          'no-agent-forwarding': true,
          'no-port-forwarding': true,
          'no-X11-forwarding': true,
          'no-user-rc': true
        },
        out: 'no-agent-forwarding,no-port-forwarding,no-user-rc,no-X11-forwarding'
      },
      {
        in: {
          from: []
        },
        out: ''
      }
    ];
    data.forEach((o, i) => {
      it(`should return rendered options [${i}]`, function() {
        const ret = renderSSHOptions(o.in);
        assert.strictEqual(ret, o.out);
      });
    });
  });
});
