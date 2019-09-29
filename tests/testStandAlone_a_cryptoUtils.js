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
import { md5, sha256 } from '../src/lib/utils/cryptoUtils';

const hashes = {
  md5: [
    {
      string: 'ciao',
      hash: '6e6bc4e49dd477ebc98ef4046c067b5f'
    },
    {
      string: 'not so very long sentence',
      hash: 'ff8848ba4fcbea3b321ed15e34bf6b62'
    }
  ],
  sha256: [
    {
      string: 'ciao',
      hash: 'b133a0c0e9bee3be20163d2ad31d6248db292aa6dcb1ee087a2aa50e0fc75ae2'
    },
    {
      string: 'not so very long sentence',
      hash: 'a99c57a961087361bbcd1c89f4667d3d81675eea30527c0f3cfcf81f4a8b53db'
    }
  ]
};

describe('Testing cryptoUtils', () => {
  describe('Testing md5', () => {
    hashes.md5.forEach(item => {
      it('Should return the correct md5 hex hash for ' + item.string, () => {
        assert.strictEqual(md5(item.string), item.hash);
      });
    });
  });
  describe('Testing sha256', () => {
    hashes.sha256.forEach(item => {
      it('Should return the correct md5 hex hash for ' + item.string, () => {
        assert.strictEqual(sha256(item.string), item.hash);
      });
    });
  });
});
