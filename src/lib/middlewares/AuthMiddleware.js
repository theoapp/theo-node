import AppHelper from '../helpers/AppHelper';
import EventHelper from '../helpers/EventHelper';

export const authMiddleware = (req, res, next) => {
  const authorization = req.header('Authorization');
  if (authorization) {
    const m = /^[Bb]earer\s+(\S+)$/.exec(authorization);
    if (m === null) {
      next();
      return;
    }
    try {
      const [, token] = m;
      let gotcb = false;
      const done = EventHelper.emit('theo:authorize', token, (err, auth) => {
        if (gotcb) return;
        gotcb = true;
        if (!err && auth) {
          req.is_authorized = true;
          req.is_admin = auth.is_admin || false;
          req.is_core = auth.is_core || false;
          req.auth_token = token;
        }
        next();
      });
      if (!done) {
        const _sm = AppHelper();
        const _settings = _sm.getSettings();
        if (_settings.core && token === _settings.core.token) {
          req.is_authorized = true;
          req.is_admin = true;
          req.is_core = true;
          req.auth_token = token;
        } else if (token === _settings.admin.token) {
          req.is_authorized = true;
          req.is_admin = true;
          req.auth_token = token;
        } else if (_settings.admin.tokens && _settings.admin.tokens.includes(token)) {
          req.is_authorized = true;
          req.is_admin = true;
          req.auth_token = token;
        } else {
          if (_settings.client.tokens) {
            if (_settings.client.tokens.includes(token)) {
              req.is_authorized = true;
              req.auth_token = token;
            }
          }
        }
        next();
      }
    } catch (e) {
      next();
    }
    return;
  }
  next();
};

export const requireCoreAuthMiddleware = (req, res, next) => {
  if (!req.is_authorized || !req.is_core) {
    res.status(401);
    res.json({ status: 401, reason: 'Unauthorized' });
    return;
  }
  next();
};

export const requireAdminAuthMiddleware = (req, res, next) => {
  if (!req.is_authorized || !req.is_admin) {
    res.status(401);
    res.json({ status: 401, reason: 'Unauthorized' });
    return;
  }
  next();
};

export const requireAuthMiddleware = (req, res, next) => {
  if (!req.is_authorized) {
    res.status(401);
    res.json({ status: 401, reason: 'Unauthorized' });
    return;
  }
  next();
};
