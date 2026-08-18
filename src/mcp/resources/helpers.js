import { SCHEMA_NAME_TO_FILE, MD_FILES } from '../../constants.js';

// Builds a "## Reference" section appended to guide content.
// A schema is included when its name starts with a resourceType
export const buildReferenceSection = (resourceTypes) => {
  if (!resourceTypes || resourceTypes.length === 0) { return ''; }

  const schemaLinks = [];
  const docLinks = [];

  for (const schemaName of Object.keys(SCHEMA_NAME_TO_FILE).sort()) {
    if (resourceTypes.find((type) => { return schemaName.toLowerCase().includes(type.toLowerCase()); })) {
      schemaLinks.push(`[${schemaName}](losant://schemas/${schemaName})`);
    }
  }

  for (const mdFile of MD_FILES) {
    if (resourceTypes.find((type) => { return mdFile.toLowerCase().includes(type.toLowerCase()); })) {
      const name = mdFile.replace('.md', '');
      docLinks.push(`[${name}](losant://docs/${name})`);
    }
  }

  if (schemaLinks.length === 0 && docLinks.length === 0) { return ''; }

  let section = '\n\n## Reference\n\n';
  if (schemaLinks.length > 0) { section += `**Schemas**: ${schemaLinks.join(' · ')}\n\n`; }
  if (docLinks.length > 0) { section += `**Docs**: ${docLinks.join(' · ')}\n`; }
  return section;
};
