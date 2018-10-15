class CachedManager {
  constructor(options) {
    this.options = options;
  }
  get(key) {
    throw new Error('Not implemented');
  }
  set(key, value) {
    throw new Error('Not implemented');
  }
  del(key) {
    throw new Error('Not implemented');
  }
  flush() {
    throw new Error('Not implemented');
  }
}

export default CachedManager;
