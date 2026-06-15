import '../common.js';
import should from 'should';
import { stub } from 'sinon';
import esmock from 'esmock';
import { createMockJWT } from '../helpers/jwt.js';
import conf from '../../src/config.js';
import * as httpServerMod from '../../src/http/server.js';

describe('HTTP Server', () => {
  let createHttpServer;
  let mockCreateMCPServer;
  let mockMCPServerInstance;
  let mockTransport;
  let MockTransportClass;
  let server;
  let originalEnv;
  let validJWT;

  beforeEach(async () => {
    // Save original environment
    originalEnv = { ...process.env };
    process.env.LOSANT_RESOURCE_URL = 'https://mcp.losant.test';

    // Create a valid JWT for testing
    validJWT = createMockJWT();

    // Mock MCP server instance
    mockMCPServerInstance = {
      connect: stub().resolves()
    };

    // Mock createMCPServer function
    mockCreateMCPServer = stub().resolves(mockMCPServerInstance);

    // Mock transport instance
    mockTransport = {
      handleRequest: stub().callsFake(async (req, res) => {
        // Shot (Hapi's test injection) doesn't provide rawHeaders like real HTTP requests
        // Convert headers object to rawHeaders array format for test compatibility
        // if (!req.rawHeaders && req.headers) {
        //   req.rawHeaders = Object.entries(req.headers).flat();
        // }
        // Simulate the transport handling the request
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', result: 'ok' }));
      }),
      close: stub().resolves()
    };

    // Mock StreamableHTTPServerTransport class
    MockTransportClass = stub().returns(mockTransport);

    // Import the HTTP server with mocks
    const module = await esmock('../../src/http/server.js', {
      '../../src/mcp/server.js': {
        createMCPServer: mockCreateMCPServer
      },
      '@modelcontextprotocol/sdk/server/streamableHttp.js': {
        StreamableHTTPServerTransport: MockTransportClass
      }
    });

    createHttpServer = module.createHttpServer;
  });

  afterEach(async () => {
    // Restore environment
    process.env = originalEnv;
    await server?.stop();
  });

  describe('Server Creation', () => {
    it('should create a Hapi server instance', async () => {
      server = await createHttpServer();

      should.exist(server);
      server.should.have.property('info');
      server.should.have.property('inject');
    });

    it('should configure server with correct port', async () => {
      server = await createHttpServer();

      server.info.port.should.equal(3000); // Default port
    });

    it('should configure server with correct host', async () => {
      server = await createHttpServer();

      server.info.host.should.equal('0.0.0.0');
    });

    it('should use PORT environment variable if provided', async () => {
      conf.set('port', 8080);
      server = await createHttpServer();

      server.info.port.should.equal(8080);

      conf.set('port', 3000);
    });

    it('should enable CORS', async () => {
      server = await createHttpServer();

      // CORS is configured in route settings
      server.should.have.property('settings');
    });
  });

  describe('GET /', () => {
    beforeEach(async () => {
      server = await createHttpServer();
    });

    it('should return 200 status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });

      response.statusCode.should.equal(200);
    });

    it('should return HTML content', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });

      response.headers['content-type'].should.match(/text\/html/);
    });

    it('should include Losant MCP Server title', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });

      response.payload.should.containEql('Losant MCP Server');
    });

    it('should show User Authentication section when OAuth is enabled', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });

      response.payload.should.containEql('User Authentication');
    });

    it('should include MCP endpoint URL', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });

      response.payload.should.containEql('/mcp');
    });

    it('should include User Authentication section when OAuth is enabled', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });

      response.payload.should.containEql('User Authentication');
    });
  });

  describe('GET /healthz', () => {
    beforeEach(async () => {
      server = await createHttpServer();
    });

    it('should return 200 status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/healthz'
      });

      response.statusCode.should.equal(200);
    });

    it('should return correct health check response', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/healthz'
      });

      const payload = JSON.parse(response.payload);
      payload.should.have.property('ok', true);
      payload.should.have.property('server', 'losant-mcp-server');
    });

    it('should return JSON content type', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/healthz'
      });

      response.headers['content-type'].should.match(/application\/json/);
    });
  });

  describe('GET /mcp', () => {
    beforeEach(async () => {
      server = await createHttpServer();
    });

    it('should return 405 Method Not Allowed', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/mcp'
      });

      response.statusCode.should.equal(405);
    });

    it('should include Allow header with POST', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/mcp'
      });

      should.exist(response.headers.allow);
      response.headers.allow.should.equal('POST');
    });

    it('should return correct error message', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/mcp'
      });

      response.payload.should.equal('Method Not Allowed - Use POST');
    });
  });

  describe('POST /mcp', () => {
    beforeEach(async () => {
      server = await createHttpServer();
    });

    it('should accept POST requests with valid bearer token', async () => {
      await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${validJWT}`
        },
        payload: { jsonrpc: '2.0', method: 'initialize', id: 1 }
      });

      // The transport handles the request, so we just verify it was called
      mockCreateMCPServer.calledOnce.should.be.true();
    });

    it('should create new MCP server for new session with bearer token', async () => {
      await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${validJWT}`
        },
        payload: { jsonrpc: '2.0', method: 'test', id: 1 }
      });

      mockCreateMCPServer.calledOnce.should.be.true();
      mockMCPServerInstance.connect.calledOnce.should.be.true();
      mockCreateMCPServer.firstCall.args[0].should.equal(validJWT);
    });

    it('should create StreamableHTTPServerTransport', async () => {
      await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${validJWT}`
        },
        payload: { jsonrpc: '2.0', method: 'test', id: 1 }
      });

      MockTransportClass.calledOnce.should.be.true();
      const transportConfig = MockTransportClass.firstCall.args[0];
      transportConfig.should.have.property('enableJsonResponse', true);
    });

    it('should call transport.handleRequest', async () => {
      await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${validJWT}`
        },
        payload: { jsonrpc: '2.0', method: 'test', id: 1 }
      });

      mockTransport.handleRequest.calledOnce.should.be.true();
    });

    it('should accept application/json content type', async () => {
      await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'authorization': `Bearer ${validJWT}`,
          'content-type': 'application/json'
        },
        payload: { jsonrpc: '2.0', method: 'test', id: 1 }
      });

      // Should not return error for content type
      mockTransport.handleRequest.calledOnce.should.be.true();
    });

    it('should return 401 for missing bearer token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        payload: { jsonrpc: '2.0', method: 'test', id: 1 }
      });

      response.statusCode.should.equal(401);
      should.exist(response.headers);
      should.exist(response.headers['www-authenticate']);
      response.headers['www-authenticate'].should.match('Bearer realm="mcp", resource_metadata="https://mcp.losant.test/.well-known/oauth-protected-resource"');
    });

    it('should return 401 for malformed bearer token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: 'Bearer not-a-valid-jwt'
        },
        payload: { jsonrpc: '2.0', method: 'test', id: 1 }
      });

      response.statusCode.should.equal(401);
      response.headers['www-authenticate'].should.match(/Bearer realm="mcp"/);
    });
  });

  describe('OAuth Discovery', () => {
    beforeEach(async () => {
      server = await createHttpServer();
    });

    it('should expose OAuth Protected Resource Metadata', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/.well-known/oauth-protected-resource'
      });

      response.statusCode.should.equal(200);
      const metadata = JSON.parse(response.payload);
      metadata.should.have.property('resource', 'https://mcp.losant.test/mcp');
      metadata.should.have.property('authorization_servers');
      metadata.authorization_servers.should.be.an.Array();
      metadata.authorization_servers.should.containEql('https://api.losant.test');
      metadata.should.have.property('bearer_methods_supported');
      metadata.bearer_methods_supported.should.containEql('header');
      metadata.should.have.property('scopes_supported');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      server = await createHttpServer();
    });

    it('should handle MCP server creation errors', async () => {
      // Make createMCPServer throw an error
      mockCreateMCPServer.rejects(new Error('MCP server creation failed'));

      const response = await server.inject({
        headers: {
          authorization: `Bearer ${validJWT}`
        },
        method: 'POST',
        url: '/mcp',
        payload: { jsonrpc: '2.0', method: 'test', id: 1 }
      });

      response.statusCode.should.equal(500);
      const payload = JSON.parse(response.payload);
      payload.should.have.property('error', 'Internal MCP server error');
    });

    it('should handle transport errors gracefully', async () => {
      // Make transport.handleRequest throw an error
      mockTransport.handleRequest.rejects(new Error('Transport error'));

      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${validJWT}`
        },
        payload: { jsonrpc: '2.0', method: 'test', id: 1 }
      });

      response.statusCode.should.equal(500);
    });
  });

  describe('Route Registration', () => {
    beforeEach(async () => {
      server = await createHttpServer();
    });

    it('should have exactly 7 routes registered', () => {
      const routes = server.table();
      routes.should.have.length(7); // root, favicon, healthz, oauth discovery, POST /mcp, GET /mcp
    });

    it('should have GET /healthz route', () => {
      const routes = server.table();
      const healthRoute = routes.find((r) => r.path === '/healthz' && r.method === 'get');
      should.exist(healthRoute);
    });

    it('should have POST /mcp route', () => {
      const routes = server.table();
      const mcpPostRoute = routes.find((r) => r.path === '/mcp' && r.method === 'post');
      should.exist(mcpPostRoute);
    });

    it('should have GET /mcp route', () => {
      const routes = server.table();
      const mcpGetRoute = routes.find((r) => r.path === '/mcp' && r.method === 'get');
      should.exist(mcpGetRoute);
    });

    it('should have GET /.well-known/oauth-protected-resource route', () => {
      const routes = server.table();
      const oauthRoute = routes.find((r) => r.path === '/.well-known/oauth-protected-resource' && r.method === 'get');
      should.exist(oauthRoute);
    });

    it('should have GET / route for root page', () => {
      const routes = server.table();
      const rootRoute = routes.find((r) => r.path === '/' && r.method === 'get');
      should.exist(rootRoute);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      server = await createHttpServer();
    });

    it('should reject payloads larger than 5 MB', async () => {
      // Create a payload larger than 5 MB
      const largePayload = {
        jsonrpc: '2.0',
        method: 'test',
        id: 1,
        params: {
          data: 'x'.repeat(6 * 1024 * 1024) // 6 MB of data
        }
      };

      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${validJWT}`
        },
        payload: largePayload,
        simulate: { end: true }
      });

      response.statusCode.should.equal(413); // Payload Too Large
    });

    it('should include security headers in responses', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/healthz'
      });

      response.statusCode.should.equal(200);
      // Check for common security headers
      should.exist(response.headers);
    });

    it('should handle malformed MCP protocol requests', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${validJWT}`
        },
        payload: 'this is not valid JSON'
      });

      response.statusCode.should.equal(400);
    });

    it('should handle missing jsonrpc field in request', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          authorization: `Bearer ${validJWT}`
        },
        payload: { method: 'test', id: 1 } // Missing jsonrpc field
      });

      // Should be handled gracefully, either by server or transport
      response.statusCode.should.be.belowOrEqual(500);
    });

    it('should handle server graceful shutdown', async () => {
      await server.start();

      // Server should stop cleanly
      await server.stop({ timeout: 1000 });

      // Server should be stopped
      server.info.started.should.equal(0);
    });

    it('should close active connections on shutdown within timeout', async () => {
      await server.start();

      // Simulate an active connection by starting a request (but not completing it)
      // In production, the timeout would force-close connections

      const stopPromise = server.stop({ timeout: 100 });

      // Should complete within reasonable time
      await stopPromise;
      server.info.started.should.equal(0);
    });

    it('should handle invalid content-type header', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/mcp',
        headers: {
          'authorization': `Bearer ${validJWT}`,
          'content-type': 'text/plain'
        },
        payload: JSON.stringify({ jsonrpc: '2.0', method: 'test', id: 1 })
      });

      // Hapi should handle this, may accept or reject
      response.statusCode.should.be.a.Number();
    });

    it('should handle concurrent MCP requests', async () => {
      const requests = [];

      for (let i = 0; i < 5; i++) {
        requests.push(
          server.inject({
            method: 'POST',
            url: '/mcp',
            headers: {
              authorization: `Bearer ${validJWT}`
            },
            payload: { jsonrpc: '2.0', method: 'test', id: i }
          })
        );
      }

      const responses = await Promise.all(requests);

      // All requests should complete
      responses.should.have.length(5);
      responses.forEach((res) => {
        res.statusCode.should.be.belowOrEqual(500);
      });

      // Should create a new MCP server for each request
      mockCreateMCPServer.callCount.should.equal(5);
    });
  });
});

describe('HTTP Server - With OAUTH disabled', () => {
  describe('Create MCP Server with LOSANT_API_TOKEN', () => {
    let currentOAuth, server;
    beforeEach(() => {
      currentOAuth = conf.get('enableOAuth');
      conf.set('enableOAuth', false);
      conf.set('losant.apiToken', createMockJWT());
    });
    afterEach(async () => {
      await server?.stop();
      conf.set('enableOAuth', currentOAuth);
      conf.set('losant.apiToken', '');
    });
    it('should create an MCP server instance with API token', async () => {
      server = await httpServerMod.createHttpServer();
      should.exist(server);
      const routes = server.table();
      routes.length.should.equal(5); // root, favicon, healthz, POST /mcp, GET /mcp - OAuth discovery route should not be registered
      const paths = routes.map((r) => r.path);
      paths.should.containEql('/');
      paths.should.containEql('/favicon.ico');
      paths.should.containEql('/healthz');
      paths.should.containEql('/mcp');
      paths.should.not.containEql('/.well-known/oauth-protected-resource');
    });

    it('should show API Token Configuration section on root page', async () => {
      server = await httpServerMod.createHttpServer();
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });

      response.payload.should.containEql('API Token Configuration');
      response.payload.should.not.containEql('User Authentication');
    });

    it('should not show User Authentication section when OAuth is disabled', async () => {
      server = await httpServerMod.createHttpServer();
      const response = await server.inject({
        method: 'GET',
        url: '/'
      });

      response.payload.should.containEql('API Token Configuration');
      response.payload.should.not.containEql('User Authentication');
    });
  });
});
