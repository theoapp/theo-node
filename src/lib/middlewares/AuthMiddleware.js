import AppHelper from '../helpers/AppHelper';
import EventHelper from '../helpers/EventHelper';

export const authMiddleware = (req, res, next) => {
  const authorization = req.header('Authorization');
  if (authorization) {
    const pieces = authorization.split(' ');
    if (pieces[0] !== 'Bearer') {
      next();
      return;
    }
    const _sm = AppHelper();
    const _settings = _sm.getSettings('admin');
    try {
      const token = pieces[1].trim();
      let gotcb = false;
      const done = EventHelper.emit('theo:authorize', token, (err, auth) => {
        if (gotcb) return;
        gotcb = true;
        if (!err && auth) {
          req.is_authorized = true;
          req.is_admin = auth.is_admin || false;
        }
        next();
      });
      if (!done) {
        if (token === _settings.token) {
          req.is_authorized = true;
          req.is_admin = true;
        } else {
          const _client = _sm.getSettings('client');
          if (_client.tokens) {
            if (_client.tokens.includes(token)) {
              req.is_authorized = true;
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

export const requireAdminAuthMiddleware = (req, res, next) => {
  if (!req.is_authorized && !req.is_admin) {
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
