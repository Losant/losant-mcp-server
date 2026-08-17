# Debug Node (`type: "DebugNode"`)

Surfaces the current payload (or a specific property of it) to the flow's debug log. Purely observational — does not mutate the payload. Available in all flow classes.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"DebugNode"` |
| `meta.category` | `"debug"` |
| `meta.name` | `"debug"` |
| `meta.label` | `"Debug"` (default) |

## Cloud (Application) flows

```json
{
  "id": "log",
  "type": "DebugNode",
  "config": { "message": "After HTTP call", "level": "info" },
  "meta": { "category": "debug", "name": "debug", "label": "Debug", "x": 200, "y": 200 },
  "outputIds": [[]]
}
```

`outputIds` is typically `[[]]` — Debug is usually a terminal for a branch. Wire it to a next node if the flow should continue.

| Config field | Type | Default | Notes |
|---|---|---|---|
| `message` | string template | `""` | Short label for this debug entry. **Not a payload dump** — the full payload is shown alongside it. |
| `property` | string | — | Optional payload path. When set, shows only the value at that path instead of the full payload. |
| `level` | enum | `"verbose"` | `verbose`, `info`, `warn`, `error`. Filters the debug panel by severity. On edge, level selection requires GEA 1.38.0+. |

## Output

The Debug Node does not modify the payload. All values are passed through unchanged to `outputIds[0]`.

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.

## Custom Node workflows

Same as Cloud.
