// Copyright 2019 AuthKeys srl
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
import { Client } from 'pg';
import BaseClient from '../baseclient';

// const regrep = /([=><\s])(\?)/g;
const regrepPh = /\?/g;
const regrepUser = /user/g;

export const convertToPSSyntax = function convertToPSsyntax(sql) {
  let c = 0;
  const replacer = function () {
    c++;
    return `$${c}`;
  };
  return sql.replace(regrepPh, replacer).replace(regrepUser, 'osuser');
};

const cleanUserRow = function (row) {
  row.user = row.osuser;
  delete row.osuser;
  return row;
};
export default class PostgresClient extends BaseClient {
  constructor(config) {
    super();
    this.client = new Client(config);
  }

  getServerVersion() {
    return 'Postgres';
  }

  query(sql, params) {
    const fsql = convertToPSSyntax(sql);
    /*
    if (params) {
      params = params.map(v => {
        if (typeof v === 'boolean') {
          console.error('using boolean in ', sql, v);
          return v ? 1 : 0;
        }
        return v;
      });
    }
     */
    return this.client.query(fsql, params);
  }

  async all(sql, params) {
    const ret = await this.query(sql, params);
    if (ret && ret.rows) {
      if (sql.indexOf('user') > 0) {
        return ret.rows.map(row => {
          return cleanUserRow(row);
        });
      }
      return ret.rows;
    }
    return [];
  }

  async get(sql, params) {
    const ret = await this.query(sql, params);
    if (ret && ret.rows && ret.rows.length === 1) {
      if (sql.indexOf('user') > 0) {
        return cleanUserRow(ret.rows[0]);
      }
      return ret.rows[0];
    }
    return null;
  }

  async run(sql, params) {
    await this.query(sql, params);
    return true;
  }

  async insert(sql, params) {
    if (sql.toLowerCase().indexOf('into auth_tokens') < 0) {
      sql += ' returning id';
    }
    const ret = await this.query(sql, params);
    if (ret && ret.rows && ret.rows.length === 1) {
      return ret.rows[0].id;
    }
    return -1;
  }

  async update(sql, params) {
    const ret = await this.query(sql, params);
    return ret.rowCount;
  }

  async delete(sql, params) {
    const ret = await this.query(sql, params);
    return ret.rowCount;
  }

  async open() {
    // console.log('\n\nCLIENT.OPEN\n\n');
    await this.client.connect();
    return this.client;
  }

  close() {
    // console.log('\n\nCLIENT.CLOSE\n\n');
    return this.client.end();
  }
}
