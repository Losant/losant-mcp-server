# Start: Custom Node Trigger (`type: "customNodeStart"`)

The entry point for a `flowClass: "customNode"` workflow. Exactly one required per custom node flow; must be paired with at least one `CustomNodeCapNode`. Available in customNode workflows only.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"customNodeStart"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"customNodeStart"` |
| `meta.label` | `"Start: Custom Node"` (default) |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

Not available.

## customNode workflows

```json
{
  "type": "customNodeStart",
  "key": "customNodeStart",
  "config": {},
  "meta": { "category": "trigger", "name": "customNodeStart", "label": "Start: Custom Node", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

- **`key`** — Always set to the literal string `"customNodeStart"`. Required, always send it.
