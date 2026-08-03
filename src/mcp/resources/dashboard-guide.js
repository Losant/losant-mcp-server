import { buildReferenceSection } from './helpers.js';
const content = `# Dashboards Guide

Application dashboards display device data, events, and other Losant resources in a configurable grid of blocks. This guide covers what you need to know to create and update dashboards via \`losant_write\`.

## Key Concepts

- **Blocks**: the unit of content on a dashboard — each has a \`blockType\`, a position/size on a 4-column grid, and a type-specific \`config\` object
- **Layout grid**: 4 columns wide; \`startX\` (0–3.5), \`width\` (0.5–4), \`startY\` and \`height\` in 0.5-unit increments; blocks must not overlap
- **Context variables**: parameterize a dashboard (e.g., show different devices without duplicating the dashboard) — see \`losant://references/dashboard/context-configuration\`

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

For the layout model, per-block config details, and worked examples read:
- \`losant://authoring/dashboard\` — full authoring guide (block catalog, layout rules, context variable usage)
- \`losant://dashboard/blocks/{blockType}\` — per-block config detail
- \`losant://references/dashboard/context-configuration\` — context variable types and URL mechanism

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
  "config": { }
}
\`\`\`
The \`config\` object is block-type-specific — read the per-block guide file before constructing it.

## Common LLM Workflows

### Create an empty dashboard, then add blocks
1. **Discover device attributes first** — call \`losant_query\` \`operation=get\` \`resourceType=device\` on the target device and inspect its \`attributes\` array. Block config fields like \`attribute\` must match device attribute names exactly.
2. Call \`losant_write\` \`operation=createOne\` \`resourceType=applicationDashboard\` with just \`name\`. If the dashboard should work for multiple devices or data sources, add \`contextConfiguration\` now — read \`losant://references/dashboard/context-configuration\` first.
3. Read \`losant://authoring/dashboard\` for the full block catalog and layout rules
4. For each block type you want to add, read \`losant://dashboard/blocks/{blockType}\`
5. Assemble the full \`blocks\` array
6. Call \`losant_write\` \`operation=updateOne\` with the blocks array

### Add a block to an existing dashboard
1. Use \`losant_query\` \`operation=get\` \`resourceType=applicationDashboard\` to retrieve the current \`blocks\` array
2. Append the new block object (ensure no \`startX\`/\`startY\` overlap with existing blocks)
3. Call \`losant_write\` \`operation=updateOne\` with the full updated \`blocks\` array

### Make a dashboard reusable (fleet / multi-device pattern)
Read \`losant://references/dashboard/context-configuration\` before adding \`contextConfiguration\` — context variables let one dashboard serve many devices or data sources without duplicating blocks. The most common pattern is a single \`deviceId\` context variable so every block drives from \`deviceIds: ["{{ctx.deviceId}}"]\`.

### Embed a dashboard in an Experience
Dashboard pages in Losant Experiences are standard \`experienceView\` resources (\`viewType: "page"\`) whose \`body\` contains the \`{{element 'dashboard' ...}}\` helper — the same helper used to inline a dashboard in any HTML page:
\`\`\`handlebars
{{element
  'dashboard'
  dashboardId='<dashboardId>'
  theme='light'
  hideHeader=false
  ctx=(obj
    deviceId=(template '{{request.params.deviceId}}')
    userId=(template '{{experience.user.id}}')
  )
}}
\`\`\`
Read \`losant://guides/experiences\` for the full argument reference and context-wiring patterns.

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
