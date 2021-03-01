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

import { adminCreateGroup, adminCreateGroupAccount } from '../lib/helpers/AdminHelper';

export const runV7migrationMariaDb = async client => {
  const sql = 'select distinct account_id from permissions where group_id is null';
  const accountsToFix = await client.all(sql);
  for (let i = 0; i < accountsToFix.length; i++) {
    const sqlAccount = 'select email from accounts where id = ?';
    const account_id = accountsToFix[i].account_id;
    const account = await client.get(sqlAccount, [account_id]);
    const group_id = await adminCreateGroup(client, { name: account.email }, 'internal_db_upgrade', true);
    await adminCreateGroupAccount(client, group_id, account_id);
    const updateSql = 'update permissions set group_id = ? where account_id = ? ';
    await client.run(updateSql, [group_id, account_id]);
  }
  try {
    const dropFKSql = 'alter table permissions DROP FOREIGN KEY permissions_account_id';
    await client.run(dropFKSql);
  } catch (e) {
    const dropFKSql = 'alter table permissions DROP FOREIGN KEY permissions_ibfk_2';
    await client.run(dropFKSql);
  }
  const dropSql = 'alter table permissions drop column account_id';
  await client.run(dropSql);
};

export const runV7migrationSqliteDb = async client => {
  const sql = 'select distinct account_id from permissions where group_id is null';
  const accountsToFix = await client.all(sql);
  for (let i = 0; i < accountsToFix.length; i++) {
    const account_id = accountsToFix[i].account_id;
    const sqlAccount = 'select email from accounts where id = ?';
    const account = await client.get(sqlAccount, [account_id]);
    console.log('Creating group ', account.email);
    const group_id = await adminCreateGroup(client, { name: account.email }, 'internal_db_upgrade', true);
    console.log('Associating group %s with account %s', group_id, account_id);
    await adminCreateGroupAccount(client, group_id, account_id);
    console.log('Setting permissions to group %s from account %s', group_id, account_id);
    const updateSql = 'update permissions set group_id = ? where account_id = ? ';
    await client.run(updateSql, [group_id, account_id]);
  }
};
