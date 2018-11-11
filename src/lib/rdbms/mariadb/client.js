import BaseClient from '../baseclient';

class MariadbClient extends BaseClient {
  constructor(db) {
    super();
    this.db = db;
  }

  async open() {
    return new Promise((resolve, reject) => {
      this.db.getConnection((err, conn) => {
        if (err) {
          console.error('Unable to get connection!', err.message);
          reject(err);
          return;
        }
        this.conn = conn;
        resolve(true);
      });
    });
  }

  close() {
    this.db.releaseConnection(this.conn);
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

export default MariadbClient;
