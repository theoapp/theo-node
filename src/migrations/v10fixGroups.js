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

export const runV10migrationMariaDb = async client => {
  await client.run(
    'insert into tgroups (id, name, active, updated_at, created_at) select id, name, active, updated_at, created_at from groups'
  );
  const dropFKSql = 'alter table groups_accounts DROP FOREIGN KEY groups_accounts_ibfk_1';
  await client.run(dropFKSql);
  const createFKSql =
    'alter table groups_accounts add CONSTRAINT groups_accounts_group_id FOREIGN KEY(group_id) REFERENCES tgroups (id) ON DELETE CASCADE';
  await client.run(createFKSql);

  const dropFKSql2 = 'alter table permissions DROP FOREIGN KEY permissions_group_id';
  await client.run(dropFKSql2);
  const createFKSql2 =
    'alter table permissions add CONSTRAINT permissions_group_id FOREIGN KEY(group_id) REFERENCES tgroups (id) ON DELETE CASCADE';
  await client.run(createFKSql2);
  await client.run('drop table groups');
};
