import { common_error } from '../../utils/logUtils';
import MariadbPoolClusterClient from './poolclusterclient';

class MariadbClusterClient extends MariadbPoolClusterClient {
  close() {
    if (this.conn) {
      this.conn.destroy();
    } else {
      common_error('Called MariadbClient.close() but conn is undefined');
    }
  }
}

export default MariadbClusterClient;
