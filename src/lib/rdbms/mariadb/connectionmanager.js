import { common_debug, common_error } from '../../utils/logUtils';
import fs from 'fs';
import MariadbClusterClient from './clusterclient';
import MariadbPoolClusterClient from './poolclusterclient';
import MariadbClient from './client';
import MariadbPoolClient from './poolclient';

let mysql;
try {
  /*
  As for 2019/09/22 mysql2 and mysql packages do not support caching-sha2-password auth plugin (default in Mysql Server >= 8.04)
  If you need it, you can add a dependency in package.json pointing to "git+https://git@github.com/nwoltman/node-mysql.git#caching-sha2-password"
  and set MYSQL_LIB to it.
  Ex:
  "dependencies": {
    ...,
    "mysql-cache-sha2": ""git+https://git@github.com/nwoltman/node-mysql.git#caching-sha2-password"",
  },
  MYSQL_LIB=mysql-cache-sha2 npm start
   */
  mysql = require(process.env.MYSQL_LIB || 'mysql2');
} catch (e) {
  // package not installed
}

const noPoolDb =
  process.env.DB_NOPOOL &&
  (process.env.DB_NOPOOL === '1' || process.env.DB_NOPOOL === 'true' || process.env.DB_NOPOOL === 'on');

const connectionLimit = process.env.NODE_ENV === 'production' ? 10 : 4;
const connectionQueueLimit = process.env.NODE_ENV === 'production' ? 10 : 4;

class ConnectionManager {
  DbClientClass;

  pool;

  constructor(settings) {
    common_debug('new MariaDB ConnectionManager', settings);
    const { host, port, username, password, database, cluster, ssl_ca } = settings;
    const defaultOptions = {
      host: host,
      user: username,
      password,
      database,
      port: port || 3306,
      waitForConnections: true,
      connectionLimit,
      queueLimit: connectionQueueLimit
    };
    if (ssl_ca) {
      defaultOptions.ssl = {
        // key: fs.readFileSync('./certs/client-key.pem'),
        // cert: fs.readFileSync('./certs/client-cert.pem')
        ca: fs.readFileSync(ssl_ca)
      };
    }
    let options;
    if (settings.options) {
      options = Object.assign(defaultOptions, settings.options);
    } else {
      options = defaultOptions;
    }
    if (cluster) {
      common_debug('ConnectionManager cluster pool mode', cluster);
      this.pool = mysql.createPoolCluster({
        canRetry: true
      });
      const nodes = {};
      this.pool.on('remove', id => {
        common_error('Node %s removed!!!', id);
        setTimeout(() => {
          this.pool.add(id, nodes[id]);
          common_debug('ConnectionManager cluster pool added', id);
        }, 5000);
      });
      cluster.rw.forEach((node, i) => {
        const config = Object.assign({}, defaultOptions, {
          host: node.host,
          port: node.port
        });
        this.pool.add('rw' + i, config);
        nodes['rw' + i] = config;
      });
      cluster.ro.forEach((node, i) => {
        const config = Object.assign({}, defaultOptions, {
          host: node.host,
          port: node.port
        });
        this.pool.add('ro' + i, config);
        nodes['ro' + i] = config;
      });
      this.DbClientClass = noPoolDb ? MariadbClusterClient : MariadbPoolClusterClient;
    } else {
      this.pool = mysql.createPool(options);
      this.DbClientClass = noPoolDb ? MariadbClient : MariadbPoolClient;
    }
  }

  getClient(poolName = false) {
    return new this.DbClientClass(this.pool, poolName);
  }
}

export default ConnectionManager;
