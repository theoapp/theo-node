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

describe('Testing logUtils', () => {
  describe('Testing LOG_LEVEL ERROR ', () => {
    it('common_debug Should not call the logger function', () => {
      let check = false;
      initLogger(ERROR, (...args) => {
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
      initLogger(ERROR, (...args) => {
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
      initLogger(ERROR, (...args) => {
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
      initLogger(ERROR, (...args) => {
        check = true;
        assert.strictEqual(args[1], 'ERROR');
        assert.strictEqual(args[3], message);
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
      initLogger(WARN, (...args) => {
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
      initLogger(WARN, (...args) => {
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
      initLogger(WARN, (...args) => {
        check = true;
      });
      common_warn('Lost in space 3');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_error Should call the logger function', () => {
      let check = false;
      initLogger(WARN, (...args) => {
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
      initLogger(INFO, (...args) => {
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
      initLogger(INFO, (...args) => {
        check = true;
      });
      common_info('Lost in space 2');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_warn Should call the logger function', () => {
      let check = false;
      initLogger(INFO, (...args) => {
        check = true;
      });
      common_warn('Lost in space 3');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_error Should call the logger function', () => {
      let check = false;
      initLogger(INFO, (...args) => {
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
      initLogger(DEBUG, (...args) => {
        check = true;
      });
      common_debug('Lost in space');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_info Should call the logger function', () => {
      let check = false;
      initLogger(DEBUG, (...args) => {
        check = true;
      });
      common_info('Lost in space 2');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_warn Should call the logger function', () => {
      let check = false;
      initLogger(DEBUG, (...args) => {
        check = true;
      });
      common_warn('Lost in space 3');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_error Should call the logger function', () => {
      let check = false;
      initLogger(DEBUG, (...args) => {
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
      initLogger((...args) => {
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
      initLogger((...args) => {
        check = true;
      });
      common_info('Lost in space 2');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_warn Should call the logger function', () => {
      let check = false;
      initLogger((...args) => {
        check = true;
      });
      common_warn('Lost in space 3');
      setImmediate(() => {
        assert.strictEqual(check, true);
      });
    });
    it('common_error Should call the logger function', () => {
      let check = false;
      initLogger((...args) => {
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
      console.error('');
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
