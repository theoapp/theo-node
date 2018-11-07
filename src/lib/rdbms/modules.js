import Sqlite from './sqlite';

const modules = {
  sqlite: Sqlite
};

export const getRdbmsModule = name => {
  return modules[name];
};
