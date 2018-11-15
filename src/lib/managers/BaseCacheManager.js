import { loadCacheManager } from '../helpers/CacheHelper';

let _cm;

export const MAX_ROWS = 100;

class BaseCacheManager {
  constructor(db) {
    this.db = db;
  }

  invalidateCache() {
    if (_cm === undefined) {
      _cm = loadCacheManager();
    }
    if (_cm !== false) {
      _cm.flush().catch(err => {
        console.error('Failed to flush cache', err.message);
      });
    }
  }
}

export default BaseCacheManager;
