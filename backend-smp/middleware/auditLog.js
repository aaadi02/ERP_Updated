const AuditLog = require('../models/fees/AuditLog');

const logAction = async (req, res, next) => {
  const { method, originalUrl, params, body } = req;
  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    try {
      const log = new AuditLog({
        userId: req.user?._id,
        action: method,
        entity: originalUrl.split('/')[3], // e.g., 'headers', 'scholarships'
        entityId: params.id || body._id,
        details: { body },
      });
      await log.save();
    } catch (err) {
      console.error('Audit log error:', err);
    }
  }
  next();
};

module.exports = logAction;