import MariadbBaseClient from './baseclient';

class MariadbClusterClient extends MariadbBaseClient {
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
      this.conn.destroy();
    } else {
      common_error('Called MariadbPoolClusterClient.close() but conn is undefined');
    }
  }
}

export default MariadbClusterClient;
