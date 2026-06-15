import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import path from 'node:path';

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
  'embeddedDeployment'
];

export const RESOURCE_TYPE_SET = new Set(RESOURCE_TYPES);
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
  'flow',
  'flowVersion',
  'applicationDashboard'
];

export const ALLOW_BULK_CREATE_TYPES = new Set([
  'deviceRecipe',
  'dataTableRow'
]);

export const ALLOW_UPDATE_MANY_TYPES = new Set(['event']);
export const NO_CREATE_TYPES = new Set(['event']);       // created by devices/workflows, not the LLM
export const NO_UPDATE_TYPES = new Set(['flowVersion']); // versions are immutable after creation

// require.resolve('losant-rest') returns .../losant-rest/lib/index.js
// Go up one directory from lib/ to get the package root
const require = createRequire(import.meta.url);
const losantRestMain = require.resolve('losant-rest');
const losantRestPath = path.dirname(path.dirname(losantRestMain));
export const DOCS_PATH = path.join(losantRestPath, 'docs');
export const SCHEMAS_PATH = path.join(losantRestPath, 'lib/schemas');

const DOC_FILES = readdirSync(DOCS_PATH);
export const MD_FILES = DOC_FILES.filter((f) => {
  const singleFileName = f.replace('.md', '').replace(/s$/, '');
  return f.endsWith('.md') && f !== '_schemas.md' && (RESOURCE_TYPE_SET.has(singleFileName) || singleFileName === 'data');
});

const WRITE_SCHEMA_SUFFIXES = new Set(
  WRITABLE_RESOURCE_TYPES.flatMap((t) => [`${t}Post`, `${t}Patch`])
);
WRITE_SCHEMA_SUFFIXES.add('deviceRecipeBulkCreatePost'); // special case for bulk create schema that doesn't follow the usual naming pattern

// Schemas whose canonical MCP name differs from the losant-rest filename.
// Keys are the exposed name (e.g. dataTableRowPost); values are the actual filename.
export const SCHEMA_FILE_ALIASES = {
  dataTableRowPost: 'dataTableRowInsert.json',
  dataTableRowPatch: 'dataTableRowInsertUpdate.json',
  // privateFile shares schemas with file
  privateFilePost: 'filePost.json',
  privateFilePatch: 'filePatch.json',
  // applicationDashboard has no separate Patch schema
  applicationDashboardPatch: 'applicationDashboardPost.json'
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
  'applicationJobLog'
]);
