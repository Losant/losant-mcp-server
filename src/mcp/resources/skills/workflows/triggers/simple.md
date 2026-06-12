# Simple Triggers

Trivial trigger types whose entire config is `{}`. Each entry is independent — read only the ones you need.

For the full trigger object shape and wiring model see `SKILL.md`. Only the `type`, `key`, and `meta.name` specifics are documented here.

---

## Trigger object shape (all triggers)

```json
{
  "key": "...",
  "type": "<triggerType>",
  "config": {},
  "meta": {
    "category": "trigger",
    "name": "<metaName>",
    "label": "optional display label",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node-id"]]
}
```

**`type` is the only required field.** `meta.category`, `meta.name`, `meta.x`, and `meta.y` should always be provided. `meta.label` defaults to `meta.name` if omitted — only set it when you want a different display name.

---

## virtualButton

A button in the Losant UI that fires the workflow. Cloud only.

- **`type`:** `"virtualButton"` · **`meta.name`:** `"virtualButton"`
- **`key`:** server-generated — omit it.
- **`config`:** `{}`

```json
{
  "type": "virtualButton",
  "config": {},
  "meta": { "category": "trigger", "name": "virtualButton", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

---

## webhook

Fires when an external service POSTs to a Losant webhook URL. Cloud and experience.

- **`type`:** `"webhook"` · **`meta.name`:** `"webhook"`
- **`key`:** the webhook resource's ID. The zero ID (`000000000000000000000000`) matches any webhook in the application.
- **`config`:** `{}`

```json
{
  "key": "5f1c2d3e4f5a6b7c8d9e0f1a",
  "type": "webhook",
  "config": {},
  "meta": { "category": "trigger", "name": "webhook", "x": 60, "y": 60 },
  "outputIds": [["handle"]]
}
```

---

## onBoot

Fires once when an edge agent starts up. Edge and embedded.

- **`type`:** `"onBoot"` · **`meta.name`:** `"onBoot"`
- **`key`:** server-generated — omit it.
- **`config`:** `{}`

```json
{
  "type": "onBoot",
  "config": {},
  "meta": { "category": "trigger", "name": "onBoot", "x": 60, "y": 60 },
  "outputIds": [["init"]]
}
```

---

## customNodeStart

The entry point for a `flowClass: "customNode"` workflow. Exactly one required per customNode flow; must be paired with at least one `CustomNodeCapNode`.

- **`type`:** `"customNodeStart"` · **`meta.name`:** `"customNodeStart"`
- **`key`:** the literal string `"customNodeStart"`.
- **`config`:** `{}`

```json
{
  "key": "customNodeStart",
  "type": "customNodeStart",
  "config": {},
  "meta": { "category": "trigger", "name": "customNodeStart", "x": 60, "y": 60 },
  "outputIds": [["first-node"]]
}
```

---

## deviceCreate

Fires when a new device is created in the application. Cloud only.

- **`type`:** `"deviceCreate"` · **`meta.name`:** `"deviceCreate"`
- **`key`:** server-generated — omit it.
- **`config`:** `{}`

```json
{
  "type": "deviceCreate",
  "config": {},
  "meta": { "category": "trigger", "name": "deviceCreate", "x": 60, "y": 60 },
  "outputIds": [["handle"]]
}
```

---

## resourceJobIteration / resourceJobComplete / resourceJobIterationTimeout

Fire during resource job execution. Cloud only.

| When it fires | `type` | `meta.name` |
|---|---|---|
| Each item iteration | `"resourceJobIteration"` | `"resourceJobIteration"` |
| Job finishes | `"resourceJobComplete"` | `"resourceJobComplete"` |
| Iteration timed out | `"resourceJobIterationTimeout"` | `"resourceJobIterationTimeout"` |

- **`key`:** server-generated — omit it.
- **`config`:** `{}`

```json
{
  "type": "resourceJobIteration",
  "config": {},
  "meta": { "category": "trigger", "name": "resourceJobIteration", "x": 60, "y": 60 },
  "outputIds": [["process-item"]]
}
```

---

## direct

Fires when another workflow explicitly triggers this one using the Workflow Trigger output node. Cloud only.

- **`type`:** `"direct"` · **`meta.name`:** `"direct"`
- **`key`:** server-generated — omit it.
- **`config`:** `{}`

```json
{
  "type": "direct",
  "config": {},
  "meta": { "category": "trigger", "name": "direct", "x": 60, "y": 60 },
  "outputIds": [["handle"]]
}
```

---

## notebook

Fires when a Losant notebook execution completes. Cloud only.

- **`type`:** `"notebook"` · **`meta.name`:** `"notebook"`
- **`key`:** server-generated — omit it.
- **`config`:** `{}`
