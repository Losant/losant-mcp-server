import jwt from 'jsonwebtoken';

/**
 * Create a mock JWT for testing
 * @param {Object} payload - JWT payload
 * @param {Object} options - Options for JWT generation
 * @returns {string} JWT token
 */
export const createMockJWT = (payload = {}, options = {}) => {
  const defaultPayload = {
    sub: '69ef741f88344d39b8adf523',
    subtype: 'apiToken',
    scope: ['only.User.read'],
    iss: 'test.losant.env',
    aud: [`${process.env.LOSANT_RESOURCE_URL || 'http://localhost:3000'}/mcp`, `${process.env.LOSANT_API_URL || 'http://localhost:3000'}`],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  };
  if (options.removeAudience) {
    delete defaultPayload.aud;
  }
  const mergedPayload = { ...defaultPayload, ...payload };
  // Sign with a test secret (signature doesn't matter for shallow validation)
  return jwt.sign(mergedPayload, options.secret || 'test-secret', {
    algorithm: options.algorithm || 'HS256'
  });
};

/**
 * Create an expired mock JWT for testing
 * @returns {string} Expired JWT token
 */
export const createExpiredJWT = () => {
  return createMockJWT({
    exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
  });
};

/**
 * Create a JWT with wrong audience for testing
 * @returns {string} JWT with wrong audience
 */
export const createWrongAudienceJWT = () => {
  return createMockJWT({
    aud: 'https://wrong.audience.com'
  });
};
