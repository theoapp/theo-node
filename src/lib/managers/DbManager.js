class DbManager {
  constructor(options) {
    this.options = options;
  }

  getEngine() {
    throw new Error('Not implemented');
  }

  initDb() {
    throw new Error('Not implemented');
  }

  upgradeDb(fromVersion) {
    throw new Error('Not implemented');
  }

  getCurrentVersion() {
    throw new Error('Not implemented');
  }

  createVersionTable() {
    throw new Error('Not implemented');
  }

  flushDb() {
    throw new Error('Not implemented');
  }

  getClient(pool = false) {
    throw new Error('Not implemented');
  }

  setClient(client) {
    throw new Error('Not implemented');
  }

  close() {
    throw new Error('Not implemented');
  }
}

export default DbManager;
