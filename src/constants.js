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
  'applicationDashboard'
  // 'flow', will be added in another branch
  // 'flowVersion', will be added in another branch
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
// Resources supported by the unified tool
export const NESTED_RESOURCES = {
  flowVersion: { parentField: 'flowId', parentType: 'flow' },
  dataTableRow: { parentField: 'dataTableId', parentType: 'dataTable' }
};


// Application-scoped resources that require applicationId
export const APPLICATION_RESOURCES = RESOURCE_TYPES.filter((r) => r !== 'application');

export const ALLOWS_ADVANCED_QUERIES_SET = new Set([
  'device',
  'event',
  'applicationKey',
  'flow',
  'flowVersion',
  'experienceGroup',
  'dataTableRow',
  'experienceUser',
  'applicationJobLog',
  'applicationCertificate'
]);

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
  dashboard: path.join(AUTHORING_PATH, 'dashboards/dashboard-guide.md')
};

const dashboardBlocksDir = path.join(AUTHORING_PATH, 'dashboards/blocks');
export const DASHBOARD_BLOCK_TO_FILE = Object.fromEntries(
  readdirSync(dashboardBlocksDir).filter((f) => f.endsWith('.md'))
    .map((f) => [f.replace('.md', ''), path.join(dashboardBlocksDir, f)])
);

export const REFERENCES_TO_FILE = {
  'dashboard/context-configuration': path.join(AUTHORING_PATH, 'dashboards/reference/context-configuration.md')
};
