class BaseClient {
  all(sql, params) {
    throw new Error('Not implemented');
  }
  get(sql, params) {
    throw new Error('Not implemented');
  }
  run(sql, params) {
    throw new Error('Not implemented');
  }
  insert(sql, params) {
    throw new Error('Not implemented');
  }
  update(sql, params) {
    throw new Error('Not implemented');
  }
  delete(sql, params) {
    throw new Error('Not implemented');
  }
  close() {
    throw new Error('Not implemented');
  }
}

export default BaseClient;
