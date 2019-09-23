import assert from 'assert';
import MariadbManager from '../src/lib/rdbms/mariadb';

describe('Testing mysql upgrade', () => {
  it('Should return the correct version ', async () => {
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    const dbManager = new MariadbManager({
      host: DB_HOST,
      username: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
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
