# Simple Nodes

Trivial node types whose entire spec fits in a few lines. Each entry is independent — read only the ones you need.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default | Available in |
|---|---|---|---|---|
| `DebugNode` | `debug` | `debug` | `"Debug"` | all |
| `GenerateIdNode` | `logic` | `generateId` | `"Generate ID"` | all |
| `JsonDecodeNode` | `logic` | `jsonDecode` | `"JSON Decode"` | all |
| `JsonEncodeNode` | `logic` | `jsonEncode` | `"JSON Encode"` | all |
| `Base64DecodeNode` | `logic` | `base64Decode` | `"Base64: Decode"` | all |
| `Base64EncodeNode` | `logic` | `base64Encode` | `"Base64: Encode"` | all |
| `DelayNode` | `logic` | `delay` | `"Delay"` | cloud, exp, edge, custom |
| `ThrowErrorNode` | `debug` | `throwError` | `"Throw Error"` | all |
| `RandomNumberNode` | `logic` | `randomNumber` | `"Random Number"` | all |
| `LatchNode` | `logic` | `latch` | `"Latch"` | all |
| `BranchOnChangeNode` | `logic` | `branchOnChange` | `"On Change"` | all |
| `AnnotationNode` | `logic` | `annotation` | `"Annotation"` | all |

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
| `namespaceTemplate` | - | When idTypeTemplate is `uuidv3` or `uuidv5` this field is **required**. |
| `valueTemplate` | - | When idTypeTemplate is `uuidv3` or `uuidv5` this field is **required**. |
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

| Field | Default | Notes |
|---|---|
| `source` | - | **Required.** Payload path of the JSON string to decode. |
| `destination` | - | **Required.** Payload path to write the parsed value. |
| `errorBehavior` | `throw` |  What to do with JSON parse errors, either `throw` or `payloadPath` |
| `errorPath` | - | If `errorBehavior` equals `throw` then this path is required  |

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

Decodes a Base64 string to a UTF-8 string. Available in only embedded flow class.

```json
{
  "id": "decode-b64",
  "type": "Base64DecodeNode",
  "meta": { "category": "logic", "name": "base64-decode", "label": "Base64: Decode", "x": 0, "y": 0 },
  "outputIds": [["next"]],
  "config": { "sourceTemplate": "{{working.encoded}}", "resultPath": "working.decoded" }
}
```

| Field | Notes |
|---|---|
| `sourceTemplate` | **Required.** Template resolving to the Base64 string to decode. |
| `resultPath` | **Required.** Payload path to write the decoded string. |

---

## Base64: Encode Node (`type: "Base64EncodeNode"`)

Encodes a string to Base64. Available in only embedded flow class.

```json
{
  "id": "encode-b64",
  "type": "Base64EncodeNode",
  "meta": { "category": "logic", "name": "base64-encode", "label": "Base64: Encode", "x": 0, "y": 0 },
  "outputIds": [["next"]],
  "config": { "sourceTemplate": "{{working.plaintext}}", "resultPath": "working.encoded" }
}
```

| Field | Notes |
|---|---|
| `sourceTemplate` | **Required.** Template resolving to the string to encode. |
| `resultPath` | **Required.** Payload path to write the Base64 string. |

---

## Delay Node (`type: "DelayNode"`)

Pauses execution for a templated duration. Available in cloud, experience, edge, custom (not embedded).

```json
{
  "id": "wait",
  "type": "DelayNode",
  "meta": { "category": "logic", "name": "delay", "label": "Delay", "x": 0, "y": 0 },
  "outputIds": [["next"]],
  "config": { "durationTemplate": "5" }
}
```

| Field | Default | Notes |
|---|---|---|
| `durationTemplate` | — | **Required.** Renders to a number. |

Maximum delay is bounded by the workflow's overall execution timeout. For cloud, or experience the maximum delay is 59 seconds.

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
| `min` | `0` | Minimum value (inclusive). |
| `max` | `100` | Maximum value (inclusive). |
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
| `latchExpression` | `""` | **Required.** Handlebars expression to evaluate. When true and not latched, fires the true branch and latches. |
| `resetExpression` | `""` | **Required.** Handlebars expression. When true, resets the latch so the true branch can fire again. |
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
  "outputIds": [["value-changed"], ["value-same"]],
  "config": {
    "valuePath": "data.attributes.status",
    "changeType": "all",
    "onChangeIdTemplate": "statusChange-{{data.deviceId}}"
  }
}
```

`outputIds[1]` fires when the value has changed. `outputIds[0]` fires when it's the same as the previous execution.

| Field | Notes |
|---|---|
| `valuePath` | **Required.** Payload path of the value to compare. |
| `changeType` | **Required.** One of `percent`, `percentInc`, `percentDec`, `value`, `valueInc`, `valueDec`, any. Defaults to `any` |
| `changeThreshold` | Amount of change required - only required if `changeType` does not equal `all`. |
| `prevValuePath` | Payload path of where to set the previously compared value. |
| `onChangeIdTemplate` | Storage key used to persist the previous value. |

**Note**
For changeTypes other than 'any', value at valuePath must be a number, or convertible to a number - if it is not, false path will be taken. If we have never seen a value previously for this workflow and valuePath, the false path will be taken.

---

## Annotation Node (`type: "AnnotationNode"`)

A visual-only node that displays a text label on the workflow canvas. Has no runtime behavior and does not affect payload or execution. Available in all flow classes. This can be used to add notes or describe the logic of the workflow.

```json
{
  "id": "note",
  "type": "AnnotationNode",
  "meta": { "category": "logic", "name": "note", "label": "Note", "x": 0, "y": 0 },
  "outputIds": [],
  "config": { "text": "This section handles error recovery" }
}
```

| Field | Notes |
|---|---|
| `text` | The text to display in the annotation box on the canvas. |
