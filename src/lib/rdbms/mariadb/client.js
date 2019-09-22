import MariadbPoolClient from './poolclient';

class MariadbClient extends MariadbPoolClient {
  close() {
    if (this.conn) {
      this.conn.destroy();
    }
  }
}

export default MariadbClient;
