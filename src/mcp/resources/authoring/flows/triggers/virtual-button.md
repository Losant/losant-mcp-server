# Virtual Button Trigger (`type: "virtualButton"`)

A button in the Losant UI that manually fires the flow on demand. Available in cloud, experience, and edge (minimum GEA 1.5.0) flows.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"virtualButton"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"virtualButton"` |
| `meta.label` | `"Virtual Button"` (default) |

## Cloud (Application) flows

```json
{
  "type": "virtualButton",
  "config": {},
  "meta": {
    "category": "trigger",
    "name": "virtualButton",
    "label": "Virtual Button",
    "payload": "",
    "x": 60,
    "y": 60
  },
  "outputIds": [["first-node"]]
}
```

- **`key`** — Server-generated. Omit it on create.
- **`meta.payload`** — Optional JSON-encoded object string that becomes `data` on the flow payload. Omit or set to `""` for an empty `data: {}`. Must be a valid JSON object (not a primitive or array) if set.

**Payload at runtime:**
```json
{
  "time": "<ISO timestamp when the button was pressed>",
  "data": {},
  "relayId": "<ID of the actor who pressed the button — user ID, flow ID, API token, etc.>",
  "relayType": "<type of actor — e.g. 'user', 'flow', 'apiToken'>",
  "triggerId": "<unique trigger ID>",
  "triggerType": "virtualButton"
}
```

`data` is the parsed value of `meta.payload`, or `{}` if not set.

## Experience flows

Same as Cloud. In addition, the payload includes:

```json
"experience": {
  "version": "<experience version name serving this request>"
}
```

Note: for virtual button in experience flows, only `experience.version` is added — `experience.user` and `experience.endpoint` are not present.

## Edge flows

Same as Cloud, with one difference: edge virtual button payloads omit `relayId` and `relayType`. Minimum GEA 1.5.0.

## Idiom notes

- **Use for testing and manual overrides, not for production triggers.** Virtual buttons are best for one-off tests, manual re-runs, and developer flows — not for event-driven automation.
- **Set `meta.payload` to a realistic test payload** to simulate what a real trigger would provide. This lets you test downstream nodes without spinning up a real device or endpoint.
- **Multiple virtual buttons in one flow.** Add multiple `virtualButton` entries to the `triggers` array with different `meta.payload` values to test different code paths from the same flow.
- **`meta.payload` must be a JSON object string, not a primitive.** `"{\"key\":\"value\"}"` is valid; `"\"hello\""` or `"42"` are not.
