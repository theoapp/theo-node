import MariadbBaseClient from './poolclient';

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
}

export default MariadbPoolClusterClient;
