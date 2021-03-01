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
import ServerMock from 'mock-http-server';
import { http_get, http_post } from '../src/lib/utils/httpUtils';
import { describe, it, beforeEach, afterEach } from 'mocha';

describe('Testing HTTPUtils', () => {
  let httpPort;
  const server = new ServerMock({ host: 'localhost', port: 0 });
  beforeEach(function (done) {
    server.start(() => {
      httpPort = server.getHttpPort();
      done();
    });
  });

  afterEach(function (done) {
    server.stop(done);
  });

  describe('Testing http_get', () => {
    it('Should return a json ', async () => {
      server.on({
        method: 'GET',
        path: '/whatever',
        reply: {
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: '{"ret":200}'
        }
      });
      const json = await http_get(`http://localhost:${httpPort}/whatever`);
      assert.strictEqual(json.ret, 200);
    });
    it('Should throw a Error with code ', async () => {
      server.on({
        method: 'GET',
        path: '/whatever',
        reply: {
          status: 400,
          headers: { 'content-type': 'application/json' },
          body: '{"ret":400}'
        }
      });
      try {
        await http_get(`http://localhost:${httpPort}/whatever`);
        assert.fail();
      } catch (e) {
        assert.strictEqual(e.code, 400);
      }
    });
  });

  describe('Testing http_post', () => {
    it('Should return a json ', async () => {
      server.on({
        method: 'POST',
        path: '/whatever',
        reply: {
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: '{"ret":200}'
        }
      });
      const json = await http_post(`http://localhost:${httpPort}/whatever`);
      assert.strictEqual(json.ret, 200);
    });

    it('Should return a json ', async () => {
      let bodyCheck;
      server.on({
        method: 'POST',
        path: '/whatever',
        filter: req => {
          bodyCheck = req.body.test === true;
          return true;
        },
        reply: {
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: '{"ret":200}'
        }
      });
      const json = await http_post(`http://localhost:${httpPort}/whatever`, { test: true });
      assert.strictEqual(json.ret, 200);
      assert.strictEqual(bodyCheck, true);
    });

    it('Should return a json ', async () => {
      let bodyCheck = false;
      server.on({
        method: 'POST',
        path: '/whatever',
        filter: req => {
          bodyCheck = req.body.test === true;
          return true;
        },
        reply: {
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: '{"ret":200}'
        }
      });
      const json = await http_post(
        `http://localhost:${httpPort}/whatever`,
        { test: true },
        { 'Content-Type': 'application/json' }
      );
      assert.strictEqual(json.ret, 200);
      assert.strictEqual(bodyCheck, true);
    });

    it('Should throw a Error with code ', async () => {
      server.on({
        method: 'POST',
        path: '/whatever',
        reply: {
          status: 401,
          headers: { 'content-type': 'application/json' },
          body: '{"ret":400}'
        }
      });
      try {
        await http_post(`http://localhost:${httpPort}/whatever`);
        assert.fail();
      } catch (e) {
        assert.strictEqual(e.code, 401);
      }
    });

    it('Should throw a Error ', async () => {
      server.on({
        method: 'POST',
        path: '/whatever',
        reply: {
          status: 401,
          headers: { 'content-type': 'application/json' },
          body: '{"ret":400}'
        }
      });
      try {
        await http_post(`http://localhost:${httpPort}/whatever`, 'fake-json');
        assert.fail();
      } catch (e) {
        assert(e instanceof Error);
      }
    });
  });
});
