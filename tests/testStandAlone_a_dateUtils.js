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
import { getTimestampFromISO8601, millisecondsToStr } from '../src/lib/utils/dateUtils';

const dates = [
  {
    str: '',
    ts: 0
  },
  {
    str: '2019-09-22T16:47:06Z',
    ts: 1569170826000
  },
  {
    ts: 1263170826123,
    str: '2010-01-11T00:47:06.123Z'
  }
];

const mills = [
  {
    ms: 800,
    str: 'less than a second'
  },
  {
    ms: 1300,
    str: '1 second'
  },
  {
    ms: 60000,
    str: '1 minute'
  },
  {
    ms: 120000,
    str: '2 minutes'
  },
  {
    ms: 5400,
    str: '5 seconds'
  },
  {
    ms: 3600000,
    str: '1 hour'
  },
  {
    ms: 7300000,
    str: '2 hours'
  },
  {
    ms: 3600000 * 36,
    str: '1 day'
  },
  {
    ms: 86400000 * 62,
    str: '62 days'
  },
  {
    ms: 86400000 * 365,
    str: '1 year'
  }
];

describe('Testing dateUtils', () => {
  describe('Testing getTimestampFromISO8601', () => {
    dates.forEach(item => {
      it('Should return the correct timestamp for string ' + item.str, () => {
        assert.strictEqual(getTimestampFromISO8601(item.str), item.ts);
      });
    });
    dates.forEach(item => {
      it('Should return the correct timestamp for Date ' + item.str, () => {
        assert.strictEqual(getTimestampFromISO8601(new Date(item.ts)), item.ts);
      });
    });
    it('Should throw an error for invalid string', () => {
      assert.throws(() => {
        getTimestampFromISO8601('asdasdasasd');
      });
    });
    it('Should throw an error for invalid object', () => {
      assert.throws(() => {
        getTimestampFromISO8601({
          getTime: () => {
            return 'a';
          }
        });
      });
    });
    it('Should throw an error for invalid object', () => {
      assert.throws(() => {
        getTimestampFromISO8601({});
      });
    });
  });
  describe('Testing millisecondsToStr', () => {
    mills.forEach(item => {
      it('Should return the correct string for ' + item.ms, () => {
        assert.strictEqual(millisecondsToStr(item.ms), item.str);
      });
    });
  });
});
