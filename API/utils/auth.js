const parentJwt = require('../config/jwt_token_for_parent');
const childJwt = require('../config/jwt_token_for_child');


function extractToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  return authHeader && typeof authHeader === 'string' ? authHeader.split(' ')[1] : null;
}


async function verifyParentToken(req) {
  const token = extractToken(req);
  if (!token) {
    const err = new Error('No token provided');
    err.status = 401;
    throw err;
  }

  try {
    const decoded = await parentJwt.verifyJwt(token);
    if (!decoded || typeof decoded !== 'object') {
      const err = new Error('Invalid or expired token');
      err.status = 401;
      throw err;
    }
    return decoded;
  } catch (e) {
    const err = new Error('Invalid or expired token');
    err.status = 401;
    throw err;
  }
}


async function verifyChildToken(req) {
  const token = extractToken(req);
  if (!token) {
    const err = new Error('No token provided');
    err.status = 401;
    throw err;
  }

  try {
    const decoded = await childJwt.verifyJwt(token);
    if (!decoded || typeof decoded !== 'object') {
      const err = new Error('Invalid or expired token');
      err.status = 401;
      throw err;
    }
    return decoded;
  } catch (e) {
    const err = new Error('Invalid or expired token');
    err.status = 401;
    throw err;
  }
}

module.exports = {
  extractToken,
  verifyParentToken,
  verifyChildToken,
};
