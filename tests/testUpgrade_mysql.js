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
import MariadbManager from '../src/lib/rdbms/mariadb';

describe('Testing mysql upgrade', () => {
  it('Should return the correct version ', async () => {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    const dbManager = new MariadbManager({
      config: {
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME
      }
    });
    const client = dbManager.getClient();
    await client.open();
    dbManager.setClient(client);
    const row = await dbManager.getCurrentVersion();
    client.close();
    dbManager.close();
    assert.strictEqual(row.value, dbManager.dbVersion);
  });
});
