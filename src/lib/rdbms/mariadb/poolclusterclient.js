import MariadbBaseClient from './baseclient';

class MariadbPoolClusterClient extends MariadbBaseClient {
  open() {
    return new Promise((resolve, reject) => {
      this.db.getConnection((this.pool || 'rw') + '*', (err, conn) => {
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
      this.db.releaseConnection(this.conn);
    } else {
      common_error('Called MariadbPoolClusterClient.close() but conn is undefined');
    }
  }
}

export default MariadbPoolClusterClient;
