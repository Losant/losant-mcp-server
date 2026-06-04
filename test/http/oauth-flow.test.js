import { nock } from '../common.js';
import should from 'should';
import { createHttpServer } from '../../src/http/server.js';
import { createMockJWT, createExpiredJWT, createWrongAudienceJWT } from '../helpers/jwt.js';

/**
 * OAuth Integration Tests
 *
 * These tests verify the complete OAuth 2.0 flow:
 * 1. Discovery endpoint (RFC 9728)
 * 2. Bearer token extraction and validation
 * 3. Token expiry and audience validation
 * 4. Error propagation from losant-api
 */

describe('Integration: OAuth 2.0 Flow', function() {
  this.timeout(10000);

  let server;
  let validJWT;
  const resourceUrl = process.env.LOSANT_RESOURCE_URL; // 'https://mcp.losant.test';
  const apiUrl =  process.env.LOSANT_API_URL;

  before(async () => {
    // Create valid JWT
    validJWT = createMockJWT({ aud: [`${resourceUrl}/mcp`] });

    // Start server
    server = await createHttpServer();
    // Shot (Hapi's test injection) doesn't provide rawHeaders like real HTTP requests
    // Set them up before the handler runs so transport.handleRequest has them
    server.ext('onPreHandler', (request, h) => {
      if (!request.raw.req.rawHeaders && request.raw.req.headers) {
        request.raw.req.rawHeaders = Object.entries(request.raw.req.headers).flat();
      }
      return h.continue;
    });
    await server.start();
  });

  after(async () => {
    await server.stop();
  });

  describe('Step 1: OAuth Discovery (RFC 9728)', () => {
    it('should expose protected resource metadata', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource'
      });

      response.statusCode.should.equal(200);
      response.headers['content-type'].should.match(/application\/json/);

      const metadata = JSON.parse(response.payload);
      metadata.should.have.property('resource', `${resourceUrl}/mcp`);
      metadata.should.have.property('authorization_servers');
      metadata.authorization_servers.should.be.an.Array();
      metadata.authorization_servers[0].should.equal('https://api.losant.test');
      metadata.should.have.property('bearer_methods_supported');
      metadata.bearer_methods_supported.should.containEql('header');
      metadata.should.have.property('scopes_supported');
      metadata.scopes_supported.should.be.an.Array();
    });

    it('should list Losant-specific scopes', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource'
      });

      const metadata = JSON.parse(response.payload);
      metadata.scopes_supported.should.containEql('only.User.read');
      metadata.scopes_supported.should.containEql('all.Organization.bounded');
    });
  });

  describe('Step 2: Bearer Token Authentication', () => {
    it('should accept valid bearer token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${validJWT}`
        },
        payload: {
          jsonrpc: '2.0',
          method: 'ping',
          id: 1
        }
      });

      // Should not return 401 (authentication passed)
      response.statusCode.should.not.equal(401);
    });

    it('should reject request without bearer token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        payload: {
          jsonrpc: '2.0',
          method: 'ping',
          id: 1
        }
      });

      response.statusCode.should.equal(401);
      should.exist(response.headers['www-authenticate']);
      response.headers['www-authenticate'].should.equal('Bearer realm="mcp", resource_metadata="https://mcp.losant.test/.well-known/oauth-protected-resource"');

      const error = JSON.parse(response.payload);
      error.should.have.property('jsonrpc', '2.0');
      error.should.have.property('error');
      error.error.should.have.property('code', -32000);
      error.error.should.have.property('message', null);
      error.error.data.should.deepEqual({ error: null, description: 'No Authorization header provided' });
    });

    it('should reject malformed bearer token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: 'Bearer not-a-jwt'
        },
        payload: {
          jsonrpc: '2.0',
          method: 'ping',
          id: 1
        }
      });

      response.statusCode.should.equal(401);
      const error = JSON.parse(response.payload);
      error.error.data.should.have.property('error', 'invalid_token');
      error.error.data.description.should.match(/Invalid JWT structure/);
    });
  });

  describe('Step 3: Token Validation', () => {
    it('should reject expired JWT', async () => {
      const expiredJWT = createExpiredJWT();

      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${expiredJWT}`
        },
        payload: {
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1
        }
      });

      response.statusCode.should.equal(401);
      const error = JSON.parse(response.payload);
      error.error.data.should.have.property('error', 'invalid_token');
      error.error.data.description.should.match(/Token expired/);
    });

    it('should reject JWT with wrong audience', async () => {
      const wrongAudJWT = createWrongAudienceJWT();

      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${wrongAudJWT}`
        },
        payload: {
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1
        }
      });

      response.statusCode.should.equal(401);
      const error = JSON.parse(response.payload);
      error.error.data.should.have.property('error', 'invalid_token');
      error.error.data.description.should.match(/Audience mismatch/);
    });

    it('should accept JWT with audience as array containing resource URL', async () => {
      const multiAudJWT = createMockJWT({
        aud: [`${resourceUrl}/mcp`, 'https://other.resource.com']
      });

      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${multiAudJWT}`
        },
        payload: {
          jsonrpc: '2.0',
          method: 'ping',
          id: 1
        }
      });

      // Should not return 401 (token with array audience accepted)
      response.statusCode.should.not.equal(401);
    });
  });

  describe('Step 4: API Request Flow', () => {
    it('should forward bearer token to losant-api and handle success', async () => {
      const appId = '507f1f77bcf86cd799439011';

      // Mock losant-api devices endpoint
      nock(apiUrl)
        .get(`/applications/${appId}/devices`)
        .query(true)
        .matchHeader('authorization', `Bearer ${validJWT}`)
        .reply(200, {
          count: 2,
          items: [
            {
              id: '507f1f77bcf86cd799439012',
              name: 'Device 1',
              deviceClass: 'standalone'
            },
            {
              id: '507f1f77bcf86cd799439013',
              name: 'Device 2',
              deviceClass: 'standalone'
            }
          ]
        });

      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${validJWT}`,
          accept: 'application/json, text/event-stream'
        },
        payload: {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'losant_query',
            arguments: {
              operation: 'list',
              resourceType: 'device',
              applicationId: appId
            }
          },
          id: 2
        }
      });

      response.statusCode.should.equal(200);

      const result = JSON.parse(response.payload);
      result.should.have.property('jsonrpc', '2.0');
      result.should.have.property('result');
      const toolResult = JSON.parse(result.result.content[0].text);
      toolResult.should.have.property('count', 2);
      toolResult.items.should.have.length(2);
    });

    it('should propagate 401 error from losant-api', async () => {
      const appId = '507f1f77bcf86cd799439011';

      // Mock losant-api returning 401
      nock(apiUrl)
        .get(`/applications/${appId}/devices`)
        .query(true)
        // .matchHeader('authorization', `Bearer ${validJWT}`)
        .reply(401, {
          type: 'Unauthorized',
          message: 'Authentication token is invalid or expired'
        }, {
          'www-authenticate': 'Bearer realm="losant-api", error="invalid_token"'
        });

      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${validJWT}`,
          accept: 'application/json, text/event-stream'
        },
        payload: {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'losant_query',
            arguments: {
              operation: 'list',
              resourceType: 'device',
              applicationId: appId
            }
          },
          id: 3
        }
      });
      response.statusCode.should.equal(200);
      const result = JSON.parse(response.payload);
      const resultText = result.result.content[0].text;
      result.should.have.property('result');
      result.result.should.have.property('isError', true);
      resultText.should.equal(JSON.stringify({ code: -32600, message: 'MCP error -32600: Authentication token is invalid or expired', data: { resourceType: 'device', statusCode: 401 } }));
    });

    it('should propagate 403 insufficient_scope error from losant-api', async () => {
      const appId = '507f1f77bcf86cd799439011';
      // Mock losant-api returning 403
      nock(apiUrl)
        .get(`/applications/${appId}/devices`)
        .query(true)
        .reply(403, {
          type: 'Forbidden',
          message: 'Insufficient scope for this operation'
        }, {
          'www-authenticate': 'Bearer realm="losant-api", error="insufficient_scope"'
        });

      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${validJWT}`,
          accept: 'application/json, text/event-stream'
        },
        payload: {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name: 'losant_query',
            arguments: {
              operation: 'list',
              resourceType: 'device',
              applicationId: appId
            }
          },
          id: 4
        }
      });

      response.statusCode.should.equal(200);
      const result = JSON.parse(response.payload);
      result.result.should.have.property('isError', true);
      const resultText = result.result.content[0].text;
      resultText.should.equal(JSON.stringify({ code: -32600, message: 'MCP error -32600: Insufficient scope for this operation', data: { resourceType: 'device', statusCode: 403 } }));
    });
  });
  describe('Step 5: Token Management', () => {
    it('should validate bearer token on every request', async () => {
      await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${validJWT}`,
          accept: 'application/json, text/event-stream'
        },
        payload: {
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1
        }
      });

      const expiredJWT = createExpiredJWT();
      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${expiredJWT}`
        },
        payload: {
          jsonrpc: '2.0',
          method: 'ping',
          id: 2
        }
      });

      response.statusCode.should.equal(401);
      const error = JSON.parse(response.payload);
      error.error.data.description.should.match(/Token expired/);
    });
  });
});
