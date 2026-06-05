import { APPLICATION_RESOURCES, MD_FILES, SCHEMA_FILES } from '../../constants.js';

let indexContent = '# Losant API Documentation\n\n';
indexContent += '## Quick Links\n\n';
indexContent += '- [Advanced Query Guide](losant://guides/advanced-queries) - Learn how to build MongoDB-style queries\n\n';
indexContent += '- [Losant Query Tool Guide](losant://guides/losant-resources-query) - Workflow guide for the losant_query tool — application selection, nested resources, and resource documentation links\n\n';

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

indexContent += '\n## Query Schemas\n\n';
indexContent += 'JSON schemas for advanced queries:\n\n';
SCHEMA_FILES.sort().forEach((file) => {
  const name = file.replace('.json', '');
  indexContent += `- [${name}](losant://schemas/${name})\n`;
});

export default indexContent;
