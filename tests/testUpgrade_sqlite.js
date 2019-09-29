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
import SqliteManager from '../src/lib/rdbms/sqlite';

describe('Testing sqlite upgrade', () => {
  it('Should return the correct version ', async () => {
    const dbManager = new SqliteManager({ storage: process.env.DB_STORAGE });
    const client = dbManager.getClient();
    dbManager.setClient(client);
    const row = await dbManager.getCurrentVersion();
    client.close();
    assert.strictEqual(row.value, dbManager.dbVersion);
  });
});
