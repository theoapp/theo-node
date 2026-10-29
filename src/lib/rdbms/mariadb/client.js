// Copyright 2019 AuthKeys srl
// Copyright 2023 Fluidware srl
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import BaseClient from '../baseclient';

export default class MariadbClient extends BaseClient {
  // pool is a mysql2 Pool or PoolCluster (callback API)
  constructor(pool, { cluster = false, noDbPool = false, poolName = false } = {}) {
    super();
    this.pool = pool;
    this.cluster = cluster;
    this.noDbPool = noDbPool;
    this.poolName = poolName;
  }

  async getServerVersion() {
    const data = await this.all("show variables like 'version%'");
    let comment;
    let version;
    data.forEach(row => {
      if (row.Variable_name === 'version') {
        version = row.Value;
      } else if (row.Variable_name === 'version_comment') {
        comment = row.Value;
      }
    });
    if (!comment) {
      comment = 'Mysql';
    }
    return `${comment}, ${version}`;
  }

  async all(sql, params) {
    const [rows] = await this.conn.execute(sql, params);
    return rows;
  }

  async get(sql, params) {
    const [rows] = await this.conn.execute(sql, params);
    if (rows.length < 1) {
      return false;
    }
    return rows[0];
  }

  async run(sql, params) {
    await this.conn.execute(sql, params);
    return true;
  }

  async insert(sql, params) {
    const [results] = await this.conn.execute(sql, params);
    return results.insertId;
  }

  async update(sql, params) {
    const [results] = await this.conn.execute(sql, params);
    return results.affectedRows;
  }

  async delete(sql, params) {
    const [results] = await this.conn.execute(sql, params);
    return results.affectedRows;
  }

  async open() {
    const conn = await new Promise((resolve, reject) => {
      const cb = (err, c) => (err ? reject(err) : resolve(c));
      if (this.cluster) {
        this.pool.getConnection(`${this.poolName || 'rw'}*`, cb);
      } else {
        this.pool.getConnection(cb);
      }
    });
    this.conn = conn.promise();
    return true;
  }

  close() {
    if (this.conn) {
      if (this.noDbPool) {
        this.conn.destroy();
      } else {
        this.conn.release();
      }
      this.conn = undefined;
    }
  }
}
