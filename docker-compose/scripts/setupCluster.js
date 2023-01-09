const dbPass = 'ex4mple';
const clusterName = 'devCluster';

try {
  print('Setting up InnoDB cluster...\n');
  shell.connect('root@mysql-server-1:3306', dbPass);
  const cluster = dba.createCluster(clusterName);
  print('Adding instances to the cluster.');
  cluster.addInstance({ user: 'root', host: 'mysql-server-2', password: dbPass });
  print('.');
  cluster.addInstance({ user: 'root', host: 'mysql-server-3', password: dbPass });
  print('.\nInstances successfully added to the cluster.');
  print('\nInnoDB cluster deployed successfully.\n');
} catch (e) {
  print('\nThe InnoDB cluster could not be created.\n\nError: ' + e.message + '\n');
  process.exit(1);
}
