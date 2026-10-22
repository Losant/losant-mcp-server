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

// Response schemas for non-CRUD tool outputs (e.g. losant_flow_diagnostics) - exposed via
// losant://schemas like SCHEMA_FILES, but kept separate because they are neither a Query nor a
// Post/Patch schema, so they get their own index section in build-api-index-content.js.
export const RESPONSE_SCHEMA_FILES = ['flowStats.json', 'flowErrors.json'];
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
  ...RESPONSE_SCHEMA_FILES.map((f) => [f.replace('.json', ''), f]),
  ...Object.entries(SCHEMA_FILE_ALIASES)
]);

// Maps every valid doc name (URI path segment) to its filename on disk
export const DOC_NAME_TO_FILE = Object.fromEntries(
  MD_FILES.map((f) => [f.replace('.md', ''), f])
);

// Authoring content — deep-dive markdown files for dashboard construction
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const AUTHORING_PATH = path.join(__dirname, 'mcp/resources/authoring');

// 'flow' is not here - its content is generated (see flow.js) and registered directly in
// resources/index.js, not read from a static file.
export const AUTHORING_HUB_TO_FILE = {
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

// Single source of truth for the flow.js "## Node catalog" table (Type -> meta.name, meta.category,
// Available, Spec). Also used by the flow-node resource handler to turn a bad spec-name guess (an
// LLM passing the actual `type`, e.g. "DataTableQueryNode", or a plausible-but-wrong guess like
// "GetTableRowsNode") into a "did you mean" hint instead of a bare not-found error.
export const FLOW_NODE_TYPES = {
  AnnotationNode: { name: 'note', category: 'annotation', available: ['all'], spec: 'annotation' },
  ArrayNode: { name: 'array', category: 'logic', available: ['all'], spec: 'array' },
  AwsLambdaNode: { name: 'aws-lambda', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'aws' },
  AwsS3GetNode: { name: 'aws-s3-get', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'aws' },
  AwsS3PutNode: { name: 'aws-s3-put', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'aws' },
  AzureBlobStorageGetNode: { name: 'azure-blob-storage-get', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'azure-data' },
  AzureBlobStoragePutNode: { name: 'azure-blob-storage-put', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'azure-data' },
  AzureFunctionNode: { name: 'azure-function', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'azure-data' },
  AzureTableStorageNode: { name: 'azure-table-storage', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'azure-data' },
  AzureEventHubPublishNode: { name: 'azureEventHubPublish', category: 'output', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'azure-event-hubs-send' },
  BranchOnChangeNode: { name: 'onchange', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'on-change' },
  ConditionalNode: { name: 'conditional', category: 'logic', available: ['all'], spec: 'conditional' },
  CreateDeviceNode: { name: 'create-device', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'device' },
  CSVDecodeNode: { name: 'csv-decode', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'csv' },
  CSVEncodeNode: { name: 'csv-encode', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'csv' },
  CryptoSignNode: { name: 'crypto-sign', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'crypto' },
  CryptoVerifyNode: { name: 'crypto-verify', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'crypto' },
  DataTableDeleteRowNode: { name: 'delete-table-row', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'data-table' },
  DataTableQueryNode: { name: 'get-table-rows', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'data-table' },
  DataTableInsertRowNode: { name: 'insert-table-row', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'data-table' },
  DataTableUpdateRowNode: { name: 'update-table-row', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'data-table' },
  DateTimeNode: { name: 'date-time', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'date-time' },
  DebugNode: { name: 'debug', category: 'debug', available: ['all'], spec: 'debug' },
  DelayNode: { name: 'delay', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'delay' },
  DeviceSendCommandNode: { name: 'device-command', category: 'output', available: ['cloud', 'exp', 'custom'], spec: 'device-command' },
  DeviceDeleteWorkflowNode: { name: 'delete-device', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'device' },
  GetDeviceNode: { name: 'get-device', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'device' },
  DeviceChangeStateNode: { name: 'device-state', category: 'output', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'device-state' },
  EdgeDeployNode: { name: 'edge-deploy', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'edge-deploy' },
  StructureEmailNode: { name: 'structure-email', category: 'output', available: ['cloud', 'exp', 'custom'], spec: 'email' },
  EndpointReplyNode: { name: 'endpoint-reply', category: 'output', available: ['cloud', 'exp', 'custom'], spec: 'endpoint-reply' },
  EventCreateNode: { name: 'create-event', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'event' },
  DeleteEventNode: { name: 'delete-event', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'event' },
  EventGetNode: { name: 'get-event', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'event' },
  EventUpdateNode: { name: 'update-event', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'event' },
  FileCreateNode: { name: 'file-create', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'file' },
  FileGetNode: { name: 'file-get', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'file' },
  GaugeNode: { name: 'gauge', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'time-series' },
  GenerateIdNode: { name: 'generate-id', category: 'logic', available: ['all'], spec: 'generate-id' },
  GeofenceNode: { name: 'geofence', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'geofence' },
  GetValueNode: { name: 'get-value', category: 'data', available: ['all'], spec: 'storage' },
  GoogleBigQueryNode: { name: 'google-bigquery', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'google-data' },
  GoogleCloudStorageGetNode: { name: 'google-cloud-storage-get', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'google-data' },
  GoogleCloudStoragePutNode: { name: 'google-cloud-storage-put', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'google-data' },
  GoogleFunctionNode: { name: 'google-function', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'google-data' },
  GoogleMlNode: { name: 'google-ml', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'google-data' },
  GooglePublishNode: { name: 'google-publish', category: 'output', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'google-pub-sub-send' },
  HashNode: { name: 'hash', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'crypto' },
  HttpNode: { name: 'http', category: 'data/output', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'http' },
  HttpResponseNode: { name: 'http-response', category: 'output', available: ['edge'], spec: 'http-response' },
  JsonDecodeNode: { name: 'json-decode', category: 'logic', available: ['all'], spec: 'json-decode' },
  JsonEncodeNode: { name: 'json-encode', category: 'logic', available: ['all'], spec: 'json-encode' },
  JWTCreateNode: { name: 'jwt-create', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'jwt' },
  JWTDecodeNode: { name: 'jwt-decode', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'jwt' },
  JWTVerifyNode: { name: 'jwt-verify', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'jwt' },
  LatchNode: { name: 'latch', category: 'logic', available: ['all'], spec: 'latch' },
  LosantApiNode: { name: 'losantapi', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'losant-api' },
  LoopCapNode: { name: 'loop-return', category: 'loop', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'loop' },
  LoopNode: { name: 'loop', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'loop' },
  MailgunNode: { name: 'mailgun', category: 'output', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'mailgun' },
  MathNode: { name: 'math', category: 'logic', available: ['all'], spec: 'math' },
  MongoNode: { name: 'mongo', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'mongo' },
  MqttMessageNode: { name: 'mqtt', category: 'output', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'mqtt-output' },
  MutateNode: { name: 'mutate', category: 'logic', available: ['all'], spec: 'mutate' },
  NotebookExecuteNode: { name: 'notebook-execute', category: 'output', available: ['cloud', 'exp', 'custom'], spec: 'notebook-execute' },
  ObjectNode: { name: 'object', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'object' },
  ParticleCallNode: { name: 'particle-call', category: 'output', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'particle-call' },
  RandomNumberNode: { name: 'random-number', category: 'logic', available: ['all'], spec: 'random-number' },
  RegisterDeviceCertificateNode: { name: 'register-device-certificate', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'register-device-certificate' },
  RawFunctionNode: { name: 'function', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'function' },
  RedisNode: { name: 'redis', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'redis-node' },
  ResourceJobAcknowledgeNode: { name: 'resource-job-acknowledge', category: 'output', available: ['cloud', 'exp', 'custom'], spec: 'job' },
  ResourceJobExecuteNode: { name: 'resource-job-execute', category: 'output', available: ['cloud', 'exp', 'custom'], spec: 'job' },
  SalesforceNode: { name: 'salesforce-service', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'salesforce' },
  SendgridEmailNode: { name: 'sendgrid', category: 'output', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'sendgrid' },
  ServiceNowNode: { name: 'service-now', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'service-now' },
  SlackNode: { name: 'slack', category: 'output', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'slack' },
  SnowflakeNode: { name: 'snowflake', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'snowflake' },
  SqlNode: { name: 'sql', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'sql' },
  SqsSendNode: { name: 'sqs-send', category: 'output', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'sqs-send' },
  StoreValueNode: { name: 'store-value', category: 'data', available: ['all'], spec: 'storage' },
  StringNode: { name: 'string', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'string' },
  SwitchNode: { name: 'switch', category: 'logic', available: ['all'], spec: 'switch' },
  ThrowErrorNode: { name: 'throw-error', category: 'debug', available: ['all'], spec: 'throw-error' },
  ThrottleNode: { name: 'throttle', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'throttle' },
  TimeRangeNode: { name: 'time-range', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'time-range' },
  TimeSeriesNode: { name: 'time-series', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'time-series' },
  TwilioSmsNode: { name: 'twilio', category: 'output', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'twilio' },
  UdpSendNode: { name: 'udp-send', category: 'output', available: ['edge'], spec: 'udp-send' },
  UpdateDeviceNode: { name: 'update-device', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'device' },
  ValidatePayloadNode: { name: 'validate-payload', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'validate-payload' },
  WebhookReplyNode: { name: 'webhook-reply', category: 'output', available: ['cloud', 'exp', 'custom'], spec: 'webhook-reply' },
  WebsocketMessageNode: { name: 'websocket', category: 'output', available: ['cloud', 'exp', 'custom'], spec: 'websocket-message' },
  WhatsAppNode: { name: 'whatsapp', category: 'output', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'whatsapp' },
  WorkflowTriggerNode: { name: 'workflow-trigger', category: 'output', available: ['cloud', 'exp', 'custom'], spec: 'workflow-trigger' },
  AgentConfigGetNode: { name: 'agent-config-get', category: 'data', available: ['edge'], spec: 'agent-config' },
  AgentConfigSetNode: { name: 'agent-config-set', category: 'data', available: ['edge'], spec: 'agent-config' },
  AllenBradleyReadNode: { name: 'allen-bradley-read', category: 'data', available: ['edge'], spec: 'allen-bradley' },
  AllenBradleyWriteNode: { name: 'allen-bradley-write', category: 'data', available: ['edge'], spec: 'allen-bradley' },
  BacnetReadNode: { name: 'bacnet-read', category: 'data', available: ['edge'], spec: 'bacnet' },
  BacnetWhoIsNode: { name: 'bacnet-who-is', category: 'data', available: ['edge'], spec: 'bacnet' },
  BacnetWriteNode: { name: 'bacnet-write', category: 'data', available: ['edge'], spec: 'bacnet' },
  BeckhoffReadNode: { name: 'beckhoff-read', category: 'data', available: ['edge'], spec: 'beckhoff-nodes' },
  BeckhoffWriteNode: { name: 'beckhoff-write', category: 'data', available: ['edge'], spec: 'beckhoff-nodes' },
  CertificateCreateNode: { name: 'certificate-create', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'certificate' },
  CertificateReadNode: { name: 'certificate-read', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'certificate' },
  CreateAccessKeyNode: { name: 'create-access-key', category: 'data', available: ['cloud', 'exp', 'custom'], spec: 'access-key' },
  CreateExperienceGroupNode: { name: 'create-experience-group', category: 'experience', available: ['cloud', 'exp', 'custom'], spec: 'experience-group' },
  CreateExperienceUserNode: { name: 'create-experience-user', category: 'experience', available: ['cloud', 'exp', 'custom'], spec: 'experience-user' },
  DatadogLogsWriteNode: { name: 'datadog-logs-write', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'datadog' },
  DeleteExperienceUserNode: { name: 'delete-experience-user', category: 'experience', available: ['cloud', 'exp', 'custom'], spec: 'experience-user' },
  ExecuteNode: { name: 'run-executable', category: 'data', available: ['edge'], spec: 'run-executable' },
  ExperienceGroupSummaryNode: { name: 'group-summary', category: 'experience', available: ['cloud', 'exp', 'custom'], spec: 'experience-group' },
  ExperienceUserAuthNode: { name: 'experience-user-auth', category: 'experience', available: ['cloud', 'exp', 'custom'], spec: 'experience-auth' },
  ExperienceUserTokenNode: { name: 'experience-user-token', category: 'experience', available: ['cloud', 'exp', 'custom'], spec: 'experience-auth' },
  FileReadNode: { name: 'file-read', category: 'data', available: ['edge'], spec: 'edge-file' },
  FileWriteNode: { name: 'file-write', category: 'data', available: ['edge'], spec: 'edge-file' },
  FTPGetNode: { name: 'ftp-get', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'ftp' },
  FTPPutNode: { name: 'ftp-put', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'ftp' },
  GetExperienceGroupNode: { name: 'get-experience-group', category: 'experience', available: ['cloud', 'exp', 'custom'], spec: 'experience-group' },
  GetExperienceUserNode: { name: 'get-experience-user', category: 'experience', available: ['cloud', 'exp', 'custom'], spec: 'experience-user' },
  GetPeripheralNode: { name: 'get-peripheral', category: 'data', available: ['edge'], spec: 'peripheral-get' },
  HtmlParserNode: { name: 'html-parser', category: 'logic', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'html-parser' },
  LogglyWriteNode: { name: 'loggly-write', category: 'data', available: ['cloud', 'exp', 'edge', 'custom'], spec: 'loggly' },
  ModbusReadNode: { name: 'modbus-read', category: 'data', available: ['edge'], spec: 'modbus' },
  ModbusWriteNode: { name: 'modbus-write', category: 'data', available: ['edge'], spec: 'modbus' },
  OpcUaBrowseNode: { name: 'opcua-browse', category: 'data', available: ['edge'], spec: 'opcua-nodes' },
  OpcUaCallNode: { name: 'opcua-call', category: 'data', available: ['edge'], spec: 'opcua-nodes' },
  OpcUaReadNode: { name: 'opcua-read', category: 'data', available: ['edge'], spec: 'opcua-nodes' },
  OpcUaWriteNode: { name: 'opcua-write', category: 'data', available: ['edge'], spec: 'opcua-nodes' },
  OtelLogsWriteNode: { name: 'otel-logs-write', category: 'data', available: ['edge'], spec: 'otel-logs-write' },
  OtelMetricsWriteNode: { name: 'otel-metrics-write', category: 'data', available: ['edge'], spec: 'otel-metrics-write' },
  S7ReadNode: { name: 's7-read', category: 'data', available: ['edge'], spec: 'siemens-s7' },
  S7WriteNode: { name: 's7-write', category: 'data', available: ['edge'], spec: 'siemens-s7' },
  SamlLoginRedirectNode: { name: 'saml-login', category: 'experience', available: ['cloud', 'exp', 'custom'], spec: 'saml' },
  SamlVerifyNode: { name: 'saml-verify', category: 'experience', available: ['cloud', 'exp', 'custom'], spec: 'saml' },
  SnmpGetSubtreeNode: { name: 'snmp-get-subtree', category: 'data', available: ['edge'], spec: 'snmp-nodes' },
  SnmpReadNode: { name: 'snmp-read', category: 'data', available: ['edge'], spec: 'snmp-nodes' },
  SnmpWriteNode: { name: 'snmp-write', category: 'data', available: ['edge'], spec: 'snmp-nodes' },
  StructureSmsNode: { name: 'structure-sms', category: 'output', available: ['cloud', 'exp', 'custom'], spec: 'sms' },
  TensorFlowPredictNode: { name: 'tensorflow-predict', category: 'data', available: ['edge'], spec: 'tensorflow' },
  UpdateExperienceGroupNode: { name: 'update-experience-group', category: 'experience', available: ['cloud', 'exp', 'custom'], spec: 'experience-group' },
  UpdateExperienceUserNode: { name: 'update-experience-user', category: 'experience', available: ['cloud', 'exp', 'custom'], spec: 'experience-user' },
  VerifyDeviceNode: { name: 'verify-experience-device', category: 'experience', available: ['cloud', 'exp', 'custom'], spec: 'experience-user' },
  VerifyExperienceGroupNode: { name: 'verify-experience-group', category: 'experience', available: ['cloud', 'exp', 'custom'], spec: 'experience-group' }
};
// Plausible-but-wrong type guesses that don't reduce cleanly to a real meta.name (so the
// kebab-case fallback in resolveNodeSpecHint can't catch them) - maps the guess to the real
// `type` it was probably meant to be, e.g. an LLM assuming the ResourceType+Action+Node pattern
// (DataTableGetRowNode) instead of the real name (DataTableQueryNode).
export const NON_EXISTING_FLOW_NODE_TYPES = {
  DataTableGetRowNode: 'DataTableQueryNode',
  DeviceCreateNode: 'CreateDeviceNode',
  DeviceGetNode: 'GetDeviceNode',
  DeviceDeleteNode: 'DeviceDeleteWorkflowNode',
  DeleteDeviceNode: 'DeviceDeleteWorkflowNode',
  DeviceDeployNode: 'EdgeDeployNode',
  EmailNode: 'MailgunNode',
  AccessKeyCreateNode: 'CreateAccessKeyNode',
  ExperienceGroupCreateNode: 'CreateExperienceGroupNode',
  ExperienceGroupGetNode: 'GetExperienceGroupNode',
  ExperienceGroupUpdateNode: 'UpdateExperienceGroupNode',
  ExperienceUserCreateNode: 'CreateExperienceUserNode',
  ExperienceUserDeleteNode: 'DeleteExperienceUserNode',
  ExperienceUserGetNode: 'GetExperienceUserNode',
  PeripheralGetNode: 'GetPeripheralNode',
  ExperienceUserUpdateNode: 'UpdateExperienceUserNode',
  DeviceVerifyNode: 'VerifyDeviceNode',
  VerifyExperienceDeviceNode: 'VerifyDeviceNode',
  ExperienceGroupVerifyNode: 'VerifyExperienceGroupNode',
  EventDeleteNode: 'DeleteEventNode',
  CreateFileNode: 'FileCreateNode',
  GetFileNode: 'FileGetNode'
};

// meta.name -> spec, derived from the same FLOW_NODE_TYPES map that generates flow.js's Node
// catalog table, so a bad node spec-name guess can be resolved to a hint instead of a bare error.
export const FLOW_NODE_META_NAME_TO_SPEC = Object.fromEntries(
  Object.values(FLOW_NODE_TYPES).map(({ name, spec }) => [name, spec])
);

const flowTriggersDir = path.join(AUTHORING_PATH, 'flows/triggers');
export const FLOW_TRIGGER_TO_FILE = Object.fromEntries(
  readdirSync(flowTriggersDir).filter((f) => f.endsWith('.md'))
    .map((f) => [f.replace('.md', ''), path.join(flowTriggersDir, f)])
);

// Single source of truth for the flow.js "## Trigger catalog" table (Type, Available, Spec) - the
// trigger analog of FLOW_NODE_TYPES above. `aliases` are other real `type` values that share the
// same spec doc (e.g. deviceId/deviceTag both document as device-state). `qualifier` marks the six
// `integration` sub-kinds, which all share `type: "integration"` and are only distinguishable by
// `config` - intentionally excluded from FLOW_TRIGGER_TYPE_TO_SPEC below since "integration" alone
// is ambiguous, not resolvable to one spec.
export const FLOW_TRIGGER_TYPES = [
  { type: 'appFile', available: ['cloud'], spec: 'app-file' },
  { type: 'beckhoff', available: ['edge'], spec: 'beckhoff' },
  { type: 'customNodeStart', available: ['custom'], spec: 'custom-node-start' },
  { type: 'dataTable', available: ['cloud'], spec: 'data-table' },
  { type: 'deviceCommand', available: ['edge'], spec: 'device-command' },
  { type: 'deviceCreate', available: ['cloud'], spec: 'device-create' },
  { type: 'deviceId', aliases: ['deviceTag'], available: ['cloud'], spec: 'device-state' },
  { type: 'deviceIdConnect', aliases: ['deviceTagConnect'], available: ['cloud'], spec: 'device-connect' },
  { type: 'deviceIdDisconnect', aliases: ['deviceTagDisconnect'], available: ['cloud'], spec: 'device-disconnect' },
  { type: 'deviceIdInactivity', aliases: ['deviceTagInactivity'], available: ['cloud'], spec: 'device-inactive' },
  { type: 'endpoint', available: ['exp'], spec: 'endpoint' },
  { type: 'event', available: ['cloud'], spec: 'event' },
  { type: 'fileTail', available: ['edge'], spec: 'file-tail' },
  { type: 'fileWatch', available: ['edge'], spec: 'file-watch' },
  { type: 'flowError', available: ['cloud', 'exp', 'edge'], spec: 'flow-error' },
  { type: 'inboundEmail', available: ['cloud'], spec: 'email' },
  { type: 'integration', qualifier: 'Amazon SQS', available: ['cloud'], spec: 'amazon-sqs' },
  { type: 'integration', qualifier: 'Azure Event Hubs', available: ['cloud'], spec: 'azure-event-hubs' },
  { type: 'integration', qualifier: 'GCP Pub/Sub', available: ['cloud'], spec: 'google-pub-sub' },
  { type: 'integration', qualifier: 'MQTT', available: ['cloud'], spec: 'mqtt-topic' },
  { type: 'integration', qualifier: 'Particle', available: ['cloud'], spec: 'particle' },
  { type: 'integration', qualifier: 'WebSocket', available: ['cloud'], spec: 'websocket' },
  { type: 'mqttTopic', available: ['cloud', 'edge'], spec: 'mqtt-topic' },
  { type: 'notebook', available: ['cloud'], spec: 'notebook' },
  { type: 'onBoot', available: ['edge'], spec: 'on-boot' },
  { type: 'onConnect', available: ['edge'], spec: 'device-connect' },
  { type: 'onDisconnect', available: ['edge'], spec: 'device-disconnect' },
  { type: 'onSync', available: ['edge'], spec: 'application-sync' },
  { type: 'opcua', available: ['edge'], spec: 'opcua' },
  { type: 'redis', available: ['edge'], spec: 'redis' },
  { type: 'request', available: ['edge'], spec: 'http-request' },
  { type: 'resourceJobComplete', available: ['cloud'], spec: 'resource-job' },
  { type: 'resourceJobIteration', available: ['cloud'], spec: 'resource-job' },
  { type: 'resourceJobIterationTimeout', available: ['cloud'], spec: 'resource-job' },
  { type: 'serial', available: ['edge'], spec: 'serial' },
  { type: 'snmpTrap', available: ['edge'], spec: 'snmp-trap' },
  { type: 'timer', available: ['cloud', 'edge'], spec: 'timer' },
  { type: 'udp', available: ['edge'], spec: 'udp' },
  { type: 'virtualButton', available: ['cloud', 'exp', 'edge'], spec: 'virtual-button' },
  { type: 'webhook', available: ['cloud'], spec: 'webhook' }
];

// type (and aliases) -> spec, for resolving a bad flow-trigger spec-name guess to a hint. Entries
// with a `qualifier` (the ambiguous `integration` sub-kinds) are deliberately excluded.
export const FLOW_TRIGGER_TYPE_TO_SPEC = Object.fromEntries(
  FLOW_TRIGGER_TYPES
    .filter(({ qualifier }) => !qualifier)
    .flatMap(({ type, aliases, spec }) => [type, ...(aliases || [])].map((t) => [t, spec]))
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
