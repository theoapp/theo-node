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
    this.settings.admin.token = undefined;
    this.settings.admin.tokens = tokens.admins || [];
    if (tokens.admin) {
      this.settings.admin.tokens.push(tokens.admin);
    }
    this.settings.client.tokens = tokens.clients;
  }
}

const getInstance = settings => {
  if (!_instance) {
    if (!settings) {
      throw new Error('AppHelper needs to be initialized with settings');
    }
    _instance = new AppHelper(settings);
  } else {
    if (settings) {
      _instance.settings = settings;
    }
  }
  return _instance;
};

export default getInstance;
