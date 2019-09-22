import assert from 'assert';
import ServerMock from 'mock-http-server';
import { http_get, http_post } from '../src/lib/utils/httpUtils';

describe('Testing HTTPUtils', () => {
  let httpPort;
  const server = new ServerMock({ host: 'localhost', port: 0 });
  beforeEach(function(done) {
    server.start(() => {
      httpPort = server.getHttpPort();
      done();
    });
  });

  afterEach(function(done) {
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
