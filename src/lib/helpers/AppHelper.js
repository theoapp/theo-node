import AuthTokenManager from '../managers/AuthTokenManager';

let _instance;

class AppHelper {
  constructor(settings) {
    this.settings = settings;
  }

  getSettings(root) {
    return root ? this.settings[root] : this.settings;
  }

  async loadAuthTokens(db) {
    const atm = new AuthTokenManager(db);
    const tokens = await atm.getAll();
    this.reloadAuthToken(tokens);
  }

  reloadAuthToken(tokens) {
    this.settings.admin.token = tokens.admin;
    this.settings.client.tokens = tokens.client;
  }
}

const getInstance = settings => {
  if (!_instance) {
    _instance = new AppHelper(settings);
  }
  return _instance;
};

export default getInstance;
