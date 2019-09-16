import MariadbBaseClient from './baseclient';
import { common_error } from '../../utils/logUtils';

class MariadbPoolClient extends MariadbBaseClient {
  open() {
    return new Promise((resolve, reject) => {
      this.db.getConnection((err, conn) => {
        if (err) {
          reject(err);
          return;
        }
        this.conn = conn;
        resolve(true);
      });
    });
  }

  close() {
    if (this.conn) {
      this.conn.release();
    } else {
      common_error('Called MariadbPoolClient.close() but conn is undefined');
    }
  }
}

export default MariadbPoolClient;
