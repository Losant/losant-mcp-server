# Simple Nodes

Trivial node types whose entire spec fits in a few lines. Each entry is independent — read only the ones you need.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default | Available in |
|---|---|---|---|---|
| `DebugNode` | `debug` | `debug` | `"Debug"` | all |
| `GenerateIdNode` | `logic` | `generate-id` | `"Generate ID"` | all |
| `JsonDecodeNode` | `logic` | `json-decode` | `"JSON Decode"` | all |
| `JsonEncodeNode` | `logic` | `json-encode` | `"JSON Encode"` | all |
| `Base64DecodeNode` | `logic` | `base64-decode` | `"Base64: Decode"` | embedded |
| `Base64EncodeNode` | `logic` | `base64-encode` | `"Base64: Encode"` | embedded |
| `DelayNode` | `logic` | `delay` | `"Delay"` | cloud, exp, edge, custom |
| `ThrowErrorNode` | `debug` | `throw-error` | `"Throw Error"` | all |
| `RandomNumberNode` | `logic` | `random-number` | `"Random Number"` | all |
| `LatchNode` | `logic` | `latch` | `"Latch"` | all |
| `BranchOnChangeNode` | `logic` | `onchange` | `"On Change"` | all |
| `AnnotationNode` | `annotation` | `note` | `"Annotation"` | all |

---

## Debug Node (`type: "DebugNode"`)

Surfaces the current payload (or a specific property of it) to the workflow's debug log. Purely observational — does not mutate the payload. Available in all flow classes.

```json
{
  "id": "log",
  "type": "DebugNode",
  "config": { "message": "After HTTP call", "level": "info" },
  "meta": { "category": "debug", "name": "debug", "label": "Debug", "x": 200, "y": 200 },
  "outputIds": [[]]
}
```

`outputIds` is typically `[[]]` — the Debug node is usually a terminal for a branch. Wire it to a next node if the flow should continue.

| Field | Type | Default | Notes |
|---|---|---|---|
| `message` | string template | `""` | A short label for this debug entry — e.g. `"After parse"`. **Not a payload dump** — the full payload is already shown alongside it. |
| `property` | string | — | Optional payload path. When set, shows only the value at that path instead of the full payload. |
| `level` | enum | `"verbose"` | `verbose`, `info`, `warn`, `error`. Filters the debug panel by severity. On edge, level selection requires **GEA 1.38.0+**. |

---

## Generate ID Node (`type: "GenerateIdNode"`)

Writes a generated identifier to a payload path. Available in all flow classes.

```json
{
  "id": "make-id",
  "type": "GenerateIdNode",
  "meta": { "category": "logic", "name": "generate-id", "label": "Generate ID", "x": 0, "y": 0 },
  "outputIds": [["next"]],
  "config": { "idTypeTemplate": "uuidv4", "destinationPath": "working.id" }
}
```

| Field | Default | Notes |
|---|---|---|
| `idTypeTemplate` | `"uuidv4"` | `uuidv1`, `uuidv3`, `uuidv4`, `uuidv5`, `objectId`, `nanoid`. |
| `namespaceTemplate` | — | Required when `idTypeTemplate` is `"uuidv3"` or `"uuidv5"`. A UUID string used as the namespace for hashing. Use one of the RFC 4122 well-known namespaces (e.g. `"6ba7b810-9dad-11d1-80b4-00c04fd430c8"` for DNS) or any valid UUID. Supports Handlebars templates. |
| `valueTemplate` | — | Required when `idTypeTemplate` is `"uuidv3"` or `"uuidv5"`. The name string to hash against the namespace to produce the UUID. Supports Handlebars templates (e.g. `"{{data.deviceId}}"`). |
| `destinationPath` | — | **Required.** Payload path where the generated ID is written. |

---

## JSON Decode Node (`type: "JsonDecodeNode"`)

Parses a JSON string at a payload path into a structured value. Available in all flow classes.

```json
{
  "id": "decode",
  "type": "JsonDecodeNode",
  "meta": { "category": "logic", "name": "json-decode", "label": "JSON Decode", "x": 0, "y": 0 },
  "outputIds": [["next"]],
  "config": { "source": "working.rawJson", "destination": "working.parsed" }
}
```

Error handling requires GEA 1.14.0+ on edge.

| Field | Default | Notes |
|---|---|---|
| `source` | — | **Required.** Payload path of the JSON string to decode. |
| `destination` | — | **Required.** Payload path to write the parsed value. |
| `errorBehavior` | `"throw"` | `"throw"` — workflow errors on bad JSON. `"payloadPath"` — stores the error at `errorPath` instead. |
| `errorPath` | — | **Required** when `errorBehavior: "payloadPath"`. Payload path to write the parse error. |

---

## JSON Encode Node (`type: "JsonEncodeNode"`)

Serializes a value on the payload into a JSON string. Available in all flow classes.

```json
{
  "id": "encode",
  "type": "JsonEncodeNode",
  "meta": { "category": "logic", "name": "json-encode", "label": "JSON Encode", "x": 0, "y": 0 },
  "outputIds": [["next"]],
  "config": { "source": "data.user", "destination": "working.userJson" }
}
```

| Field | Default | Notes |
|---|---|---|
| `source` | - | **Required.** Payload path of the JSON object to encode. |
| `destination` | - | **Required.** Payload path to write the JSON stribng. |

---

## Base64: Decode Node (`type: "Base64DecodeNode"`)

Decodes a Base64 string on the payload. Available in embedded flow class only.

```json
{
  "id": "decode-b64",
  "type": "Base64DecodeNode",
  "meta": { "category": "logic", "name": "base64-decode", "label": "Base64: Decode", "x": 0, "y": 0 },
  "outputIds": [["next"]],
  "config": { "source": "working.encoded", "destination": "working.decoded", "stringOutput": true }
}
```

| Field | Default | Notes |
|---|---|---|
| `source` | — | **Required.** Payload path of the Base64 string to decode. |
| `destination` | — | **Required.** Payload path to write the result. |
| `stringOutput` | `false` | When `true`, outputs a UTF-8 string. When `false` (default), outputs an array of binary (byte) values. |

---

## Base64: Encode Node (`type: "Base64EncodeNode"`)

Encodes a string or binary array on the payload to Base64. Available in embedded flow class only.

```json
{
  "id": "encode-b64",
  "type": "Base64EncodeNode",
  "meta": { "category": "logic", "name": "base64-encode", "label": "Base64: Encode", "x": 0, "y": 0 },
  "outputIds": [["next"]],
  "config": { "source": "working.plaintext", "destination": "working.encoded" }
}
```

| Field | Notes |
|---|---|
| `source` | **Required.** Payload path of the string or binary array to encode. |
| `destination` | **Required.** Payload path to write the Base64 string. |

---

## Delay Node (`type: "DelayNode"`)

Pauses execution for a specified duration. Available in cloud, experience, edge, custom (not embedded).

```json
{
  "id": "wait",
  "type": "DelayNode",
  "meta": { "category": "logic", "name": "delay", "label": "Delay", "x": 0, "y": 0 },
  "outputIds": [["next"]],
  "config": { "delay": "5" }
}
```

| Field | Default | Notes |
|---|---|---|
| `delay` | — | **Required.** Number of seconds as a string template (e.g. `"5"` or `"{{data.waitSecs}}"`). Max 59 seconds for cloud and experience workflows. |

---

## Throw Error Node (`type: "ThrowErrorNode"`)

Aborts the current workflow execution with a specified error message. The error is routed to the workflow's Workflow Error Trigger (if any). Available in all flow classes.

```json
{
  "id": "bail",
  "type": "ThrowErrorNode",
  "meta": { "category": "debug", "name": "throw-error", "label": "Throw Error", "x": 0, "y": 0 },
  "outputIds": [[]],
  "config": { "messageTemplate": "no row found for id {{data.id}}" }
}
```

| Field | Notes |
|---|---|
| `messageTemplate` | **Required.** Renders to the error message. |

---

## Random Number Node (`type: "RandomNumberNode"`)

Generates a random number within a configured range and writes it to the payload. Available in all flow classes.

```json
{
  "id": "rand",
  "type": "RandomNumberNode",
  "meta": { "category": "logic", "name": "random-number", "label": "Random Number", "x": 0, "y": 0 },
  "outputIds": [["next"]],
  "config": { "min": 0, "max": 100, "resultPath": "working.rand" }
}
```

| Field | Default | Notes |
|---|---|---|
| `min` | `0` | Minimum value (inclusive). Number or template string (e.g. `"{{data.min}}"`). |
| `max` | `100` | Maximum value (inclusive). Number or template string (e.g. `"{{data.max}}"`). |
| `resultPath` | — | **Required.** Payload path to write the result. |

---

## Latch Node (`type: "LatchNode"`)

Branches based on a boolean condition that only transitions when the condition changes. Useful for de-bouncing state changes — fires on the first true, then only fires again when the value goes false and comes back true. Available in all flow classes.

```json
{
  "id": "latch",
  "type": "LatchNode",
  "meta": { "category": "logic", "name": "latch", "label": "Latch", "x": 160, "y": 160 },
  "outputIds": [["already-latched-or-false"], ["first-true"]],
  "config": {
    "latchExpression": "{{data.attributes.tempC}} > 90",
    "resetExpression": "{{data.attributes.tempC}} < 70",
    "latchIdTemplate": "{{triggerId}}"
  }
}
```

`outputIds[0]` fires when `latchExpression` is false, or when it is true but the latch is already set.
`outputIds[1]` fires the first time `latchExpression` becomes true (and latches the node until `resetExpression` is true).

| Field | Default | Notes |
|---|---|---|
| `latchExpression` | `""` | Optional. Handlebars expression to evaluate. When true and not latched, fires `outputIds[1]` and latches. Defaults to `""` (never latches). |
| `resetExpression` | `""` | Optional. Handlebars expression. When true, resets the latch so `outputIds[1]` can fire again. Defaults to `""` (never resets). |
| `latchIdTemplate` | `""` | Template for a unique latch identifier. Use `{{triggerId}}` or `{{data.deviceId}}` to scope the latch independently per device. |
| `latchResultPath` | `""` | Payload path to write the boolean result of `latchExpression`. |
| `resetResultPath` | `""` | Payload path to write the boolean result of `resetExpression`. |
| `wasLatchedPath` | `""` | Payload path for the latch state before this execution. |
| `isLatchedPath` | `""` | Payload path for the latch state after this execution. |
| `branchPath` | `""` | Payload path for which branch was taken. |

---

## On Change Node (`type: "BranchOnChangeNode"`)

Branches based on whether a payload value has changed since the last execution. Available in all flow classes.

```json
{
  "id": "on-change",
  "type": "BranchOnChangeNode",
  "meta": { "category": "logic", "name": "onchange", "label": "On Change", "x": 0, "y": 0 },
  "outputIds": [["value-same"], ["value-changed"]],
  "config": {
    "valuePath": "data.attributes.status",
    "changeType": "any",
    "onChangeIdTemplate": "statusChange-{{data.deviceId}}"
  }
}
```

`outputIds[1]` fires when the value has changed. `outputIds[0]` fires when it's the same as the previous execution.

| Field | Notes |
|---|---|
| `valuePath` | **Required.** Payload path of the value to compare. |
| `changeType` | Optional. Default `"any"`. Values: `"any"` (change of any kind), `"percent"`, `"percentInc"`, `"percentDec"`, `"value"`, `"valueInc"`, `"valueDec"`. |
| `changeThreshold` | Amount of change required. Required when `changeType` is anything other than `"any"`. |
| `prevValuePath` | Payload path of where to set the previously compared value. |
| `onChangeIdTemplate` | Storage key used to persist the previous value. |

**Note**
For `changeType` values other than `"any"`, the value at `valuePath` must be a number or convertible to a number — if it is not, `outputIds[0]` (unchanged path) is taken. On first execution when no previous value has been stored, `outputIds[0]` (unchanged path) is also taken.

---

## Annotation Node (`type: "AnnotationNode"`)

A visual-only node that displays a text label on the workflow canvas. Has no runtime behavior and does not affect payload or execution. Available in all flow classes.

```json
{
  "id": "note",
  "type": "AnnotationNode",
  "config": {},
  "meta": {
    "category": "annotation",
    "name": "note",
    "label": "Annotation",
    "x": 60,
    "y": 60,
    "annotationText": "This section handles error recovery",
    "width": 200,
    "height": 100
  },
  "outputIds": []
}
```

`outputIds` must be `[]` (empty array — no outputs).

`config` is always `{}`. All annotation content is stored in `meta`:

| `meta` field | Default | Notes |
|---|---|---|
| `annotationText` | `""` | The text displayed inside the annotation box. Markdown is supported. |
| `width` | `200` | Width in pixels. Must be a multiple of 20 (GRID_SIZE). UI range: 100–600 (5–30 grid steps). |
| `height` | `100` | Height in pixels. Must be a multiple of 20 (GRID_SIZE). UI range: 100–600 (5–30 grid steps). |
