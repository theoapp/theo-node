let _instance;

class AppHelper {
  constructor(settings) {
    this.settings = settings;
  }

  getSettings(root) {
    return root ? this.settings[root] : this.settings;
  }
}

const getInstance = settings => {
  if (!_instance) {
    _instance = new AppHelper(settings);
  }
  return _instance;
};

export default getInstance;
