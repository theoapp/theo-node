class KeysImporterManager {
  constructor(options) {
    this.options = options;
  }

  get(username) {
    throw new Error('Not implemented');
  }
}

export default KeysImporterManager;
