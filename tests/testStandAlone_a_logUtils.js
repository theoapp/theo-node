import assert from 'assert';
import sinon from 'sinon';
import {
  common_debug,
  common_info,
  common_warn,
  ERROR,
  WARN,
  initLogger,
  common_error,
  INFO,
  DEBUG
} from '../src/lib/utils/logUtils';
import { mockDateToISOString } from './Mocks';

describe('Testing logUtils', () => {
  let originalDateToISOString;
  beforeEach(function() {
    originalDateToISOString = Date.prototype.toISOString;
    // eslint-disable-next-line no-extend-native
    Date.prototype.toISOString = mockDateToISOString;
  });

  afterEach(function() {
    // eslint-disable-next-line no-extend-native
    Date.prototype.toISOString = originalDateToISOString;
  });

  describe('Testing LOG_LEVEL ERROR ', () => {
    it('common_debug Should not call the logger function', () => {
      let check = false;
      initLogger(ERROR, (type, date, msg) => {
        check = true;
        assert.fail(new Error('DEBUG < ERROR'));
      });
      common_debug('Lost in space');
      setImmediate(() => {
        assert.strictEqual(check, false);
      });
    });
    it('common_info Should not call the logger function', () => {
      let check = false;
      initLogger(ERROR, (type, date, msg) => {
        check = true;
        assert.fail(new Error('INFO < ERROR'));
      });
      common_info('Lost in space 2');
      setImmediate(() => {
        assert.strictEqual(check, false);
      });
    });
    it('common_warn Should not call the logger function', () => {
      let check = false;
      initLogger(ERROR, (type, date, msg) => {
        check = true;
        assert.fail(new Error('WARN < ERROR'));
      });
      common_warn('Lost in space 3');
      setImmediate(() => {
        assert.strictEqual(check, false);
      });
    });
    it('common_error Should call the logger function', () => {
      let check = false;
      const message = 'Lost in space 4';
      initLogger(ERROR, (type, date, msg) => {
        check = true;
        assert.strictEqual(type, 'ERROR');
        assert.strictEqual(date, '2016-05-04T11:27:29.717Z'); // 4th May 2016 11:27:29,717
        assert.strictEqual(msg, message);
      });
      common_error(message);
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
  });

  describe('Testing LOG_LEVEL WARN ', () => {
    it('common_debug Should not call the logger function', () => {
      let check = false;
      initLogger(WARN, (type, date, msg) => {
        check = true;
        assert.fail(new Error('DEBUG < WARN'));
      });
      common_debug('Lost in space');
      setImmediate(() => {
        assert.strictEqual(check, false);
      });
    });
    it('common_info Should not call the logger function', () => {
      let check = false;
      initLogger(WARN, (type, date, msg) => {
        check = true;
        assert.fail(new Error('INFO < WARN'));
      });
      common_info('Lost in space 2');
      setImmediate(() => {
        assert.strictEqual(check, false);
      });
    });
    it('common_warn Should call the logger function', () => {
      let check = false;
      initLogger(WARN, (type, date, msg) => {
        check = true;
      });
      common_warn('Lost in space 3');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_error Should call the logger function', () => {
      let check = false;
      initLogger(WARN, (type, date, msg) => {
        check = true;
      });
      common_error('Lost in space 4');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
  });

  describe('Testing LOG_LEVEL INFO ', () => {
    it('common_debug Should not call the logger function', () => {
      let check = false;
      initLogger(INFO, (type, date, msg) => {
        check = true;
        assert.fail(new Error('DEBUG < INFO'));
      });
      common_debug('Lost in space');
      setImmediate(() => {
        assert.strictEqual(check, false);
      });
    });
    it('common_info Should call the logger function', () => {
      let check = false;
      initLogger(INFO, (type, date, msg) => {
        check = true;
      });
      common_info('Lost in space 2');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_warn Should call the logger function', () => {
      let check = false;
      initLogger(INFO, (type, date, msg) => {
        check = true;
      });
      common_warn('Lost in space 3');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_error Should call the logger function', () => {
      let check = false;
      initLogger(INFO, (type, date, msg) => {
        check = true;
      });
      common_error('Lost in space 4');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
  });

  describe('Testing LOG_LEVEL DEBUG ', () => {
    it('common_debug Should not call the logger function', () => {
      let check = false;
      initLogger(DEBUG, (type, date, msg) => {
        check = true;
      });
      common_debug('Lost in space');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_info Should call the logger function', () => {
      let check = false;
      initLogger(DEBUG, (type, date, msg) => {
        check = true;
      });
      common_info('Lost in space 2');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_warn Should call the logger function', () => {
      let check = false;
      initLogger(DEBUG, (type, date, msg) => {
        check = true;
      });
      common_warn('Lost in space 3');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_error Should call the logger function', () => {
      let check = false;
      initLogger(DEBUG, (type, date, msg) => {
        check = true;
      });
      common_error('Lost in space 4');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
  });

  describe('Testing LOG_LEVEL default (INFO) ', () => {
    it('common_debug Should not call the logger function', () => {
      let check = false;
      initLogger((type, date, msg) => {
        check = true;
        assert.fail(new Error('DEBUG < INFO'));
      });
      common_debug('Lost in space');
      setImmediate(() => {
        assert.strictEqual(check, false);
      });
    });
    it('common_info Should call the logger function', () => {
      let check = false;
      initLogger((type, date, msg) => {
        check = true;
      });
      common_info('Lost in space 2');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_warn Should call the logger function', () => {
      let check = false;
      initLogger((type, date, msg) => {
        check = true;
      });
      common_warn('Lost in space 3');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_error Should call the logger function', () => {
      let check = false;
      initLogger((type, date, msg) => {
        check = true;
      });
      common_error('Lost in space 4');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
  });

  describe('Testing LOG_LEVEL default (INFO, console.log) ', () => {
    let spy;
    beforeEach(() => {
      spy = sinon.spy(console, 'log');
    });

    it('common_debug Should not call the logger function', () => {
      initLogger();
      common_debug('Lost in space');
      assert(spy.notCalled);
      spy.restore();
    });
    it('common_info Should call the logger function', () => {
      initLogger();
      common_info('Lost in space 2');
      assert(spy.called);
      spy.restore();
    });
    it('common_warn Should call the logger function', () => {
      initLogger();
      common_warn('Lost in space 3');
      assert(spy.called);
      spy.restore();
    });
    it('common_error Should call the logger function', () => {
      initLogger();
      common_error('Lost in space 4');
      assert(spy.called);
      spy.restore();
    });
  });
});
