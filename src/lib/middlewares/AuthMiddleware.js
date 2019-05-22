import AppHelper from '../helpers/AppHelper';
import EventHelper from '../helpers/EventHelper';

const checkForBearer = function(req, header) {
  const authorization = req.header('Authorization');
  if (authorization) {
    const m = /^[Bb]earer\s+(\S+)$/.exec(authorization);
    if (m === null) {
      return;
    }
    const [, token] = m;
    return token;
  }
};

export const authMiddleware = (req, res, next) => {
  const token = checkForBearer(req, 'Authorization');
  if (token) {
    try {
      let gotcb = false;
      const done = EventHelper.emit('theo:authorize', token, (err, auth) => {
        if (gotcb) return;
        gotcb = true;
        if (!err && auth) {
          req.is_authorized = true;
          req.is_admin = auth.is_admin || false;
          req.is_core = auth.is_core || false;
          if (!req.auth_token) {
            if (req.is_core) {
              const onBehalfOfToken = req.header('X-On-Behalf-Of');
              if (onBehalfOfToken) {
                req.auth_token = onBehalfOfToken;
              } else {
                req.auth_token = 'core';
              }
            } else if (req.is_admin) {
              req.auth_token = 'admin';
            }
          }
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
          const onBehalfOfToken = req.header('X-On-Behalf-Of');
          if (onBehalfOfToken) {
            req.auth_token = onBehalfOfToken;
          } else {
            req.auth_token = 'core';
          }
        } else if (token === _settings.admin.token) {
          req.is_authorized = true;
          req.is_admin = true;
          req.auth_token = 'admin';
        } else if (_settings.admin.tokens && _settings.admin.tokens[token]) {
          req.is_authorized = true;
          req.is_admin = true;
          req.auth_token = _settings.admin.tokens[token];
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
