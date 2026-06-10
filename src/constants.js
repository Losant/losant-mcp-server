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
export const SCHEMA_FILES = readdirSync(SCHEMAS_PATH).filter((f) => f.endsWith('.json') && f.includes('Query'));

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
