import { nock } from '../common.js';
import { createHttpServer } from '../../src/http/server.js';
/**
 * OAuth Discovery Endpoint Tests
 *
 * Tests for RFC 9728 OAuth 2.0 Protected Resource Metadata endpoint
 * with dynamic scope fetching from authorization server
 */

describe('OAuth Discovery: Dynamic Scope Fetching', function() {
  this.timeout(10000);

  let server;
  const apiUrl = process.env.LOSANT_API_URL || 'https://api.losant.test';
  const resourceUrl = process.env.LOSANT_RESOURCE_URL || 'https://mcp.losant.test';

  before(async () => {
    server = await createHttpServer();
    await server.start();
  });

  after(async () => {
    await server.stop();
  });

  describe('Scope Fetching from Authorization Server', () => {
    it('should fetch scopes from auth server metadata endpoint', async () => {
      const mockScopes = [
        'only.User.read',
        'all.User.read',
        'all.Application.bounded',
        'all.Application.read',
        'all.Device.bounded',
        'all.Device.read'
      ];

      // Mock the authorization server metadata endpoint
      nock(apiUrl)
        .get('/.well-known/oauth-authorization-server')
        .reply(200, {
          issuer: apiUrl,
          authorization_endpoint: `${apiUrl}/oauth`,
          token_endpoint: `${apiUrl}/oauth/token`,
          scopes_supported: mockScopes
        });

      const response = await server.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource'
      });

      response.statusCode.should.equal(200);
      const metadata = JSON.parse(response.payload);

      metadata.scopes_supported.should.eql(mockScopes);
    });

    it('should cache scopes for 5 minutes', async () => {
      const mockScopes = ['only.User.read', 'all.User.read'];

      // First call should hit the API
      nock(apiUrl)
        .get('/.well-known/oauth-authorization-server')
        .reply(200, {
          scopes_supported: mockScopes
        });

      const response1 = await server.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource'
      });

      response1.statusCode.should.equal(200);
      const metadata1 = JSON.parse(response1.payload);
      metadata1.scopes_supported.should.eql(mockScopes);

      // Second call should use cache (no HTTP request)
      // No nock mock set up - if it tries to hit the API, nock will error
      const response2 = await server.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource'
      });

      response2.statusCode.should.equal(200);
      const metadata2 = JSON.parse(response2.payload);
      metadata2.scopes_supported.should.eql(mockScopes);

      // Third call should also use cache
      const response3 = await server.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource'
      });

      response3.statusCode.should.equal(200);
      const metadata3 = JSON.parse(response3.payload);
      metadata3.scopes_supported.should.eql(mockScopes);
    });

    it('should fall back to configured scopes if auth server is unavailable', async () => {
      // Mock auth server returning 500
      nock(apiUrl)
        .get('/.well-known/oauth-authorization-server')
        .reply(500, { error: 'Internal Server Error' });

      const response = await server.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource'
      });

      response.statusCode.should.equal(200);
      const metadata = JSON.parse(response.payload);

      // Should return fallback scopes from config
      metadata.scopes_supported.should.be.an.Array();
      metadata.scopes_supported.should.containEql('only.User.read');
      metadata.scopes_supported.should.containEql('all.Organization.bounded');
    });

    it('should fall back to configured scopes on network error', async () => {
      // Mock network error
      nock(apiUrl)
        .get('/.well-known/oauth-authorization-server')
        .replyWithError('Network error');

      const response = await server.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource'
      });

      response.statusCode.should.equal(200);
      const metadata = JSON.parse(response.payload);

      // Should return fallback scopes from config
      metadata.scopes_supported.should.be.an.Array();
      metadata.scopes_supported.length.should.be.above(0);
    });

    it('should include correct resource and authorization server URLs', async () => {
      const mockScopes = ['all.User.read'];

      nock(apiUrl)
        .get('/.well-known/oauth-authorization-server')
        .reply(200, {
          scopes_supported: mockScopes
        });

      const response = await server.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource'
      });

      response.statusCode.should.equal(200);
      const metadata = JSON.parse(response.payload);

      metadata.should.have.property('resource', `${resourceUrl}/mcp`);
      metadata.should.have.property('authorization_servers');
      metadata.authorization_servers.should.be.an.Array();
      metadata.authorization_servers[0].should.equal(apiUrl);
      metadata.should.have.property('bearer_methods_supported');
      metadata.bearer_methods_supported.should.containEql('header');
    });

    it('should fallback to config scopes on malformed JSON response', async () => {
      // Mock auth server returning invalid JSON
      nock(apiUrl)
        .get('/.well-known/oauth-authorization-server')
        .reply(200, 'This is not JSON');

      const response = await server.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource'
      });

      response.statusCode.should.equal(200);
      const metadata = JSON.parse(response.payload);

      // Should return fallback scopes from config
      metadata.scopes_supported.should.be.an.Array();
      metadata.scopes_supported.should.containEql('only.User.read');
    });

    it('should handle auth server returning empty scopes array', async () => {
      // Mock auth server returning empty scopes
      nock(apiUrl)
        .get('/.well-known/oauth-authorization-server')
        .reply(200, {
          scopes_supported: []
        });

      const response = await server.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource'
      });

      response.statusCode.should.equal(200);
      const metadata = JSON.parse(response.payload);

      // Should return the empty array (not fallback)
      metadata.scopes_supported.should.be.an.Array();
      metadata.scopes_supported.length.should.equal(0);
    });

    it('should handle auth server returning no scopes_supported field', async () => {
      // Mock auth server response without scopes_supported
      nock(apiUrl)
        .get('/.well-known/oauth-authorization-server')
        .reply(200, {
          issuer: apiUrl,
          token_endpoint: `${apiUrl}/oauth/token`
        });

      const response = await server.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource'
      });

      response.statusCode.should.equal(200);
      const metadata = JSON.parse(response.payload);

      // Should fallback to config scopes when scopes_supported is undefined
      metadata.scopes_supported.should.be.an.Array();
      metadata.scopes_supported.should.containEql('only.User.read');
    });
  });
});
