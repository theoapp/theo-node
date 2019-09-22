import assert from 'assert';
import { getRdbmsModule } from '../src/lib/rdbms/modules';
import SqliteManager from '../src/lib/rdbms/sqlite';
import MariadbManager from '../src/lib/rdbms/mariadb';

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
