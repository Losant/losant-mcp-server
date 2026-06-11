const content = `# Flows Guide

Flows (workflows) are the automation engine of Losant. A flow defines triggers (what starts it) and nodes (what it does). This guide covers what you need to know to create and update flows via \`losant_write\`.

## Key Concepts

- **flowClass**: determines which triggers and nodes are available — \`cloud\` (general purpose), \`experience\` (backend for Experience endpoints), \`edge\` (runs on gateway hardware), \`embedded\` (low-power devices), \`customNode\` (reusable sub-flow)
- **Develop version vs. versions**: every flow has a live "develop" version. Use \`losant_write\` with \`resourceType=flow\` to update the develop version. Use \`resourceType=flowVersion\` to snapshot an immutable version.
- **Triggers and nodes**: both are arrays of objects with type-specific \`config\` and wiring via \`outputIds\`

## Creating a Flow

Minimal body — create an empty flow and build it up with subsequent \`updateOne\` calls:
\`\`\`json
{
  "name": "My Flow",
  "category": "logic",
  "flowClass": "cloud"
}
\`\`\`

**Top-level fields:**
- \`name\` (required): 1–255 chars
- \`flowClass\`: \`cloud\` (default), \`experience\`, \`edge\`, \`embedded\`, \`customNode\`
- \`category\`: \`data\`, \`experience\`, \`logic\`, \`output\`, \`debug\` (used for organization only)
- \`description\`, \`shortDescription\`: human-readable docs
- \`enabled\`: boolean — whether the flow is active (default \`true\`)
- \`triggers\`: array of trigger objects
- \`nodes\`: array of node objects
- \`globals\`: array of \`{ key, json }\` global variables

## Building Triggers and Nodes

The \`flowPost\` / \`flowPatch\` schemas are large (86KB). Read \`losant://schemas/flowPost\` for the complete trigger and node type reference.

For the wiring model, trigger configuration, and per-node config details read:
- \`losant://skills/workflows\` — full authoring guide (trigger catalog, node catalog, wiring model, loops, conditionals)
- \`losant://skills/workflows/nodes/{nodeName}\` — per-node detail
- \`losant://skills/workflows/triggers/{triggerName}\` — per-trigger detail
- \`losant://skills/workflows/reference/error-handling\` — errorBehavior / errorPath pattern

## Workflow Versions

Use \`resourceType=flowVersion\` with \`operation=createOne\` to snapshot the current develop version:
\`\`\`json
{
  "version": "1.0.0",
  "notes": "Initial stable release",
  "enabled": true
}
\`\`\`
Requires \`parentResourceId\` = the \`flowId\`. Versions are immutable — \`updateOne\` is not supported for \`flowVersion\`.

## Common LLM Workflows

### Create a new empty flow
1. Confirm \`flowClass\` (default: \`cloud\`) and \`category\`
2. Call \`losant_write\` \`operation=createOne\` \`resourceType=flow\` with just \`name\` + \`category\` + \`flowClass\`
3. Then add triggers and nodes via \`operation=updateOne\`

### Add or modify triggers/nodes
1. Use \`losant_query\` \`operation=get\` \`resourceType=flow\` to retrieve current \`triggers\` and \`nodes\` arrays
2. Append or modify entries
3. Call \`losant_write\` \`operation=updateOne\` with the full updated \`triggers\` and \`nodes\` arrays
4. Read \`losant://skills/workflows\` before constructing trigger/node JSON — the wiring model requires \`outputIds\` to be correct

### Snapshot a version
After the develop version is stable, call \`losant_write\` \`operation=createOne\` \`resourceType=flowVersion\` with \`parentResourceId\` = flowId.
`;

export default {
  name: 'flow-guide',
  uriName: 'losant://guides/flows',
  resourceConfig: {
    title: 'Flows Guide',
    description: 'Domain guide for Losant flows — flow classes, triggers, nodes, versions, and common workflows',
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
