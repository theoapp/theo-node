// Copyright 2019 AuthKeys srl
// Copyright 2023 Fluidware srl
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

import { DEFAULT_INSTANCE_NAME } from '../lib/utils/instanceUtils';
import { exp, imp } from '../lib/helpers/ImpExpHelper';
import DbHelper from '../lib/helpers/DbHelper';
import { md5 } from '../lib/utils/cryptoUtils';

export async function runV18migration(dbManager) {
  // add instance column to tables:
  try {
    const tables = ['accounts', 'tgroups', 'public_keys', 'permissions'];
    for (const table of tables) {
      console.log('alter ', table);
      await dbManager.client.run(`alter table ${table} add instance varchar(32)`);
      await dbManager.client.run(`update ${table} set instance = ?`, [DEFAULT_INSTANCE_NAME]);
    }
    console.log('get tokens');
    const tokens = await dbManager.client.all('select token, assignee, type, created_at from auth_tokens');
    console.log('pre exp');
    const dump = await exp(dbManager.client);
    const dh = DbHelper();
    console.log('pre _flush');
    await dh._flush(dbManager.client);

    for (const tokenRow of tokens) {
      console.log('insert token ', tokenRow);
      const { token, assignee, type, created_at } = tokenRow;
      await dbManager.client.insert(
        'insert into auth_tokens (instance, token, assignee, type, created_at) values (?, ?, ?, ?, ?)',
        [DEFAULT_INSTANCE_NAME, md5(`${DEFAULT_INSTANCE_NAME}:${token}`), assignee, type, created_at]
      );
    }
    console.log('pre imp');
    await imp(dbManager.client, dump);
  } catch (e) {
    console.error(e);
    throw e;
  }
}
