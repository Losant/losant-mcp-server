# Simple Nodes

Trivial node types whose entire spec fits in ~10 lines. Each entry below is independent — read only the ones you need. Anchors match the lowercased type name (e.g. `#debugnode`).

For the node object shape (`id`, `type`, `meta`, `outputIds`, etc.) see `SKILL.md`. Only the `config` and any node-specific notes are documented here.

> _Demo subset — production version covers all ~25 trivial node types._

---

## DebugNode

Surfaces the current payload (or a specific property of it) to the workflow's debug log. The debug log entry includes the full payload by default — **`message` is a short human-readable label for the entry, not a payload dump.** The node does not mutate the payload; it's purely observational.

- **Allowed in:** all flow classes.
- **`meta.category`:** `output` or `debug` · **`meta.name`:** `debug`

config:

| Field | Type | Default | Notes |
|---|---|---|---|
| `message` | string template | `""` | A short label for this debug entry — e.g. `"Email Sent"`, `"After parse"`. Renders against the payload but typically uses a plain string. Used to filter / scan the debug panel. **Do not put `{{data}}` or `{{jsonEncode data}}` here** — the payload is already shown alongside, this would just duplicate it. |
| `property` | string | — | Optional payload path. When set, the debug entry shows only the value at that path instead of the full payload. Useful when the payload is large and you only care about one branch. If the path doesn't exist, the entry shows `undefined`. |
| `level` | enum | `"verbose"` | One of `verbose`, `info`, `warn`, `error`. Used to filter the debug panel by severity. `verbose` for dev-only output; `info` for noteworthy events; `warn` for recoverable issues; `error` for unrecoverable conditions where the flow nonetheless continues. (Edge workflows: level selection requires GEA 1.38.0+.) |

```json
{
  "id": "log",
  "type": "DebugNode",
  "meta": { "category": "debug", "name": "debug", "x": 0, "y": 0 },
  "outputIds": [[]],
  "config": { "message": "HTTP response received", "level": "info" }
}
```

To inspect only a sub-path of the payload:

```json
{
  "id": "log-response",
  "type": "DebugNode",
  "meta": { "category": "debug", "name": "debug", "x": 0, "y": 0 },
  "outputIds": [[]],
  "config": { "message": "HTTP response", "property": "working.httpResponse", "level": "info" }
}
```

---

## GenerateIdNode

Writes a generated identifier to a payload path.

- **Allowed in:** all flow classes.
- **`meta.category`:** `logic` · **`meta.name`:** `generateId`

config:

| Field | Type | Default | Notes |
|---|---|---|---|
| `idType` | enum | `"uuidV4"` | One of `uuidV4`, `uuidV1`, `objectId`, `nanoid`, `cuid`. |
| `resultPath` | string | — | Required. Payload path where the generated ID is written. |

```json
{
  "id": "make-id",
  "type": "GenerateIdNode",
  "meta": { "category": "logic", "name": "generateId", "x": 0, "y": 0 },
  "outputIds": [["next"]],
  "config": { "idType": "uuidV4", "resultPath": "working.id" }
}
```

---

## JsonEncodeNode

Serializes a value on the payload into a JSON string and writes it to another path.

- **Allowed in:** all flow classes.
- **`meta.category`:** `logic` · **`meta.name`:** `jsonEncode`

config:

| Field | Type | Default | Notes |
|---|---|---|---|
| `sourcePath` | string | — | Required. Payload path of the value to encode. |
| `destinationPath` | string | — | Required. Payload path to write the JSON string to. |
| `pretty` | boolean | `false` | When `true`, emits pretty-printed JSON (2-space indent). |

```json
{
  "id": "encode",
  "type": "JsonEncodeNode",
  "meta": { "category": "logic", "name": "jsonEncode", "x": 0, "y": 0 },
  "outputIds": [["next"]],
  "config": { "sourcePath": "data.user", "destinationPath": "working.userJson", "pretty": true }
}
```

---

## DelayNode

Pauses execution for a templated duration before running its output nodes.

- **Allowed in:** cloud, experience, edge, customNode. (Not embedded.)
- **`meta.category`:** `logic` · **`meta.name`:** `delay`

config:

| Field | Type | Default | Notes |
|---|---|---|---|
| `durationTemplate` | number template | — | Required. Renders to a number. |
| `unit` | enum | `"seconds"` | One of `milliseconds`, `seconds`, `minutes`, `hours`. |

Maximum delay is bounded by the platform's per-flow execution timeout — the workflow's overall budget still applies.

```json
{
  "id": "wait",
  "type": "DelayNode",
  "meta": { "category": "logic", "name": "delay", "x": 0, "y": 0 },
  "outputIds": [["next"]],
  "config": { "durationTemplate": "5", "unit": "seconds" }
}
```

---

## ThrowErrorNode

Aborts the current workflow execution with a specified error message. The error is routed to the workflow's `flowError` trigger (if any) and recorded in the workflow's error log.

- **Allowed in:** all flow classes.
- **`meta.category`:** `logic` · **`meta.name`:** `throwError`

config:

| Field | Type | Default | Notes |
|---|---|---|---|
| `messageTemplate` | string template | — | Required. Renders to the error message. |

```json
{
  "id": "bail",
  "type": "ThrowErrorNode",
  "meta": { "category": "logic", "name": "throwError", "x": 0, "y": 0 },
  "outputIds": [[]],
  "config": { "messageTemplate": "no row found for id {{data.id}}" }
}
```
