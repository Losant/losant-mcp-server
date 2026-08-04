import { APPLICATION_RESOURCES, MD_FILES, SCHEMA_FILE_ALIASES, SCHEMA_FILES } from '../../constants.js';

let indexContent = `# Losant API Documentation
## Quick Links
- [Advanced Query Guide](losant://guides/advanced-queries) - Learn how to build MongoDB-style queries
- [Losant Query Tool Guide](losant://guides/losant-query-tool) - Procedural guide for the losant_query tool — application selection, nested resources, and resource documentation links
- [Devices & Device Recipes Guide](losant://guides/devices) - Domain guide for devices and recipes — classes, attributes, tags, and common procedures
- [Integrations Guide](losant://guides/integrations) - Integration types, required config objects, credential usage, and flow pairing
- [Data Tables Guide](losant://guides/data-tables) - Column schema, constraints, the dataTable/dataTableRow relationship, and common procedures
- [Resource Jobs Guide](losant://guides/resource-jobs) - The iterate-resources-trigger-flow pattern, queryJson format, and concurrency settings
- [Credentials Guide](losant://guides/credentials) - Credential types, config objects, and referencing credentials by name
- [Files & Private Files Guide](losant://guides/files) - Two-step create-then-upload pattern, public vs. private
- [Notebooks Guide](losant://guides/notebooks) - Two-step upload pattern, input/output types, imageVersion
- [Dashboards Guide](losant://guides/dashboards) - Blocks, layout grid, context variables, and common workflows for application dashboards
- [Experiences Guide](losant://guides/experiences) - Versioning model, views, endpoints, users, groups, domains, and slugs
- [Device Authentication Guide](losant://guides/device-auth) - Access keys and device certificates for MQTT broker authentication; API vs. UI naming for certificate resources

> **API naming note**: Some resource types have names in the API that differ from their display names in the Losant UI:
> - API: \`applicationCertificate\` → UI: **Device Certificate**
> - API: \`applicationCertificateAuthority\` → UI: **Device Certificate Authority**
> - API: \`applicationKey\` → UI: **Access Key**
> Use the API names (\`applicationCertificate\`, \`applicationCertificateAuthority\`, \`applicationKey\`) with \`losant_query\` and \`losant_write\`.

## Supported Resources
The following resources can be queried with the losant_query tool:
### Top-Level Resources
- **application** - Search and retrieve applications (use this first to get applicationId)
### Application-Scoped Resources
These require an applicationId parameter:`;

APPLICATION_RESOURCES.forEach((resource) => {
  indexContent += `- ${resource}\n`;
});

indexContent += '\n## API Documentation\n\n';
MD_FILES.sort().forEach((file) => {
  const name = file.replace('.md', '');
  indexContent += `- [${name}](losant://docs/${name})\n`;
});

const querySchemas = SCHEMA_FILES.filter((f) => f.replace('.json', '').includes('Query'));
const writeSchemas = SCHEMA_FILES.filter((f) => !f.replace('.json', '').includes('Query'));

indexContent += '\n## Query Schemas\n\n';
indexContent += 'JSON schemas for advanced queries:\n\n';
querySchemas.sort().forEach((file) => {
  const name = file.replace('.json', '');
  indexContent += `- [${name}](losant://schemas/${name})\n`;
});

indexContent += '\n## Write Schemas\n\n';
indexContent += 'JSON schemas for `losant_write` request bodies (Post = createOne, Patch = updateOne):\n\n';
writeSchemas.sort().forEach((file) => {
  const name = file.replace('.json', '');
  indexContent += `- [${name}](losant://schemas/${name})\n`;
});
Object.keys(SCHEMA_FILE_ALIASES).sort().forEach((aliasName) => {
  indexContent += `- [${aliasName}](losant://schemas/${aliasName})\n`;
});

export default indexContent;
