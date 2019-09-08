import MariadbBaseClient from './baseclient';

class MariadbPoolClient extends MariadbBaseClient {
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
      this.conn.release();
    } else {
      common_error('Called MariadbClient.close() but conn is undefined');
    }
  }

  all(sql, params) {
    return new Promise((resolve, reject) => {
      this.conn.execute(sql, params, (err, rows) => {
        if (err) {
          return reject(err);
        }
        return resolve(rows);
      });
    });
  }

  get(sql, params) {
    return new Promise((resolve, reject) => {
      try {
        this.conn.execute(sql, params, (err, row) => {
          if (err) {
            return reject(err);
          }
          if (row.length < 1) return resolve(false);
          return resolve(row[0]);
        });
      } catch (err) {
        return reject(err);
      }
    });
  }

  run(sql, params) {
    return new Promise((resolve, reject) => {
      this.conn.execute(sql, params, err => {
        if (err) {
          return reject(err);
        }
        return resolve(true);
      });
    });
  }

  insert(sql, params) {
    return new Promise((resolve, reject) => {
      this.conn.execute(sql, params, function(err, results) {
        if (err) {
          reject(err);
          return;
        }
        resolve(results.insertId);
      });
    });
  }

  update(sql, params) {
    return new Promise((resolve, reject) => {
      this.conn.execute(sql, params, function(err, results) {
        if (err) {
          reject(err);
          return;
        }
        resolve(results.affectedRows);
      });
    });
  }

  delete(sql, params) {
    return new Promise((resolve, reject) => {
      this.conn.execute(sql, params, function(err, results) {
        if (err) {
          reject(err);
          return;
        }
        resolve(results.affectedRows);
      });
    });
  }
}

export default MariadbPoolClient;
