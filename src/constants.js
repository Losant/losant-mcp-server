import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pluralToSingluarResourceName = (pluralResourceName) => {
  if (pluralResourceName === 'applicationCertificateAuthorities') { return 'applicationCertificateAuthority'; }
  // Default to removing the trailing 's', e.g. devices -> device, flows -> flow, etc.
  return pluralResourceName.endsWith('s') ? pluralResourceName.slice(0, -1) : pluralResourceName;
};

export const RESOURCE_TYPES = [
  'application',         // Top-level resource for application lookup
  'event',
  'device',
  'applicationKey',      // access keys
  'deviceRecipe',
  'dataTable',
  'dataTableRow',        // nested under dataTable
  'webhook',
  'integration',
  'applicationDashboard',   // dashboards that are part of an application, as opposed to user or org dashboards
  'notebook',
  'flow',
  'flowVersion',         // nested under flow
  'resourceJob',
  'credential',
  'file',
  'privateFile',
  'experienceDomain',
  'experienceEndpoint',
  'experienceGroup',
  'experienceSlug',
  'experienceUser',
  'experienceVersion',
  'experienceView',
  'applicationJobLog',
  'edgeDeployment',
  'embeddedDeployment',
  'applicationCertificate',
  'applicationCertificateAuthority'
];

export const RESOURCE_TYPE_SET = new Set(RESOURCE_TYPES);
// applicationJobLog is omitted because we do not write them - the jobs created them it's a read only resource
// omitting embeddedDeployment until embedded authoring is complete
// omitting edgeDeployment I'm thinking this may go into a device or flow tool
export const WRITABLE_RESOURCE_TYPES = [
  'device',
  'deviceRecipe',
  'dataTable',
  'dataTableRow',
  'webhook',
  'integration',
  'resourceJob',
  'event',
  'applicationKey',
  'credential',
  'file',
  'privateFile',
  'notebook',
  'experienceDomain',
  'experienceEndpoint',
  'experienceGroup',
  'experienceSlug',
  'experienceUser',
  'experienceVersion',
  'experienceView',
  'application',
  'applicationReadme',
  'applicationCertificate',
  'applicationCertificateAuthority',
  'applicationDashboard',
  'flow',
  'flowVersion'
];

// events created by devices/flows, not the LLM
// applications and their readmes are not created by the MCP
export const NO_CREATE_TYPES = new Set(['event', 'application', 'applicationReadme']);

// require.resolve('losant-rest') returns .../losant-rest/lib/index.js
// Go up one directory from lib/ to get the package root
const require = createRequire(import.meta.url);
const losantRestMain = require.resolve('losant-rest');
const losantRestPath = path.dirname(path.dirname(losantRestMain));
export const DOCS_PATH = path.join(losantRestPath, 'docs');
export const SCHEMAS_PATH = path.join(losantRestPath, 'lib/schemas');

const DOC_FILES = readdirSync(DOCS_PATH);
export const MD_FILES = DOC_FILES.filter((f) => {
  const singleFileName = pluralToSingluarResourceName(f.replace('.md', ''));
  return f.endsWith('.md') && f !== '_schemas.md' && (RESOURCE_TYPE_SET.has(singleFileName) || singleFileName === 'data');
});

const WRITE_SCHEMA_SUFFIXES = new Set(
  WRITABLE_RESOURCE_TYPES.flatMap((t) => [`${t}Post`, `${t}Patch`])
);
WRITE_SCHEMA_SUFFIXES.add('deviceRecipeBulkCreatePost'); // special case for bulk create schema that doesn't follow the usual naming pattern

// Schemas whose canonical MCP name differs from the losant-rest filename.
// Keys are the exposed name; values are the actual filename.
export const SCHEMA_FILE_ALIASES = {
  // privateFile shares schemas with file
  privateFilePost: 'filePost.json',
  privateFilePatch: 'filePatch.json',
  // applicationDashboard has no separate Patch schema
  applicationDashboardPatch: 'dashboardPatch.json'
};
export const SCHEMA_FILES = readdirSync(SCHEMAS_PATH).filter((f) => {
  if (!f.endsWith('.json')) { return false; }
  const name = f.replace('.json', '');
  return name.includes('Query') || WRITE_SCHEMA_SUFFIXES.has(name);
});
// Excludes applicationKey, credential, applicationCertificate, applicationCertificateAuthority (sensitive),
// and types with no delete endpoint (applicationJobLog, edgeDeployment, embeddedDeployment).
export const DELETABLE_RESOURCE_TYPES = [
  'application',
  'event',
  'device',
  'deviceRecipe',
  'dataTable',
  'dataTableRow',
  'webhook',
  'integration',
  'applicationDashboard',
  'notebook',
  'flow',
  'flowVersion',
  'resourceJob',
  'file',
  'privateFile',
  'experienceDomain',
  'experienceEndpoint',
  'experienceGroup',
  'experienceSlug',
  'experienceUser',
  'experienceVersion',
  'experienceView'
];

// Maps a resource type to the domain guide covering it — rendered as the "Domain Guide" column
// in the query, write, and delete tool guides. Types with no domain guide are intentionally absent.
export const RESOURCE_TYPE_TO_GUIDE = {
  device: 'losant://guides/devices',
  deviceRecipe: 'losant://guides/devices',
  dataTable: 'losant://guides/data-tables',
  dataTableRow: 'losant://guides/data-tables',
  webhook: 'losant://guides/webhooks',
  integration: 'losant://guides/integrations',
  resourceJob: 'losant://guides/resource-jobs',
  credential: 'losant://guides/credentials',
  file: 'losant://guides/files',
  privateFile: 'losant://guides/files',
  notebook: 'losant://guides/notebooks',
  experienceDomain: 'losant://guides/experiences',
  experienceEndpoint: 'losant://guides/experiences',
  experienceGroup: 'losant://guides/experiences',
  experienceSlug: 'losant://guides/experiences',
  experienceUser: 'losant://guides/experiences',
  experienceVersion: 'losant://guides/experiences',
  experienceView: 'losant://guides/experiences',
  applicationDashboard: 'losant://guides/dashboards',
  flow: 'losant://guides/flows',
  flowVersion: 'losant://guides/flows',
  applicationKey: 'losant://guides/device-auth',
  applicationCertificate: 'losant://guides/device-auth',
  applicationCertificateAuthority: 'losant://guides/device-auth'
};

// Resources supported by the unified tool
export const NESTED_RESOURCES = {
  flowVersion: { parentField: 'flowId', parentType: 'flow' },
  dataTableRow: { parentField: 'dataTableId', parentType: 'dataTable' }
};


// Application-scoped resources that require applicationId
export const APPLICATION_RESOURCES = RESOURCE_TYPES.filter((r) => r !== 'application');

// Maps a resource type to the advanced (MongoDB-style) query schema its list operation accepts in
// the `query` parameter — rendered as the "Advanced Query Schema" column in the query tool guide.
// A type absent from this map does not support advanced queries.
export const RESOURCE_TYPE_TO_QUERY_SCHEMA = {
  device: 'advancedDeviceQuery',
  event: 'advancedEventQuery',
  applicationKey: 'advancedApplicationKeyQuery',
  flow: 'advancedFlowQuery',
  flowVersion: 'advancedFlowVersionQuery',
  experienceGroup: 'advancedExperienceGroupQuery',
  experienceUser: 'advancedExperienceUserQuery',
  dataTableRow: 'advancedQuery',
  applicationJobLog: 'advancedApplicationJobLogQuery',
  applicationCertificate: 'advancedApplicationCertQuery'
};

export const ALLOWS_ADVANCED_QUERIES_SET = new Set(Object.keys(RESOURCE_TYPE_TO_QUERY_SCHEMA));

// Fields stripped from each item of a `list` response, keyed by resource type — these are large
// enough that a full page of them would crowd out the rest of the context. The query tool returns a
// `_projection` notice naming them, and the query tool guide renders this map as the "Summary Fields
// on list" table. A type absent from this map is returned in full.
export const LIST_OMITTED_FIELDS = {
  applicationDashboard: ['blocks', 'contextConfiguration'],
  flow: ['nodes', 'triggers', 'iconData'],
  experienceView: ['body'],
  experienceDomain: ['sslCert', 'sslBundle'],
  application: ['globals', 'archiveConfig', 'readme'],
  embeddedDeployment: ['logs'],
  device: ['attributes.description', 'attributes.contentType', 'attributes.attributeTags', 'attributes.system']
};
LIST_OMITTED_FIELDS.edgeDeployment = LIST_OMITTED_FIELDS.embeddedDeployment; // same structure for edge and embedded deployments
LIST_OMITTED_FIELDS.flowVersion = LIST_OMITTED_FIELDS.flow; // same structure for flow and flowVersion

// Maps every valid schema name to its filename on disk (canonical + aliases)
export const SCHEMA_NAME_TO_FILE = Object.fromEntries([
  ...SCHEMA_FILES.map((f) => [f.replace('.json', ''), f]),
  ...Object.entries(SCHEMA_FILE_ALIASES)
]);

// Maps every valid doc name (URI path segment) to its filename on disk
export const DOC_NAME_TO_FILE = Object.fromEntries(
  MD_FILES.map((f) => [f.replace('.md', ''), f])
);

// Authoring content — deep-dive markdown files for dashboard construction
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const AUTHORING_PATH = path.join(__dirname, 'mcp/resources/authoring');

export const AUTHORING_HUB_TO_FILE = {
  'flow': path.join(AUTHORING_PATH, 'flows/flow.md'),
  'dashboard': path.join(AUTHORING_PATH, 'dashboards/dashboard-guide.md'),
  'experience-view': path.join(AUTHORING_PATH, 'experiences/experience-view.md'),
  'experience-endpoint': path.join(AUTHORING_PATH, 'experiences/experience-endpoint.md')
};

// Maps a resource type to the authoring guide for its body — rendered as the "Authoring Guide"
// column in the write tool guide. Only types with complex internal structure have one.
export const RESOURCE_TYPE_TO_AUTHORING_GUIDE = {
  flow: 'losant://authoring/flow',
  flowVersion: 'losant://authoring/flow',
  applicationDashboard: 'losant://authoring/dashboard',
  experienceView: 'losant://authoring/experience-view',
  experienceEndpoint: 'losant://authoring/experience-endpoint'
};

const flowNodesDir = path.join(AUTHORING_PATH, 'flows/nodes');
export const FLOW_NODE_TO_FILE = Object.fromEntries(
  readdirSync(flowNodesDir).filter((f) => f.endsWith('.md'))
    .map((f) => [f.replace('.md', ''), path.join(flowNodesDir, f)])
);

const flowTriggersDir = path.join(AUTHORING_PATH, 'flows/triggers');
export const FLOW_TRIGGER_TO_FILE = Object.fromEntries(
  readdirSync(flowTriggersDir).filter((f) => f.endsWith('.md'))
    .map((f) => [f.replace('.md', ''), path.join(flowTriggersDir, f)])
);

const dashboardBlocksDir = path.join(AUTHORING_PATH, 'dashboards/blocks');
export const DASHBOARD_BLOCK_TO_FILE = Object.fromEntries(
  readdirSync(dashboardBlocksDir).filter((f) => f.endsWith('.md'))
    .map((f) => [f.replace('.md', ''), path.join(dashboardBlocksDir, f)])
);

export const REFERENCES_TO_FILE = {
  'shared/handlebars': path.join(AUTHORING_PATH, 'reference/handlebars.md'),
  'flow/custom-nodes': path.join(AUTHORING_PATH, 'flows/reference/custom-nodes.md'),
  'flow/payload': path.join(AUTHORING_PATH, 'flows/reference/payload.md'),
  'flow/globals': path.join(AUTHORING_PATH, 'flows/reference/globals.md'),
  'flow/templating': path.join(AUTHORING_PATH, 'flows/reference/templating.md'),
  'flow/execution-model': path.join(AUTHORING_PATH, 'flows/reference/execution-model.md'),
  'flow/patterns': path.join(AUTHORING_PATH, 'flows/reference/patterns.md'),
  'flow/debug-patterns': path.join(AUTHORING_PATH, 'flows/reference/debug-patterns.md'),
  'experience/context-configuration': path.join(AUTHORING_PATH, 'experiences/reference/context-configuration.md'),
  'dashboard/context-configuration': path.join(AUTHORING_PATH, 'dashboards/reference/context-configuration.md'),
  'dashboard/templates': path.join(AUTHORING_PATH, 'dashboards/reference/templates.md'),
  'dashboard/device-queries': path.join(AUTHORING_PATH, 'dashboards/reference/device-queries.md'),
  'dashboard/aggregations': path.join(AUTHORING_PATH, 'dashboards/reference/aggregations.md')
};
