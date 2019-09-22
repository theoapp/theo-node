import BaseClient from '../baseclient';

class MariadbPoolClient extends BaseClient {
  db;

  conn;

  pool;

  constructor(db, pool = false) {
    super();
    this.db = db;
    this.pool = pool;
  }

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
    }
  }

  async getServerVersion() {
    const data = await this.all("show variables like 'version%'");
    let comment;
    let version;
    data.forEach(row => {
      if (row.Variable_name === 'version') {
        version = row.Value;
      } else {
        if (row.Variable_name === 'version_comment') {
          comment = row.Value;
        }
      }
    });
    if (!comment) {
      comment = 'Mysql';
    }
    return `${comment}, ${version}`;
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
