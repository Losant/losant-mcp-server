import { buildReferenceSection } from './helpers.js';
const content = `# Dashboards Guide

Application dashboards display device data, events, and other Losant resources in a configurable grid of blocks. This guide covers what you need to know to create and update dashboards via \`losant_write\`.

## Key Concepts

- **Blocks**: the unit of content on a dashboard — each has a \`blockType\`, a position/size on a 4-column grid, and a type-specific \`config\` object
- **Layout grid**: 4 columns wide; \`startX\` (0–3), \`width\` (1–4), \`startY\` and \`height\` in grid units; blocks must not overlap
- **Context variables**: parameterize a dashboard (e.g., show different devices without duplicating the dashboard) — see \`losant://skills/dashboards/reference/context-configuration\`

## Creating a Dashboard

Minimal body:
\`\`\`json
{
  "name": "My Dashboard"
}
\`\`\`

**Top-level fields:**
- \`name\` (required): 1–255 chars
- \`blocks\`: array of block objects (can be empty — add blocks via \`updateOne\`)
- \`description\`: human-readable description
- \`public\`: boolean — if \`true\`, anyone with the URL can view it (no login required)
- \`password\`: string — optional password for public dashboards
- \`contextConfiguration\`: array of context variable definitions

## Building Blocks

The \`applicationDashboardPost\` schema is 227KB. Read \`losant://schemas/applicationDashboardPost\` for the complete block type reference.

For the layout model, per-block config details, and worked examples read:
- \`losant://skills/dashboards\` — full authoring guide (block catalog, layout rules, context variable usage)
- \`losant://skills/dashboards/blocks/{blockType}\` — per-block config detail
- \`losant://skills/dashboards/reference/context-configuration\` — context variable types and URL mechanism

## Block Object Shape

Every block requires:
\`\`\`json
{
  "id": "unique-string-id",
  "blockType": "gauge",
  "title": "Temperature",
  "startX": 0,
  "startY": 0,
  "width": 2,
  "height": 2,
  "applicationId": "<applicationId>",
  "config": { }
}
\`\`\`
The \`config\` object is block-type-specific — read the per-block skill file before constructing it.

## Common LLM Workflows

### Create an empty dashboard, then add blocks
1. Call \`losant_write\` \`operation=createOne\` \`resourceType=applicationDashboard\` with just \`name\`
2. Read \`losant://skills/dashboards\` to understand the block catalog and layout rules
3. For each block type you want to add, read \`losant://skills/dashboards/blocks/{blockType}\`
4. Assemble the full \`blocks\` array
5. Call \`losant_write\` \`operation=updateOne\` with the blocks array

### Add a block to an existing dashboard
1. Use \`losant_query\` \`operation=get\` \`resourceType=applicationDashboard\` to retrieve the current \`blocks\` array
2. Append the new block object (ensure no \`startX\`/\`startY\` overlap with existing blocks)
3. Call \`losant_write\` \`operation=updateOne\` with the full updated \`blocks\` array

### Use context variables
Read \`losant://skills/dashboards/reference/context-configuration\` before adding \`contextConfiguration\` — context variables let one dashboard serve many devices or data sources.
${buildReferenceSection(['applicationDashboard'])}
`;

export default {
  name: 'dashboard-guide',
  uriName: 'losant://guides/dashboards',
  resourceConfig: {
    title: 'Dashboards Guide',
    description: 'Domain guide for Losant application dashboards — blocks, layout grid, context variables, and common workflows',
    mimeType: 'text/markdown'
  },
  getContent: async (uri) => {
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'text/markdown',
        text: content
      }]
    };
  }
};
