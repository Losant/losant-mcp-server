import { buildReferenceSection } from './helpers.js';
const content = `# Flows Guide

Flows (workflows) are the automation engine of Losant. A flow defines triggers (what starts it) and nodes (what it does). This guide covers what you need to know to create and update flows via \`losant_write\`.

## Key Concepts

- **flowClass**: determines which triggers and nodes are available — \`cloud\` (general purpose), \`experience\` (backend for Experience endpoints), \`edge\` (runs on gateway hardware), \`embedded\` (low-power devices), \`customNode\` (reusable sub-flow)
- **Develop version vs. versions**: every flow has a live "develop" version. Use \`losant_write\` with \`resourceType=flow\` to update the develop version. Use \`resourceType=flowVersion\` to snapshot a named version.
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

- \`losant://authoring/flow\` — full authoring guide (trigger catalog, node catalog, wiring model, loops, conditionals)
- \`losant://flow/nodes/{nodeName}\` — per-node detail
- \`losant://flow/triggers/{triggerName}\` — per-trigger detail
- \`losant://references/flow/templating\` — Handlebars dialect, format helpers, expressions, payload paths, and LJSON syntax for HTTP nodes
- \`losant://references/flow/globals\` — global variables reference
- \`losant://references/flow/payload\` — payload reference
- \`losant://references/flow/custom-nodes\` — custom nodes reference
- \`losant://references/flow/execution-model\` — how execution works: payload flow, branching, throws, and the Workflow Error trigger

## Workflow Versions

Use \`resourceType=flowVersion\` with \`operation=createOne\` to snapshot the current develop version:
\`\`\`json
{
  "version": "1.0.0",
  "notes": "Initial stable release",
  "enabled": true
}
\`\`\`
Requires \`parentResourceId\` = the \`flowId\`.

> **flowVersion triggers and nodes are frozen.** Once a version is created, its trigger and node configuration cannot be changed. \`updateOne\` on a \`flowVersion\` only allows patching \`notes\` and \`enabled\` — nothing structural. To revise the logic, make changes on the develop version (the \`flow\` itself via \`updateOne\`) and then snapshot a new \`flowVersion\`.

## Common LLM Workflows

### Create a new empty flow
1. Confirm \`flowClass\` (default: \`cloud\`) and \`category\`
2. Call \`losant_write\` \`operation=createOne\` \`resourceType=flow\` with just \`name\` + \`category\` + \`flowClass\`
3. Then add triggers and nodes via \`operation=updateOne\`

### Add or modify triggers/nodes
1. Use \`losant_query\` \`operation=get\` \`resourceType=flow\` to retrieve current \`triggers\` and \`nodes\` arrays
2. Append or modify entries
3. Call \`losant_write\` \`operation=updateOne\` with the full updated \`triggers\` and \`nodes\` arrays
4. Read \`losant://authoring/flow\` before constructing trigger/node JSON — the wiring model requires \`outputIds\` to be correct

### Snapshot a version
After the develop version is stable, call \`losant_write\` \`operation=createOne\` \`resourceType=flowVersion\` with \`parentResourceId\` = flowId.

### Revise a published version's logic
Triggers and nodes in a \`flowVersion\` cannot be edited. To revise:
1. Use \`losant_query\` \`operation=get\` \`resourceType=flow\` to retrieve the current develop version
2. Apply your changes to \`triggers\` and \`nodes\` on the develop version via \`losant_write\` \`operation=updateOne\` \`resourceType=flow\`
3. Snapshot a new \`flowVersion\` with a new version name

${buildReferenceSection(['flow', 'flowVersion'])}
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
