import config from '../config.js';
import debug from 'debug';
import rollbar from '../helpers/rollbar.js';
import memoize from 'memoizee';
const log = debug('losant-mcp-server:oauth-discovery');

/**
 * Fetch authorization server metadata from Losant API
 * RFC 8414: OAuth 2.0 Authorization Server Metadata
 */
export const fetchAuthServerMetadata = memoize(async () => {
  const apiUrl = config.get('losant.apiUrl');
  const metadataUrl = `${apiUrl}/.well-known/oauth-authorization-server`;

  try {
    log('Fetching authorization server metadata from %s', metadataUrl);
    const response = await fetch(metadataUrl);

    if (!response.ok) {
      log('Failed to fetch metadata: HTTP %d', response.status);

      rollbar.warn('Failed to fetch authorization server metadata', {
        status: response.status,
        url: metadataUrl
      });
      return null;
    }

    const metadata = await response.json();
    log('Successfully fetched metadata with %d scopes', metadata.scopes_supported?.length || 0);
    return metadata;
  } catch (error) {
    rollbar.error('Error fetching authorization server metadata', {
      error: error.message,
      errorName: error.name,
      url: metadataUrl
    });
    return null;
  }
}, { promise: true, maxAge: 300000, primitive: true }); // Cache for 5 minutes

/**
 * Create OAuth 2.0 Protected Resource Metadata endpoint
 * @returns {Object} Hapi route configuration
 */
export const createAuthServerMetadataRoute = () => ({
  method: 'GET',
  path: '/.well-known/oauth-protected-resource',
  handler: async (_request, h) => {
    const resourceUrl = config.get('losant.resourceUrl');
    const mcpUrl = `${resourceUrl}/mcp`;
    try {
      const metadata = await fetchAuthServerMetadata();
      const scopes = metadata?.scopes_supported || config.get('losant.scopes');
      return h.response({
        resource: mcpUrl,
        authorization_servers: [config.get('losant.apiUrl')],
        bearer_methods_supported: ['header'],
        scopes_supported: scopes
      }).type('application/json');
    } catch (error) {
      rollbar.error('OAuth discovery endpoint error', { error });
      return h.response({
        resource: mcpUrl,
        authorization_servers: [config.get('losant.apiUrl')],
        bearer_methods_supported: ['header'],
        scopes_supported: config.get('losant.scopes')
      }).type('application/json');
    }
  }
});

export const createOAuthServerRoute = () => ({
  method: 'GET',
  path: '/.well-known/oauth-authorization-server',
  handler: async (_request, h) => {
    try {
      const metadata = await fetchAuthServerMetadata();
      return h.response(metadata).type('application/json');
    } catch (error) {
      rollbar.error('OAuth discovery endpoint error', { error });
      return h.response(error.message || 'Auth Authorization Server Error').code(503);
    }
  }
});
