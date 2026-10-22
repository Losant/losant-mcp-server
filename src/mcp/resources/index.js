import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { ResourceTemplate } from '@modelcontextprotocol/server';
import advancedQueryGuide from './advanced-query-guide.js';
import deviceGuide from './device-guide.js';
import integrationGuide from './integration-guide.js';
import dataTableGuide from './data-table-guide.js';
import resourceJobGuide from './resource-job-guide.js';
import credentialGuide from './credential-guide.js';
import fileGuide from './file-guide.js';
import notebookGuide from './notebook-guide.js';
import experienceGuide from './experience-guide.js';
import deviceAuthGuide from './device-auth-guide.js';
import dashboardGuide from './dashboard-guide.js';
import flowGuide from './flow-guide.js';
import webhookGuide from './webhook-guide.js';
import flowAuthoringContent from './authoring/flows/flow.js';
import indexContent from './build-api-index-content.js';
// TOOL GUIDES — add new guides to ./tools/index.js
import TOOL_GUIDES_TO_REGISTER from './tools/index.js';

import conf from '../../config.js';
import memoizee from 'memoizee';
import { SCHEMA_NAME_TO_FILE, DOC_NAME_TO_FILE,
  DOCS_PATH, RESOURCE_TYPE_SET, SCHEMAS_PATH,
  WRITABLE_RESOURCE_TYPES, NO_CREATE_TYPES, DELETABLE_RESOURCE_TYPES, AUTHORING_HUB_TO_FILE,
  FLOW_NODE_TO_FILE, FLOW_NODE_TYPES, FLOW_TRIGGER_TO_FILE, DASHBOARD_BLOCK_TO_FILE,
  REFERENCES_TO_FILE, FLOW_NODE_META_NAME_TO_SPEC, NON_EXISTING_FLOW_NODE_TYPES,
  FLOW_TRIGGER_TYPE_TO_SPEC } from '../../constants.js';
import { getPluralResourceName } from '../tools/helpers.js';
import { resourceNotFoundError } from '../../helpers/errors.js';
import debug from 'debug';

const apiUrl = conf.get('losant.apiUrl');
const apiHost = new URL(apiUrl).hostname;
const brokerHost = apiHost.replace(/^api\./, 'broker.');
const infoPreamble = `# Losant MCP Server — Info

## About Losant
Losant is an IoT application enablement platform for building, connecting, and managing IoT solutions at scale. It provides connected devices via MQTT and REST, a visual flow engine for device automation and business logic, real-time dashboards for data visualization, Experience Builder for custom end-user web interfaces and APIs, and Edge Compute for running flows locally on gateway devices without cloud dependency.

## Environment
- **API URL**: ${apiUrl}
- **MQTT Broker Host**: ${brokerHost}

> The broker host is derived from the API URL by replacing \`api.\` with \`broker.\`. Use \`${brokerHost}\` as the \`BROKER_HOST\` environment variable when configuring the Losant Gateway Edge Agent — only set this if it differs from the default (\`broker.losant.com\`).

---

`;
const WRITABLE_RESOURCE_TYPE_SET = new Set(WRITABLE_RESOURCE_TYPES);
const DELETABLE_RESOURCE_TYPE_SET = new Set(DELETABLE_RESOURCE_TYPES);
// Set of plural API collection names for writable, creatable types — used to add the write disclaimer to plural doc pages.
// Built via getPluralResourceName so irregular plurals (e.g. applicationCertificateAuthorities) are handled correctly.
const WRITABLE_PLURAL_NAME_SET = new Set(
  WRITABLE_RESOURCE_TYPES.filter((t) => !NO_CREATE_TYPES.has(t)).map(getPluralResourceName)
);
const log = debug('losant-mcp-server:mcp:resources');
const GUIDES_TO_REGISTER = [
  advancedQueryGuide,
  credentialGuide,
  dataTableGuide,
  deviceGuide,
  deviceAuthGuide,
  dashboardGuide,
  experienceGuide,
  fileGuide,
  flowGuide,
  integrationGuide,
  notebookGuide,
  resourceJobGuide,
  webhookGuide
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
    if (filePath.endsWith('applicationDashboard.md') || filePath.endsWith('applicationDashboards.md')) {
      disclaimerLines.push('\nSee [losant://guides/dashboards](losant://guides/dashboards) for the block catalog, layout rules, context variables, and common flows.');
    }
    if (filePath.includes('applicationCertificate') || filePath.includes('applicationCertificateAuthority')) {
      disclaimerLines.push('\nSee [losant://guides/device-auth](losant://guides/device-auth) for the API/UI naming difference (Device Certificate vs. applicationCertificate), certificate authority setup, and MQTT mutual TLS authentication flow.');
    }
    if (filePath.endsWith('applicationKey.md') || filePath.endsWith('applicationKeys.md')) {
      disclaimerLines.push('\nSee [losant://guides/device-auth](losant://guides/device-auth) for MQTT credential fields, device restriction options, and the access secret one-time return behavior.');
    }
    if (filePath.endsWith('flow.md') || filePath.endsWith('flows.md') || filePath.endsWith('flowVersion.md') || filePath.endsWith('flowVersions.md')) {
      disclaimerLines.push('\nSee [losant://guides/flows](losant://guides/flows) for the full flow authoring guide — trigger catalog, node catalog, wiring model, payload reference, and templating.');
    }
    if (filePath.endsWith('webhook.md') || filePath.endsWith('webhooks.md')) {
      disclaimerLines.push('\nSee [losant://guides/webhooks](losant://guides/webhooks) for webhook resource fields, the id-vs-token invocation URL distinction, custom replies, verification, and basic auth.');
    }
    if (filePath.endsWith('data.md')) {
      disclaimerLines.push('- endpoint "timeSeriesQuery" used by tool `losant_timeseries` as operation "timeSeriesQuery"');
      disclaimerLines.push('- endpoint "lastValueQuery" used by tool `losant_timeseries` as operation "lastValueQuery"');
    } else if (filePath.endsWith('dataTableRows.md')) {
      disclaimerLines.push('- endpoint "query" used by tool `losant_query` as operation "list"');
    } else if (filePath.endsWith('device.md')) {
      disclaimerLines.push('- endpoint "get" used by tool `losant_query` as operation "get"');
      disclaimerLines.push('- endpoint "patch" used by tool `losant_write` as operation "updateOne"');
      disclaimerLines.push('- endpoint "delete" used by tool `losant_delete`');
      disclaimerLines.push('- endpoint "getState" used by tool `losant_timeseries` as operation "getState"');
      disclaimerLines.push('- endpoint "getLogEntries" used by tool `losant_timeseries` as operation "getLogEntries"');
      disclaimerLines.push('- endpoint "getCommand" used by tool `losant_timeseries` as operation "getCommand"');
      disclaimerLines.push('- endpoint "getCompositeState" used by tool `losant_timeseries` as operation "getCompositeState"');
      disclaimerLines.push('\nSee [losant://guides/devices](losant://guides/devices) for domain context, device classes, attribute constraints, and common procedures.');
    } else if (filePath.endsWith('flow.md')) {
      disclaimerLines.push('- endpoint "get" used by tool `losant_query` as operation "get"');
      if (isWritable) {
        disclaimerLines.push('- endpoint "patch" used by tool `losant_write` as operation "updateOne"');
      }
      if (DELETABLE_RESOURCE_TYPE_SET.has(fileName)) {
        disclaimerLines.push('- endpoint "delete" used by tool `losant_delete`');
      }
      disclaimerLines.push('- endpoints "stats" and "errors" both used by tool `losant_flow_diagnostics` (returned together in one call)');
      disclaimerLines.push('\nSee [losant://guides/tools/losant_flow_diagnostics](losant://guides/tools/losant_flow_diagnostics) for the response shape, parameter reference, and restrictions.');
    } else if (isSingularResource) {
      disclaimerLines.push('- endpoint "get" used by tool `losant_query` as operation "get"');
      if (isWritable) {
        disclaimerLines.push('- endpoint "patch" used by tool `losant_write` as operation "updateOne"');
      }
      if (DELETABLE_RESOURCE_TYPE_SET.has(fileName)) {
        disclaimerLines.push('- endpoint "delete" used by tool `losant_delete`');
      }
    } else {
      disclaimerLines.push('- endpoint "get" used by tool `losant_query` as operation "list"');
      if (WRITABLE_PLURAL_NAME_SET.has(fileName)) {
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

// Authoring files are served as-is — no Endpoint disclaimer prepended
const readAuthoringContent = memoizee(async (filePath, href) => {
  const text = await readFile(filePath, 'utf-8');
  return { contents: [{ uri: href, mimeType: 'text/markdown', text }] };
}, { maxAge: 1000 * 60 * 60, primitive: true });

export default (server) => {
  // +8 = losant://info, doc template, schema template, authoring-hub template, flow-node template, flow-trigger template, dashboard-block template, reference template
  log(`Registering ${GUIDES_TO_REGISTER.length + TOOL_GUIDES_TO_REGISTER.length + 8} resources...`);
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
  log('Registering resource templates...');
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
        throw resourceNotFoundError(`Doc not found: ${docName}`, { uri: uri.href });
      }
      return readFileContent(path.join(DOCS_PATH, file), 'text/markdown', uri.href);
    }
  );
  const serveMarkdown = (content) => async (uri) => {
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'text/markdown',
        text: content
      }]
    };
  };

  // 'flow' is served from the generated content in flow.js, not a static file - see AUTHORING_HUB_TO_FILE.
  const AUTHORING_HUB_TO_CONTENT = { flow: flowAuthoringContent };

  const toKebabCase = (str) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  // Resolves a bad flow-node spec-name guess to the likely intended spec. Handles three cases:
  // the real `type` passed directly ("DataTableQueryNode"), the real `meta.name` passed directly
  // ("get-table-rows"), and a plausible-but-wrong type guess ("GetTableRowsNode") reduced to its
  // kebab-case meta.name equivalent.
  const resolveNodeSpecHint = (nodeName) => {
    return FLOW_NODE_TYPES[nodeName]?.spec ||
      FLOW_NODE_META_NAME_TO_SPEC[nodeName] ||
      FLOW_NODE_META_NAME_TO_SPEC[toKebabCase(nodeName.replace(/Node$/, ''))];
  };

  GUIDES_TO_REGISTER.forEach(({ name, uriName, resourceConfig, content }) => {
    server.registerResource(name, uriName, resourceConfig, serveMarkdown(content));
  });

  TOOL_GUIDES_TO_REGISTER.forEach(({ toolName, resourceConfig, content }) => {
    server.registerResource(
      `guide-tool-${toolName}`,
      `losant://guides/tools/${toolName}`,
      { mimeType: 'text/markdown', ...resourceConfig },
      serveMarkdown(content)
    );
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
        throw resourceNotFoundError(`Schema not found: ${schemaName}`, { uri: uri.href });
      }
      return readFileContent(path.join(SCHEMAS_PATH, file), 'application/json', uri.href);
    }
  );

  server.registerResource(
    'authoring-hub',
    new ResourceTemplate('losant://authoring/{resourceType}', { list: undefined }),
    {
      title: 'Losant Authoring Guide',
      description: 'Hub authoring guide for complex Losant resources — discovered via guide links',
      mimeType: 'text/markdown'
    },
    async (uri, { resourceType }) => {
      if (AUTHORING_HUB_TO_CONTENT[resourceType]) {
        return serveMarkdown(AUTHORING_HUB_TO_CONTENT[resourceType])(uri);
      }
      const filePath = AUTHORING_HUB_TO_FILE[resourceType];
      if (!filePath) { throw resourceNotFoundError(`Authoring hub not found: ${resourceType}`, { uri: uri.href }); }
      return readAuthoringContent(filePath, uri.href);
    }
  );

  server.registerResource(
    'flow-node',
    new ResourceTemplate('losant://flow/nodes/{nodeType}', { list: undefined }),
    {
      title: 'Losant Flow Node',
      description: 'Per-node authoring detail for Losant flow nodes — discovered via losant://authoring/flow',
      mimeType: 'text/markdown'
    },
    async (uri, { nodeType }) => {
      const filePath = FLOW_NODE_TO_FILE[nodeType];
      if (!filePath) {
        const hint = resolveNodeSpecHint(nodeType);
        let hintText;
        if (hint) {
          hintText = `Did you mean losant://flow/nodes/${hint}? "${nodeType}" looks like it refers to the node type documented there — see the Node catalog in losant://authoring/flow for the full type-to-spec mapping.`;
        } else {
          // Doesn't reduce cleanly via resolveNodeSpecHint (e.g. assumed the ResourceType+Action+Node
          // pattern when the real type doesn't follow it) - check the hand-maintained escape hatch.
          const realType = NON_EXISTING_FLOW_NODE_TYPES[nodeType];
          const realSpec = realType && resolveNodeSpecHint(realType);
          hintText = realType
            ? `"${nodeType}" is not a valid node type. Did you mean "${realType}"? See losant://flow/nodes/${realSpec} for its spec.`
            : 'It does not exist — read losant://authoring/flow for the full Node catalog.';
        }
        throw resourceNotFoundError(`Flow node not found: ${nodeType}`, { uri: uri.href, hint: hintText });
      }
      return readAuthoringContent(filePath, uri.href);
    }
  );

  server.registerResource(
    'flow-trigger',
    new ResourceTemplate('losant://flow/triggers/{triggerType}', { list: undefined }),
    {
      title: 'Losant Flow Trigger',
      description: 'Per-trigger authoring detail for Losant flow triggers — discovered via losant://authoring/flow',
      mimeType: 'text/markdown'
    },
    async (uri, { triggerType }) => {
      const filePath = FLOW_TRIGGER_TO_FILE[triggerType];
      if (!filePath) {
        const hint = FLOW_TRIGGER_TYPE_TO_SPEC[triggerType];
        const hintText = hint
          ? `Did you mean losant://flow/triggers/${hint}? "${triggerType}" looks like it refers to the trigger type documented there — see the Trigger catalog in losant://authoring/flow for the full type-to-spec mapping.`
          : 'It does not exist — read losant://authoring/flow for the full Trigger catalog.';
        throw resourceNotFoundError(`Flow trigger not found: ${triggerType}`, { uri: uri.href, hint: hintText });
      }
      return readAuthoringContent(filePath, uri.href);
    }
  );

  server.registerResource(
    'dashboard-block',
    new ResourceTemplate('losant://dashboard/blocks/{blockType}', { list: undefined }),
    {
      title: 'Losant Dashboard Block',
      description: 'Per-block authoring detail for Losant dashboard blocks — discovered via losant://authoring/dashboard',
      mimeType: 'text/markdown'
    },
    async (uri, { blockType }) => {
      const filePath = DASHBOARD_BLOCK_TO_FILE[blockType];
      if (!filePath) { throw resourceNotFoundError(`Dashboard block not found: ${blockType}`, { uri: uri.href }); }
      return readAuthoringContent(filePath, uri.href);
    }
  );

  server.registerResource(
    'reference',
    new ResourceTemplate('losant://references/{resourceType}/{referenceName}', { list: undefined }),
    {
      title: 'Losant Authoring Reference',
      description: 'Cross-cutting reference docs for dashboard authoring — discovered via authoring guide links',
      mimeType: 'text/markdown'
    },
    async (uri, { resourceType, referenceName }) => {
      const key = `${resourceType}/${referenceName}`;
      const filePath = REFERENCES_TO_FILE[key];
      if (!filePath) { throw resourceNotFoundError(`Reference not found: ${key}`, { uri: uri.href }); }
      return readAuthoringContent(filePath, uri.href);
    }
  );

};
