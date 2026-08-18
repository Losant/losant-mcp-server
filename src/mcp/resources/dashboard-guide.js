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

Every block requires at minimum \`blockType\`, \`startX\`, \`startY\`, \`width\`, and \`height\`. \`id\`, \`title\`, and \`description\` are optional — the server assigns an \`id\` if omitted.
\`\`\`json
{
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

## Common LLM Procedures

### Create an empty dashboard, then add blocks
1. **Discover device attributes first** — call \`losant_query\` \`operation=get\` \`resourceType=device\` on the target device and inspect its \`attributes\` array. Each entry has a \`name\` (use this as the \`attribute\` field in block configs — it must match exactly) and a \`dataType\` (\`number\`, \`string\`, \`boolean\`, \`gps\`, \`blob\`). Only \`number\` attributes work in time-series blocks; \`gps\` for map blocks; \`blob\` or \`string\` for the image block's attribute source.
2. Call \`losant_write\` \`operation=createOne\` \`resourceType=applicationDashboard\` with just \`name\`. If the dashboard should work for multiple devices or data sources, add \`contextConfiguration\` now — read \`losant://references/dashboard/context-configuration\` first.
3. Read \`losant://authoring/dashboard\` for the full block catalog and layout rules
4. For each block type you want to add, read \`losant://dashboard/blocks/{blockType}\`
5. Assemble the full \`blocks\` array
6. Call \`losant_write\` \`operation=updateOne\` with the blocks array

### Add a block to an existing dashboard
1. Use \`losant_query\` \`operation=get\` \`resourceType=applicationDashboard\` to retrieve the current \`blocks\` array
2. Compute the next safe \`startY\`: find \`max(block.startY + block.height)\` across all existing blocks — that is the first empty row. Place the new block at that \`startY\`. For a full-width block use \`startX: 0, width: 4\`. For a two-column layout use \`startX: 0, width: 2\` and \`startX: 2, width: 2\` at the same \`startY\`.
3. Call \`losant_write\` \`operation=updateOne\` with the full updated \`blocks\` array

### Make a dashboard reusable (fleet / multi-device pattern)
Read \`losant://references/dashboard/context-configuration\` before adding \`contextConfiguration\`. Two common patterns:
- **One device at a time** (per-device drill-down): use a \`deviceId\` context variable. Every block uses \`deviceIds: ["{{ctx.deviceId}}"]\`. The viewer switches between devices via the toolbar or URL.
- **All devices in a group** (fleet aggregate): use a \`deviceTag\` context variable. Blocks use \`deviceTags: [{ "key": "fleet", "fromCtx": "myTagVar" }]\` to show data across all devices that share a tag. The viewer changes which group they see.

Use \`deviceId\` when the goal is "show everything about one specific device." Use \`deviceTag\` when the goal is "show aggregated data across a set of devices."

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
    description: 'Domain guide for Losant application dashboards — blocks, layout grid, context variables, and common procedures',
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
