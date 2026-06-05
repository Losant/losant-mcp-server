import '../common.js';
import should from 'should';
import { extractBearerToken, validateBearerToken, AuthError } from '../../src/auth/bearer.js';
import { createMockJWT, createExpiredJWT, createWrongAudienceJWT } from '../helpers/jwt.js';

describe('Bearer Token Authentication', () => {
  const resourceUrl = 'https://mcp.losant.test';

  describe('extractBearerToken', () => {
    it('should extract bearer token from Authorization header', () => {
      const request = {
        headers: {
          authorization: 'Bearer test-token-123'
        }
      };

      const token = extractBearerToken(request);
      token.should.equal('test-token-123');
    });

    it('should handle case-insensitive Bearer keyword', () => {
      const request = {
        headers: {
          authorization: 'bearer test-token-123'
        }
      };

      const token = extractBearerToken(request);
      token.should.equal('test-token-123');
    });

    it('should throw AuthError if Authorization header is missing', () => {
      const request = {
        headers: {}
      };

      (() => {
        extractBearerToken(request);
      }).should.throw(AuthError);

      try {
        extractBearerToken(request);
      } catch (err) {
        err.should.be.instanceof(AuthError);
        should(err.error).equal(null);
        err.description.should.match(/No Authorization header/);
      }
    });

    it('should throw AuthError if Authorization header is malformed', () => {
      const request = {
        headers: {
          authorization: 'Basic dGVzdDp0ZXN0'
        }
      };

      (() => {
        extractBearerToken(request);
      }).should.throw(AuthError);

      try {
        extractBearerToken(request);
      } catch (err) {
        err.error.should.equal('invalid_token');
        err.description.should.match(/Malformed Authorization header/);
      }
    });

    it('should throw AuthError if bearer token is missing', () => {
      const request = {
        headers: {
          authorization: 'Bearer'
        }
      };

      (() => {
        extractBearerToken(request);
      }).should.throw(AuthError);
    });
  });

  describe('validateBearerToken', () => {
    it('should validate a well-formed JWT with correct audience', () => {
      const token = createMockJWT({ aud: resourceUrl });
      const payload = validateBearerToken(token, resourceUrl);

      payload.should.have.property('aud', resourceUrl);
      payload.should.have.property('sub');
      payload.should.have.property('exp');
    });

    it('should reject a JWT with prefix extending audience attack', () => {
      const token = createMockJWT({ aud: `${resourceUrl}.over.the.rainbow` });
      let err;
      try {
        validateBearerToken(token, resourceUrl);
      } catch (e) {
        err = e;
      }
      err.error.should.equal('invalid_token');
      err.description.should.match(/Audience mismatch/);
    });

    it('should reject a JWT when audience is missing', () => {
      const token = createMockJWT({}, { removeAudience: true });
      try {
        validateBearerToken(token, resourceUrl);
        throw new Error('Expected validateBearerToken to throw');
      } catch (err) {
        err.error.should.equal('invalid_token');
        err.description.should.match(/Missing audience \(aud\) claim/);
      }
    });

    it('should reject a JWT with invalid audience type', () => {
      const token = createMockJWT({ aud: 1234 });
      let err;
      try {
        validateBearerToken(token, resourceUrl);
      } catch (e) {
        err = e;
      }
      err.error.should.equal('invalid_token');
      err.description.should.match(/Audience mismatch/);
    });

    it('should validate JWT with audience as array (RFC 8707)', () => {
      const token = createMockJWT({ aud: [resourceUrl, 'https://other.resource.com'] });
      const payload = validateBearerToken(token, resourceUrl);

      payload.aud.should.be.an.Array();
      payload.aud.should.containEql(resourceUrl);
    });

    it('should throw AuthError for malformed JWT', () => {
      (() => {
        validateBearerToken('not-a-jwt', resourceUrl);
      }).should.throw(AuthError);

      try {
        validateBearerToken('not-a-jwt', resourceUrl);
      } catch (err) {
        err.error.should.equal('invalid_token');
        err.description.should.match(/Invalid JWT structure/);
      }
    });

    it('should throw AuthError for expired JWT', () => {
      const token = createExpiredJWT();

      (() => {
        validateBearerToken(token, resourceUrl);
      }).should.throw(AuthError);

      try {
        validateBearerToken(token, resourceUrl);
      } catch (err) {
        err.error.should.equal('invalid_token');
        err.description.should.match(/Token expired/);
      }
    });

    it('should throw AuthError for wrong audience', () => {
      const token = createWrongAudienceJWT();

      (() => {
        validateBearerToken(token, resourceUrl);
      }).should.throw(AuthError);

      try {
        validateBearerToken(token, resourceUrl);
      } catch (err) {
        err.error.should.equal('invalid_token');
        err.description.should.match(/Audience mismatch/);
      }
    });

    it('should throw AuthError for JWT with audience array that does not include resource', () => {
      const token = createMockJWT({ aud: ['https://other1.com', 'https://other2.com'] });

      (() => {
        validateBearerToken(token, resourceUrl);
      }).should.throw(AuthError);
    });

    it('should not verify signature (shallow validation only)', () => {
      // Token signed with test secret should still validate
      // (signature verification is losant-api's job)
      const token = createMockJWT({ aud: resourceUrl });
      const payload = validateBearerToken(token, resourceUrl);

      should.exist(payload);
    });

    it('should reject JWT with only 2 parts', () => {
      const malformedJWT = 'header.payload';

      (() => {
        validateBearerToken(malformedJWT, resourceUrl);
      }).should.throw(AuthError);

      try {
        validateBearerToken(malformedJWT, resourceUrl);
      } catch (err) {
        err.error.should.equal('invalid_token');
        err.description.should.match(/Invalid JWT structure/);
      }
    });

    it('should reject JWT with 4 parts', () => {
      const malformedJWT = 'header.payload.signature.extra';

      (() => {
        validateBearerToken(malformedJWT, resourceUrl);
      }).should.throw(AuthError);

      try {
        validateBearerToken(malformedJWT, resourceUrl);
      } catch (err) {
        err.error.should.equal('invalid_token');
        err.description.should.match(/Invalid JWT structure/);
      }
    });

    it('should reject JWT with invalid base64 encoding', () => {
      const malformedJWT = 'not-base64!@#.also-not-base64!@#.signature';

      (() => {
        validateBearerToken(malformedJWT, resourceUrl);
      }).should.throw(AuthError);
    });

    it('should reject JWT with invalid JSON in payload', () => {
      // Create a token with invalid JSON payload
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const invalidPayload = Buffer.from('this is not json').toString('base64url');
      const signature = 'fake-signature';
      const malformedJWT = `${header}.${invalidPayload}.${signature}`;

      // Note: jwt.decode throws SyntaxError for invalid JSON, not AuthError
      (() => {
        validateBearerToken(malformedJWT, resourceUrl);
      }).should.throw(Error); // Can be SyntaxError or AuthError

      try {
        validateBearerToken(malformedJWT, resourceUrl);
      } catch (err) {
        // Should throw some error
        should.exist(err);
      }
    });

    it('should accept JWT with future exp timestamp', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const token = createMockJWT({ aud: resourceUrl, exp: futureExp });

      const payload = validateBearerToken(token, resourceUrl);

      should.exist(payload);
      payload.exp.should.equal(futureExp);
    });

    it('should reject JWT missing aud claim', () => {
      // Create a token without aud claim
      const payload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = 'fake-signature';
      const token = `${header}.${payloadB64}.${signature}`;

      (() => {
        validateBearerToken(token, resourceUrl);
      }).should.throw(AuthError);

      try {
        validateBearerToken(token, resourceUrl);
      } catch (err) {
        err.error.should.equal('invalid_token');
        err.description.should.match(/Missing audience/);
      }
    });

    it('should accept JWT missing exp claim (exp is optional)', () => {
      // Create a token without exp claim - should be accepted
      const payload = {
        sub: 'test-user',
        aud: resourceUrl
      };
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signature = 'fake-signature';
      const token = `${header}.${payloadB64}.${signature}`;

      // Should not throw - exp is checked only if present
      const decoded = validateBearerToken(token, resourceUrl);
      should.exist(decoded);
      decoded.aud.should.equal(resourceUrl);
    });
  });

  describe('AuthError', () => {
    it('should create error with message and code', () => {
      const err = new AuthError('invalid_token', 'Token is invalid');

      err.should.be.instanceof(Error);
      err.name.should.equal('AuthError');
      err.error.should.equal('invalid_token');
      err.description.should.equal('Token is invalid');
      err.message.should.equal('Token is invalid');
    });

    it('should be catchable as Error', () => {
      try {
        throw new AuthError('test_error', 'Test description');
      } catch (err) {
        err.should.be.instanceof(Error);
        err.should.be.instanceof(AuthError);
      }
    });
  });
});
