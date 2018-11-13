import { adminCreateGroup, adminCreateGroupAccount, adminGetAccount } from '../lib/helpers/AdminHelper';

export const runV7migrationMariaDb = async client => {
  const sql = 'select distinct account_id from permissions where group_id is null';
  const accountsToFix = await client.all(sql);
  for (let i = 0; i < accountsToFix.length; i++) {
    const account = await adminGetAccount(client, accountsToFix[i].account_id);
    const group_id = await adminCreateGroup(client, { name: account.email }, true);
    await adminCreateGroupAccount(db, group_id, account_id);
    const updateSql = 'update permissions set group_id = ? where account_id = ? ';
    await client.run(updateSql, [group_id, account.id]);
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
    const account = await adminGetAccount(client, accountsToFix[i].account_id);
    const group_id = await adminCreateGroup(client, { name: account.email }, true);
    await adminCreateGroupAccount(db, group_id, account_id);
    const updateSql = 'update permissions set group_id = ? where account_id = ? ';
    await client.run(updateSql, [group_id, account.id]);
  }
};
