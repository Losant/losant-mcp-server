import { APPLICATION_RESOURCES, MD_FILES, SCHEMA_FILE_ALIASES, SCHEMA_FILES } from '../../constants.js';

let indexContent = '# Losant API Documentation\n\n';
indexContent += '## Quick Links\n\n';
indexContent += '- [Advanced Query Guide](losant://guides/advanced-queries) - Learn how to build MongoDB-style queries\n\n';
indexContent += '- [Losant Query Tool Guide](losant://guides/losant-resources-query) - Workflow guide for the losant_query tool — application selection, nested resources, and resource documentation links\n\n';
indexContent += '- [Devices & Device Recipes Guide](losant://guides/devices) - Domain guide for devices and recipes — classes, attributes, tags, and common workflows\n\n';
indexContent += '- [Integrations Guide](losant://guides/integrations) - Integration types, required config objects, credential usage, and workflow pairing\n\n';
indexContent += '- [Data Tables Guide](losant://guides/data-tables) - Column schema, constraints, the dataTable/dataTableRow relationship, and common workflows\n\n';
indexContent += '- [Resource Jobs Guide](losant://guides/resource-jobs) - The iterate-resources-trigger-workflow pattern, queryJson format, and concurrency settings\n\n';
indexContent += '- [Credentials Guide](losant://guides/credentials) - Credential types, config objects, and referencing credentials by name\n\n';
indexContent += '- [Flows Guide](losant://guides/flows) - Flow classes, triggers/nodes overview, versioning — full authoring at losant://skills/workflows\n\n';
indexContent += '- [Dashboards Guide](losant://guides/dashboards) - Block model, layout grid, context variables — full authoring at losant://skills/dashboards\n\n';
indexContent += '- [Files & Private Files Guide](losant://guides/files) - Two-step create-then-upload pattern, public vs. private\n\n';
indexContent += '- [Notebooks Guide](losant://guides/notebooks) - Two-step upload pattern, input/output types, imageVersion\n\n';
indexContent += '- [Experiences Guide](losant://guides/experiences) - Versioning model, views, endpoints, users, groups, domains, and slugs\n\n';

indexContent += '\n## Supported Resources\n\n';
indexContent += 'The following resources can be queried with the losant_query tool:\n\n';
indexContent += '### Top-Level Resources\n';
indexContent += '- **application** - Search and retrieve applications (use this first to get applicationId)\n\n';
indexContent += '### Application-Scoped Resources\n';
indexContent += 'These require an applicationId parameter:\n\n';
APPLICATION_RESOURCES.forEach((resource) => {
  indexContent += `- ${resource}\n`;
});

indexContent += '## API Documentation\n\n';
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
