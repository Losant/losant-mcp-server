import Hapi from '@hapi/hapi';
import Boom from '@hapi/boom';
import Inert from '@hapi/inert';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'; // eslint-disable-line import/no-unresolved
import { createMCPServer } from '../mcp/server.js';
import { extractBearerToken, validateBearerToken } from '../auth/bearer.js';
import { createAuthServerMetadataRoute, createOAuthServerRoute } from './oauth-discovery.js';
import { createRootPageRoute } from './root-page.js';
import conf from '../config.js';
import debug from 'debug';
import rollbar from '../helpers/rollbar.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js'; // eslint-disable-line import/no-unresolved
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const log = debug('losant-mcp-server:http');
const logPayload = debug('losant-mcp-server:http:payload');

const unauthBoom = (err, enableOAuth, resourceUrl, hasToken = true) => {
  const attributes = {
    realm: 'mcp'
  };
  if (err.description && hasToken) {
    attributes.error_description = err.description;
  }
  if (enableOAuth) {
    attributes.resource_metadata = `${resourceUrl}/.well-known/oauth-protected-resource`;
  }
  // only default the error message if a token exists otherwise it will put error on the headers by default
  const msg = hasToken ? err.error || 'Authentication failed' : null;
  const error = Boom.unauthorized(msg, 'Bearer', attributes);
  error.isMissing = false;
  error.output.payload.jsonrpc = '2.0';
  error.output.payload.error = {
    code: ErrorCode.ConnectionClosed,
    message: msg,
    data: { error: msg, description: err.description }
  };
  error.output.payload.id = null;
  throw error;
};

export const createHttpServer = async () => {
  // Validate required environment variables
  const resourceUrl = conf.get('losant.resourceUrl');
  const apiToken = conf.get('losant.apiToken');
  const enableOAuth = conf.get('enableOAuth');
  // Hapi server setup
  const hapiServer = Hapi.server({
    port: conf.get('port'),
    host: conf.get('host'),
    routes: {
      // this is needed to allow MCP clients to call the server from browsers without CORS issues, since many will be calling directly from frontend code
      cors: true,
      security: {
        hsts: {
          includeSubDomains: true,
          maxAge: 31536000 // 1 year
        }
      }
    }
  });

  await hapiServer.register(Inert);
  hapiServer.auth.scheme('bearer', () => ({
    authenticate: (request, h) => {
      try {
        let token = apiToken;
        if (enableOAuth) {
          token = extractBearerToken(request);
          validateBearerToken(token, resourceUrl);
        }
        return h.authenticated({ credentials: { token } });
      } catch (err) {
        unauthBoom(err, enableOAuth, resourceUrl, !!(enableOAuth ? request.headers.authorization : apiToken));
      }
    }
  }));
  hapiServer.auth.strategy('mcp', 'bearer');
  // Root page with setup instructions
  hapiServer.route(createRootPageRoute());
  // Favicon
  hapiServer.route({
    method: 'GET',
    path: '/favicon.ico',
    handler: (_request, h) => {
      const faviconPath = path.join(__dirname, '..', 'public', 'images', 'favicon.ico');
      return h.file(faviconPath).type('image/x-icon');
    }
  });
  // Health check endpoint
  hapiServer.route({
    method: 'GET',
    path: '/healthz',
    handler: (_request, h) => {
      return h.response({ ok: true, server: 'losant-mcp-server' });
    }
  });
  if (enableOAuth) {
    // OAuth 2.0 Protected Resource Metadata (RFC 9728)
    hapiServer.route(createAuthServerMetadataRoute());
    // OAuth 2.0 Authorization Server Metadata (RFC 8414)
    hapiServer.route(createOAuthServerRoute());
  }

  // Main MCP endpoint
  hapiServer.route({
    method: 'POST',
    path: '/mcp',
    options: {
      auth: 'mcp',
      payload: {
        parse: true,
        allow: 'application/json',
        maxBytes: 5 * 1024 * 1024 // 5 MB limit
      }
    },
    handler: async (request, h) => {
      try {
        logPayload('Received MCP request with body:', request.payload);

        // NEW SESSION: Create MCP server with this bearer token
        const transport = new StreamableHTTPServerTransport({
          enableJsonResponse: true,
          sessionIdGenerator: undefined
        });
        // Create MCP server bound to this bearer token
        const server = await createMCPServer(request.auth.credentials.token);
        await server.connect(transport);
        await transport.handleRequest(request.raw.req, request.raw.res, request.payload)
          .finally(async () => {
            await transport.close();
          });
        return h.abandon; // Hapi will not send a response, transport handles it
      } catch (err) {
        // Other errors
        log('Error handling MCP request:', err);
        rollbar.error('Error handling MCP request', err, request);
        if (!request.raw.res.headersSent) {
          return h.response({ error: 'Internal MCP server error' }).code(500);
        }
        return h.abandon;
      }
    }
  });

  // Handle GET requests (not supported for this server)
  hapiServer.route({
    method: 'GET',
    path: '/mcp',
    handler: (_request, h) => {
      log('/mcp Method Not Allowed - Use POST');
      return h.response('Method Not Allowed - Use POST').code(405).header('Allow', 'POST');
    }
  });

  hapiServer.ext('onPostResponse', (request, h) => {
    const response = request.response;
    // Log 500 errors
    if (response.isBoom && response.output.statusCode >= 500) {
      rollbar.error('HTTP 500 error', response, request);
    }

    return h.continue;
  });
  log('HAPI server created');
  return hapiServer;
};
