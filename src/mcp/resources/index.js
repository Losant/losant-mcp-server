import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'; // eslint-disable-line import/no-unresolved
import advancedQueryGuide from './advanced-query-guide.js';
import queryToolGuide from './query-tool-guide.js';
import writeToolGuide from './write-tool-guide.js';
import deviceGuide from './device-guide.js';
import integrationGuide from './integration-guide.js';
import dataTableGuide from './data-table-guide.js';
import resourceJobGuide from './resource-job-guide.js';
import credentialGuide from './credential-guide.js';
import fileGuide from './file-guide.js';
import notebookGuide from './notebook-guide.js';
import experienceGuide from './experience-guide.js';
import deviceAuthGuide from './device-auth-guide.js';
import indexContent from './build-api-index-content.js';
import conf from '../../config.js';
import debug from 'debug';

const apiUrl = conf.get('losant.apiUrl');
const apiHost = new URL(apiUrl).hostname;
const brokerHost = apiHost.replace(/^api\./, 'broker.');
const infoPreamble = `# Losant MCP Server — Info

## About Losant
Losant is an IoT application enablement platform for building, connecting, and managing IoT solutions at scale. It provides connected devices via MQTT and REST, a visual workflow engine for device automation and business logic, real-time dashboards for data visualization, Experience Builder for custom end-user web interfaces and APIs, and Edge Compute for running workflows locally on gateway devices without cloud dependency.

## Environment
- **API URL**: ${apiUrl}
- **MQTT Broker Host**: ${brokerHost}

> The broker host is derived from the API URL by replacing \`api.\` with \`broker.\`. Use \`${brokerHost}\` as the \`BROKER_HOST\` environment variable when configuring the Losant Gateway Edge Agent — only set this if it differs from the default (\`broker.losant.com\`).

---

`;
import memoizee from 'memoizee';
import { SCHEMA_NAME_TO_FILE, DOC_NAME_TO_FILE,
  DOCS_PATH, RESOURCE_TYPE_SET, SCHEMAS_PATH,
  WRITABLE_RESOURCE_TYPES, NO_CREATE_TYPES } from '../../constants.js';

const WRITABLE_RESOURCE_TYPE_SET = new Set(WRITABLE_RESOURCE_TYPES);
const log = debug('losant-mcp-server:mcp:resources');

const GUIDES_TO_REGISTER = [
  advancedQueryGuide,
  queryToolGuide,
  writeToolGuide,
  credentialGuide,
  dataTableGuide,
  deviceGuide,
  deviceAuthGuide,
  experienceGuide,
  fileGuide,
  integrationGuide,
  notebookGuide,
  resourceJobGuide
];

const readFileContent = memoizee(async (filePath, mimeType, href) => {
  let fileInfo = await readFile(filePath, 'utf-8');
  if (mimeType === 'text/markdown') {
    // this will eventually become some sort of resource type to disclaimer map
    const fileName = path.basename(filePath, '.md');
    const isSingularResource = RESOURCE_TYPE_SET.has(fileName);
    const isWritable = WRITABLE_RESOURCE_TYPE_SET.has(fileName);
    const disclaimerLines = ['## Endpoint to MCP Tools\n'];
    if (filePath.includes('device-recipe')) {
      disclaimerLines.push('\nSee [losant://guides/devices](losant://guides/devices) for domain context, the relationship between devices and device recipes, and common procedures.');
    }
    if (filePath.includes('integration')) {
      disclaimerLines.push('\nSee [losant://guides/integrations](losant://guides/integrations) for integration types, required config objects, and flow pairing.');
    }
    if (filePath.endsWith('dataTable.md') || filePath.endsWith('dataTables.md') || filePath.includes('dataTableRow')) {
      disclaimerLines.push('\nSee [losant://guides/data-tables](losant://guides/data-tables) for column schema rules, the dataTable/dataTableRow relationship, and common procedures.');
    }
    if (filePath.endsWith('resourceJob.md') || filePath.endsWith('resourceJobs.md')) {
      disclaimerLines.push('\nSee [losant://guides/resource-jobs](losant://guides/resource-jobs) for the iterate-resources-trigger-flow pattern, queryJson format, and concurrency settings.');
    }
    if (filePath.endsWith('credential.md') || filePath.endsWith('credentials.md')) {
      disclaimerLines.push('\nSee [losant://guides/credentials](losant://guides/credentials) for credential types, required config objects, and common procedures.');
    }

    if (filePath.endsWith('file.md') || filePath.endsWith('files.md') || filePath.endsWith('privateFile.md') || filePath.endsWith('privateFiles.md')) {
      disclaimerLines.push('\nSee [losant://guides/files](losant://guides/files) for the two-step create-then-upload pattern and public vs. private file differences.');
    }
    if (filePath.endsWith('notebook.md') || filePath.endsWith('notebooks.md')) {
      disclaimerLines.push('\nSee [losant://guides/notebooks](losant://guides/notebooks) for the two-step upload pattern and input/output type reference.');
    }
    if (filePath.includes('experience')) {
      disclaimerLines.push('\nSee [losant://guides/experiences](losant://guides/experiences) for the versioning model, view sub-types, endpoint access control, and common procedures.');
    }
    if (filePath.includes('applicationCertificate') || filePath.includes('applicationCertificateAuthority')) {
      disclaimerLines.push('\nSee [losant://guides/device-auth](losant://guides/device-auth) for the API/UI naming difference (Device Certificate vs. applicationCertificate), certificate authority setup, and MQTT mutual TLS authentication workflow.');
    }
    if (filePath.endsWith('applicationKey.md') || filePath.endsWith('applicationKeys.md')) {
      disclaimerLines.push('\nSee [losant://guides/device-auth](losant://guides/device-auth) for MQTT credential fields, device restriction options, and the access secret one-time return behavior.');
    }
    if (filePath.endsWith('data.md')) {
      disclaimerLines.push('- endpoint "timeSeriesQuery" used by tool `losant_timeseries` as operation "timeSeriesQuery"');
      disclaimerLines.push('- endpoint "lastValueQuery" used by tool `losant_timeseries` as operation "lastValueQuery"');
    } else if (filePath.endsWith('dataTableRows.md')) {
      disclaimerLines.push('- endpoint "query" used by tool `losant_query` as operation "list"');
    } else if (filePath.endsWith('device.md')) {
      disclaimerLines.push('- endpoint "get" used by tool `losant_query` as operation "get"');
      disclaimerLines.push('- endpoint "patch" used by tool `losant_write` as operation "updateOne"');
      disclaimerLines.push('- endpoint "getState" used by tool `losant_timeseries` as operation "getState"');
      disclaimerLines.push('- endpoint "getLogEntries" used by tool `losant_timeseries` as operation "getLogEntries"');
      disclaimerLines.push('- endpoint "getCommand" used by tool `losant_timeseries` as operation "getCommand"');
      disclaimerLines.push('- endpoint "getCompositeState" used by tool `losant_timeseries` as operation "getCompositeState"');
      disclaimerLines.push('\nSee [losant://guides/devices](losant://guides/devices) for domain context, device classes, attribute constraints, and common procedures.');
    } else if (isSingularResource) {
      disclaimerLines.push('- endpoint "get" used by tool `losant_query` as operation "get"');
      if (isWritable) {
        disclaimerLines.push('- endpoint "patch" used by tool `losant_write` as operation "updateOne"');
      }
    } else {
      disclaimerLines.push('- endpoint "get" used by tool `losant_query` as operation "list"');
      if (WRITABLE_RESOURCE_TYPE_SET.has(fileName.replace(/s$/, '')) && !NO_CREATE_TYPES.has(fileName.replace(/s$/, ''))) {
        disclaimerLines.push('- endpoint "post" used by tool `losant_write` as operation "createOne"');
      }
    }
    fileInfo = `${disclaimerLines.join('\n')}\n\n${fileInfo}`;
  }
  return {
    contents: [{
      uri: href,
      mimeType,
      text: fileInfo
    }]
  };
}, { maxAge: 1000 * 60 * 60, primitive: true }); // cache for 1 hour

export default (server) => {
  log(`Registering ${GUIDES_TO_REGISTER.length + 3} resources...`);
  server.registerResource(
    'info',
    'losant://info',
    {
      title: 'Losant MCP Server Info',
      description: 'Start here: Losant platform overview, environment info (API URL, MQTT broker host), and a discovery index of all guides, API documentation URIs, and schema URIs available in this MCP server',
      mimeType: 'text/markdown'
    },
    async (uri) => {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'text/markdown',
          text: infoPreamble + indexContent
        }]
      };
    }
  );
  server.registerResource(
    'doc',
    new ResourceTemplate('losant://docs/{docName}', { list: undefined }),
    {
      title: 'Losant API Documentation',
      description: 'Losant REST API documentation — discovered via guide and index links',
      mimeType: 'text/markdown'
    },
    async (uri, { docName }) => {
      const file = DOC_NAME_TO_FILE[docName];
      if (!file) {
        throw new Error(`Doc not found: ${docName}`);
      }
      return readFileContent(path.join(DOCS_PATH, file), 'text/markdown', uri.href);
    }
  );
  GUIDES_TO_REGISTER.forEach(({ name, uriName, resourceConfig, getContent }) => {
    server.registerResource(name, uriName, resourceConfig, getContent);
  });

  server.registerResource(
    'schema',
    new ResourceTemplate('losant://schemas/{schemaName}', { list: undefined }),
    {
      title: 'Losant JSON Schema',
      description: 'JSON schema for a Losant API request body or advanced query — discovered via guide links',
      mimeType: 'application/json'
    },
    async (uri, { schemaName }) => {
      const file = SCHEMA_NAME_TO_FILE[schemaName];
      if (!file) {
        throw new Error(`Schema not found: ${schemaName}`);
      }
      const schemaPath = path.isAbsolute(file) ? file : path.join(SCHEMAS_PATH, file);
      return readFileContent(schemaPath, 'application/json', uri.href);
    }
  );

};
