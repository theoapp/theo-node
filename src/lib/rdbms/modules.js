const modules = {};

try {
  const Mariadb = require('./mariadb');
  modules.mariadb = Mariadb.default;
  modules.mysql = Mariadb.default;
} catch (e) {
  console.error('failed to load mariadb');
}
try {
  const Sqlite = require('./sqlite');
  modules.sqlite = Sqlite.default;
} catch (e) {
  console.error('failed to load sqlite');
}

export const getRdbmsModule = name => {
  return modules[name];
};
