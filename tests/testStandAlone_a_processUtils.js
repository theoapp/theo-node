import assert from 'assert';
import { setTimeoutPromise } from '../src/lib/utils/processUtils';

describe('Testing processUtils', () => {
  describe('Testing setTimeoutPromise', () => {
    it('Should return a promise ', done => {
      const timeout = 500;
      const obj = setTimeoutPromise(timeout);
      assert(obj instanceof Promise);
      let checked = false;
      obj.then(() => {
        checked = true;
      });
      assert.strictEqual(checked, false);
      setTimeout(() => {
        assert.strictEqual(checked, true);
        done();
      }, timeout);
    });
  });
});
