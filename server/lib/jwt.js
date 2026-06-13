const crypto = require('crypto');

const DEFAULT_EXPIRY_SECONDS = Number(process.env.JWT_EXPIRES_IN_SECONDS || 60 * 60 * 24 * 7);

function base64url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function decodeBase64url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64').toString('utf8');
}

function createSignature(unsignedToken, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(unsignedToken)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'fitcoach-pro-dev-secret';
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    ...payload,
    iat: now,
    exp: now + DEFAULT_EXPIRY_SECONDS,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedBody = base64url(JSON.stringify(body));
  const unsignedToken = `${encodedHeader}.${encodedBody}`;
  const signature = createSignature(unsignedToken, secret);

  return `${unsignedToken}.${signature}`;
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET || 'fitcoach-pro-dev-secret';
  const [encodedHeader, encodedBody, signature] = String(token || '').split('.');

  if (!encodedHeader || !encodedBody || !signature) {
    throw new Error('Invalid token format.');
  }

  const unsignedToken = `${encodedHeader}.${encodedBody}`;
  const expectedSignature = createSignature(unsignedToken, secret);

  if (signature !== expectedSignature) {
    throw new Error('Invalid token signature.');
  }

  const payload = JSON.parse(decodeBase64url(encodedBody));

  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error('Token expired.');
  }

  return payload;
}

module.exports = { signToken, verifyToken };
