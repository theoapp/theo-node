// Copyright 2019 AuthKeys srl
// Copyright 2023 Fluidware srl
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
import http from 'http';
import { dbMiddleware } from '../src/lib/middlewares/DbMiddleware';
import { describe, it, beforeEach, afterEach } from 'mocha';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// A pool that hands out a connection after `openDelay` ms and counts what is not given back
class FakeDm {
  openDelay = 0;
  opened = 0;
  released = 0;

  getClient() {
    const dm = this;
    return {
      conn: undefined,
      open() {
        dm.opened++;
        return new Promise(resolve =>
          setTimeout(() => {
            this.conn = true;
            resolve(true);
          }, dm.openDelay)
        );
      },
      close() {
        if (this.conn) {
          dm.released++;
          this.conn = undefined;
        }
      }
    };
  }

  get held() {
    return this.opened - this.released;
  }
}

const request = function (port, method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ port, method, path }, res => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
};

describe('Testing DbMiddleware', () => {
  let server;
  let port;
  let dm;
  let handled;
  let acquireTimeout;

  beforeEach(done => {
    dm = new FakeDm();
    handled = 0;
    acquireTimeout = 0;
    server = http.createServer((req, res) => {
      // the bits of express the middleware uses
      req.path = new URL(req.url, 'http://localhost').pathname;
      req.dm = dm;
      res.status = code => {
        res.statusCode = code;
        return res;
      };
      res.json = obj => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(obj));
      };
      dbMiddleware(acquireTimeout)(req, res, () => {
        handled++;
        res.json({ db: !!req.db });
      });
    });
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterEach(done => {
    server.close(done);
  });

  it('Should release the connection after the response', async () => {
    const res = await request(port, 'GET', '/accounts');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(JSON.parse(res.body), { db: true });
    await sleep(20);
    assert.strictEqual(dm.opened, 1);
    assert.strictEqual(dm.held, 0);
  });

  it('Should not open a connection for urls that do not need it', async () => {
    await request(port, 'GET', '/');
    await request(port, 'GET', '/authorized_keys/host/user');
    await request(port, 'GET', '/uptime');
    await request(port, 'HEAD', '/accounts');
    assert.strictEqual(handled, 4);
    assert.strictEqual(dm.opened, 0);
  });

  it('Should release the connection when the client goes away while waiting for it', async () => {
    dm.openDelay = 150;
    const req = http.request({ port, method: 'GET', path: '/accounts' });
    req.on('error', () => {});
    req.end();
    await sleep(30);
    req.destroy();
    await sleep(250);
    assert.strictEqual(dm.opened, 1);
    assert.strictEqual(dm.held, 0);
    assert.strictEqual(handled, 0);
  });

  it('Should answer 500 when no connection is available in time and release it when it arrives', async () => {
    dm.openDelay = 200;
    acquireTimeout = 50;
    const res = await request(port, 'GET', '/accounts');
    assert.strictEqual(res.status, 500);
    assert.strictEqual(handled, 0);
    assert.strictEqual(dm.held, 1);
    await sleep(250);
    assert.strictEqual(dm.held, 0);
  });
});
