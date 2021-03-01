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
import { getRdbmsModule } from '../src/lib/rdbms/modules';
import SqliteManager from '../src/lib/rdbms/sqlite';
import MariadbManager from '../src/lib/rdbms/mariadb';
import { describe, it } from 'mocha';

describe('Testing rdbms', () => {
  describe('Testing getRdbmsModule', () => {
    it('Should return the SqliteManager class ', () => {
      const clazz = getRdbmsModule('sqlite');

      assert(clazz === SqliteManager);
    });

    it('Should return the MariadbManager class ', () => {
      const clazz = getRdbmsModule('mariadb');
      assert(clazz === MariadbManager);
    });

    it('Should return the MariadbManager class ', () => {
      const clazz = getRdbmsModule('mysql');
      assert(clazz === MariadbManager);
    });
  });
});
