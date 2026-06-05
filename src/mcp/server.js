import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'; // eslint-disable-line import/no-unresolved
import { createClient } from 'losant-rest';
import loadResources from './resources/index.js';
import registerTools from './tools/index.js';
import conf from '../config.js';
import rollbar from '../helpers/rollbar.js';
import pkg from '../../package.json' with { type: 'json' };


/**
 * Create MCP server bound to a specific bearer token
 * @param {string} bearerToken - OAuth bearer token for this session
 * @returns {Object} MCP server instance
*/
export const createMCPServer = async (bearerToken) => {
  try {
    const { title, iconUrl } = conf.get('mcp');
    const icons = [];
    if (iconUrl) {
      icons.push({
        src: iconUrl,
        sizes: [ 'any' ],
        mimeType: 'image/svg+xml',
        theme: 'dark'
      });
    }
    const server = new McpServer({
      name: pkg.name,
      title: `${title} MCP Server`,
      icons,
      description: pkg.description,
      version: pkg.version,
      websiteUrl: pkg.homepage
    });

    // Create losant-rest client with this bearer token
    const losantClient = createClient({
      accessToken: bearerToken,
      url: conf.get('losant.apiUrl')
    });

    // Load resources (docs don't need auth)
    loadResources(server);

    // Register tools with the client bound to this token
    registerTools(server, losantClient);

    return server;
  } catch (error) {
    rollbar.error('Error in createMCPServer', error);
    throw error;
  }
};
