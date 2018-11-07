import Sqlite from './sqlite';
import Mariadb from './mariadb';

const modules = {
  sqlite: Sqlite,
  mariadb: Mariadb,
  mysql: Mariadb
};

export const getRdbmsModule = name => {
  return modules[name];
};
