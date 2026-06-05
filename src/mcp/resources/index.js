import path from 'node:path';
import { readFile } from 'node:fs/promises';
import advancedQueryGuide from './advanced-query-guide.js';
import queryToolGuide from './query-tool-guide.js';
import indexContent from './build-api-index-content.js';
import debug from 'debug';
import memoizee from 'memoizee';
import { DOCS_PATH, MD_FILES, RESOURCE_TYPE_SET, SCHEMA_FILES, SCHEMAS_PATH } from '../../constants.js';
const log = debug('losant-mcp-server:mcp:resources');

const GUIDES_TO_REGISTER = [
  advancedQueryGuide,
  queryToolGuide
];

const readFileContent = memoizee(async (filePath, mimeType, href) => {
  let fileInfo = await readFile(filePath, 'utf-8');
  if (mimeType === 'text/markdown') {
    // this will eventually become some sort of resource type to disclaimer map
    const fileName = path.basename(filePath, '.md');
    const isSingularResource = RESOURCE_TYPE_SET.has(fileName);
    let disclaimer = isSingularResource
      ? 'MCP exposes: get as operation "get". Other actions require the REST API directly.\n\n'
      : 'MCP exposes: get as operation "list". Other actions require the REST API directly.\n\n';
    if (filePath.endsWith('data.md')) {
      disclaimer = 'MCP exposes: timeSeriesQuery, and lastValueQuery. Other actions require the REST API directly.\n\n';
    } else if (filePath.endsWith('dataTableRows.md')) {
      disclaimer = 'MCP exposes: query as operation "list". Other actions require the REST API directly.\n\n';
    } else if (filePath.endsWith('device.md')) {
      disclaimer = 'MCP exposes: get, getState, getLogEntries, getCommand, getCompositeState. Other actions require the REST API directly.\n\n';
    }
    fileInfo = disclaimer + fileInfo;
  }
  return {
    contents: [{
      uri: href,
      mimeType,
      text: fileInfo
    }]
  };
}, { maxAge: 1000 * 60 * 60, primitive: true }); // cache for 1 hour

const registerFileResource = ({ resourceName, file, directory, type, mimeType }) => {
  const uriName = `losant://${type}/${resourceName}`;
  return {
    name: `${resourceName}-${type}`,
    uriName,
    resourceConfig: {
      title: `${resourceName} ${type.toUpperCase()}`,
      description: `Losant ${type} for ${resourceName}`,
      mimeType
    },
    content: async (uri) => {
      return readFileContent(path.join(directory, file), mimeType, uri.href);
    }
  };
};

export default (server) => {
  // the losant rest docs will always be available as resources, so we can use them to generate the input schema for our tools
  for (const file of MD_FILES) {
    const resource = registerFileResource({
      resourceName: file.replace('.md', ''),
      file,
      directory: DOCS_PATH,
      type: 'docs',
      mimeType: 'text/markdown'
    });
    server.registerResource(resource.name, resource.uriName, resource.resourceConfig, resource.content);
  }

  log(`Loading ${SCHEMA_FILES.length} query schema files...`);

  for (const file of SCHEMA_FILES) {
    const resource = registerFileResource({
      resourceName: file.replace('.json', ''),
      file,
      directory: SCHEMAS_PATH,
      type: 'schemas',
      mimeType: 'application/json'
    });
    server.registerResource(resource.name, resource.uriName, resource.resourceConfig, resource.content);
  }
  GUIDES_TO_REGISTER.forEach(({ name, uriName, resourceConfig, getContent }) => {
    server.registerResource(name, uriName, resourceConfig, getContent);
  });

  server.registerResource(
    'api-index',
    'losant://docs/index',
    {
      title: 'Losant API Documentation Index',
      description: 'Index of all Losant API documentation and query schemas',
      mimeType: 'text/markdown'
    },
    async (uri) => {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/markdown',
          text: indexContent
        }]
      };
    }
  );
};
