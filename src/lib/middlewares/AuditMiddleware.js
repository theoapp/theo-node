import AuditHelper from '../helpers/AuditHelper';

export const auditMiddleware = function(req, res, next) {
  req.auditHelper = new AuditHelper(req);
  next();
};
