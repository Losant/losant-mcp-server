# Debug Node (`type: "DebugNode"`)

Surfaces the current payload (or a specific property of it) to the workflow's debug log. Purely observational — does not mutate the payload. Use to inspect intermediate values during development and troubleshooting.

See `SKILL.md` for the node object shape and wiring model.

## Node object shape

```json
{
  "id": "log",
  "type": "DebugNode",
  "config": {
    "message": "After HTTP call",
    "level": "info"
  },
  "meta": { "category": "debug", "name": "debug", "x": 200, "y": 200 },
  "outputIds": [[]]
}
```

- **Allowed in:** all flow classes.
- **`meta.category`:** `debug` · **`meta.name`:** `debug`
- `outputIds` is typically `[[]]` (empty inner array) — the debug node is usually a terminal for a branch. Wire it to a next node if the flow should continue.

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `message` | string template | `""` | A short human-readable label for this debug entry — e.g. `"HTTP response received"`, `"After parse"`. **Not a payload dump** — the full payload is already shown alongside it in the debug panel. Putting `{{data}}` here duplicates what's already displayed. |
| `property` | string | — | Optional payload path. When set, the debug entry shows only the value at that path instead of the full payload. Useful when the payload is large and you only care about one branch (e.g. `"working.httpResponse"`). |
| `level` | enum | `"verbose"` | One of `verbose`, `info`, `warn`, `error`. Used to filter the debug panel. Use `verbose` for development-only output; `info` for noteworthy events; `warn` / `error` for issues. |

## Examples

**Log the full payload with a label:**
```json
{
  "id": "log",
  "type": "DebugNode",
  "meta": { "category": "debug", "name": "debug", "x": 0, "y": 0 },
  "outputIds": [[]],
  "config": { "message": "Device state received", "level": "verbose" }
}
```

**Log only a sub-path:**
```json
{
  "id": "log-response",
  "type": "DebugNode",
  "meta": { "category": "debug", "name": "debug", "x": 0, "y": 0 },
  "outputIds": [["next"]],
  "config": { "message": "HTTP response", "property": "working.httpResponse", "level": "info" }
}
```

## Idiom notes

- Place a DebugNode on every branch of a ConditionalNode during development — remove or leave them in once you're confident.
- `message` is the filter label in the debug panel — make it specific so you can scan quickly: `"After parse"` is better than `"Debug"`.
- Edge workflows: `level` selection requires GEA 1.38.0+.
