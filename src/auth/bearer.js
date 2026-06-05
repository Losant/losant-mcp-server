import jwt from 'jsonwebtoken';

const parse = (uri) => {
  const url = new URL(uri);
  if (url.hash) { throw new Error('resource URI must not contain a fragment'); }
  return {
    origin: url.origin,
    path: url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
  };
};
export const isResourceSetAcceptable = (aud, expectedAud) => {
  const reqArr = Array.isArray(aud) ? aud : [aud];
  const bndArr = Array.isArray(expectedAud) ? expectedAud : [expectedAud];
  let parsedReq, parsedBnd;
  try {
    parsedReq = reqArr.map(parse);
    parsedBnd = bndArr.map(parse);
  } catch {
    return false;
  }

  return parsedReq.find((req) => {
    return parsedBnd.some((bnd) => {
      return req.origin === bnd.origin && req.path.startsWith(bnd.path);
    });
  });
};

/**
 * Custom error class for authentication failures
 */
export class AuthError extends Error {
  constructor(error, description) {
    super(description);
    this.name = 'AuthError';
    this.error = error;
    this.description = description;
  }
}

/**
 * Extract bearer token from Authorization header
 * @param {Object} request - Hapi request object
 * @returns {string} Bearer token
 * @throws {AuthError} If token is missing or malformed
 */
export const extractBearerToken = (request) => {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AuthError(null, 'No Authorization header provided');
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new AuthError('invalid_token', 'Malformed Authorization header');
  }

  return match[1];
};

/**
 * Validate bearer token (shallow validation only - no signature check)
 * Checks audience and expiry only. Signature verification is done by losant-api.
 *
 * @param {string} token - JWT bearer token
 * @param {string} expectedAudience - Expected audience (resource URL)
 * @returns {Object} Decoded token payload
 * @throws {AuthError} If token is invalid, expired, or audience mismatch
 */
export const validateBearerToken = (token, expectedAudience) => {
  // Decode WITHOUT verification - losant-api will verify signature
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.payload) {
    throw new AuthError('invalid_token', 'Invalid JWT structure');
  }
  const { aud, exp } = decoded.payload;
  if (!aud) {
    throw new AuthError('invalid_token', 'Missing audience (aud) claim');
  }
  if (!isResourceSetAcceptable(aud, expectedAudience)) {
    throw new AuthError('invalid_token', 'Audience mismatch');
  }

  // Check expiry
  if (exp && exp < Math.floor(Date.now() / 1000)) {
    throw new AuthError('invalid_token', 'Token expired');
  }

  return decoded.payload;
};
