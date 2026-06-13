const { verifyToken } = require('../lib/jwt');

function requireAuth(req, res, next) {
  const authorizationHeader = req.headers.authorization || '';
  const token = authorizationHeader.startsWith('Bearer ')
    ? authorizationHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: Number(payload.sub), email: payload.email };
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = { requireAuth };
