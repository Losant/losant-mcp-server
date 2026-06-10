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
  'experienceView'
];

export const RESOURCE_TYPE_SET = new Set(RESOURCE_TYPES);

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
export const WRITABLE_RESOURCE_TYPES = ['deviceRecipe', 'dataTable', 'webhook', 'integration', 'resourceJob'];

const WRITE_SCHEMA_SUFFIXES = new Set(
  WRITABLE_RESOURCE_TYPES.flatMap((t) => [`${t}Post`, `${t}Patch`])
);

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
  'experienceUser'
]);
