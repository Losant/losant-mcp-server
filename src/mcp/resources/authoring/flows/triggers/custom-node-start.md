# Start: Custom Node Trigger (`type: "customNodeStart"`)

The entry point for a `flowClass: "customNode"` flow. Exactly one required per custom node flow; must be paired with at least one `CustomNodeCapNode`. Available in customNode flows only.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"customNodeStart"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"customNodeStart"` |
| `meta.label` | `"Start: Custom Node"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

Not available.

## customNode flows

```json
{
  "type": "customNodeStart",
  "key": "customNodeStart",
  "config": {},
  "meta": { "category": "trigger", "name": "customNodeStart", "label": "Start: Custom Node", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

- **`key`** — Server-set — omit on create. The server always sets `key` to `'customNodeStart'`. (In `SAME_KEY_AS_TYPE` mode the server unconditionally overwrites `trigger.key` with `trigger.type`, so any value you send is ignored.)

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": { "<inputId>": "<value>", "...": "additional input fields from the invoking flow" },
  "triggerId": "customNodeStart",
  "triggerType": "customNodeStart",
  "applicationId": "...",
  "customNodeId": "...",
  "customNodeName": "My Custom Node",
  "customNodeVersion": "v1.0.0"
}
```

- `triggerId` — always the literal string `"customNodeStart"`.
- `data` — populated by the invoking flow's `CustomNodeExecuteNode.config.fields` array. Each `{ id, value }` entry becomes a key on `data`. If no fields are configured, `data` is `{}`.
- `customNodeId` — the flow ID of the custom node definition.
- `customNodeName` — the display name of the custom node.
- `customNodeVersion` — the version of the custom node being executed.
