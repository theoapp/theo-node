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
