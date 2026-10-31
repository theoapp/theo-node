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

// node:sqlite refuses to bind undefined and Date: bind them as sqlite3 did (NULL and epoch millis)
const toParams = params => {
  if (!params) {
    return [];
  }
  return params.map(p => {
    if (p === undefined) {
      return null;
    }
    if (p instanceof Date) {
      return p.getTime();
    }
    return p;
  });
};

// node:sqlite rows have a null prototype
const toRow = row => (row ? { ...row } : row);

class SqliteClient extends BaseClient {
  constructor(db) {
    super();
    this.db = db;
  }

  getServerVersion() {
    return 'DB sqlite';
  }

  async all(sql, params) {
    return this.db
      .prepare(sql)
      .all(...toParams(params))
      .map(toRow);
  }

  async get(sql, params) {
    return toRow(this.db.prepare(sql).get(...toParams(params)));
  }

  async run(sql, params) {
    this.db.prepare(sql).run(...toParams(params));
    return true;
  }

  async insert(sql, params) {
    const { lastInsertRowid } = this.db.prepare(sql).run(...toParams(params));
    return Number(lastInsertRowid);
  }

  async update(sql, params) {
    const { changes } = this.db.prepare(sql).run(...toParams(params));
    return Number(changes);
  }

  async delete(sql, params) {
    const { changes } = this.db.prepare(sql).run(...toParams(params));
    return Number(changes);
  }

  open() {
    // Do nothing
    return Promise.resolve();
  }

  close() {
    // Do nothing
    return Promise.resolve();
  }
}

export default SqliteClient;
