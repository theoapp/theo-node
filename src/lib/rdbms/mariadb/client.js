import MariadbBaseClient from './baseclient';
import { common_error } from '../../utils/logUtils';

class MariadbClient extends MariadbBaseClient {
  open() {
    return new Promise((resolve, reject) => {
      this.db.getConnection((err, conn) => {
        if (err) {
          reject(err);
          return;
        }
        this.conn = conn;
        if (!this.conn.execute) {
          this.conn.execute = this.conn.query;
        }
        resolve(true);
      });
    });
  }

  close() {
    if (this.conn) {
      this.conn.destroy();
    } else {
      common_error('Called MariadbPoolClient.close() but conn is undefined');
    }
  }
}

export default MariadbClient;
