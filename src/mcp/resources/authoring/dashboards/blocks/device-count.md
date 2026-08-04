# Device Count Block (`blockType: "device-count"`)

Displays counts of devices matching one or more named queries, formatted with a Handlebars template. Use for fleet statistics like "online devices", "devices with low battery", or combined summaries.

See the parent `dashboard-guide.md` for the block object shape, layout grid.

## Block object shape

```json
{
  "id": "online-count",
  "blockType": "device-count",
  "title": "Online Devices",
  "startX": 2, "startY": 0, "width": 2, "height": 1,
  "config": { /* see below */ }
}
```

## Config

| Field | Notes |
|---|---|
| `segments` | **Required. At least 1, up to 100.** Named device count queries. |
| `conditions` | Optional conditional display rules. |
| `defaultCondition` | **Required.** Display properties when no condition matches (or when `conditions` is absent). |

### `segments`

Array of named count queries. Each segment's count is available in conditions and the `defaultCondition.value` template via `{{segmentId.count}}`.

```json
{
  "id": "total",
  "query": "{}"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Name used to reference this count (e.g., `total`). Max 48 chars. |
| `query` | string | yes | Advanced **device** query as a JSON-encoded string — same format as the `query` selector in [losant://references/dashboard/device-queries](losant://references/dashboard/device-queries). Use `"{}"` to count all devices. This is a device filter, not a row filter. |

### `conditions`

Optional ordered list of conditional display overrides — same `condition` array used by gauge and indicator blocks. Each entry:

| Field | Type | Notes |
|---|---|---|
| `condition` | string | Handlebars expression. Available: `{{segmentId.count}}` for each segment. Truthy = this condition applies. |
| `color` | string | Block background CSS color. |
| `label` | string | Display label (supports Markdown). |
| `id` | string | Optional identifier. |

### `defaultCondition`

**Required.** Applied when no `conditions` entry is truthy (or `conditions` is empty).

| Field | Type | Required | Notes |
|---|---|---|---|
| `color` | string | yes | Block background CSS color. |
| `label` | string | — | Optional label (supports Markdown). |
| `value` | string | — | Handlebars template for the displayed value. Use `{{segmentId.count}}` to show counts. |

## Worked example — online vs. total count

```json
{
  "id": "device-count",
  "blockType": "device-count",
  "title": "Fleet Status",
  "startX": 0, "startY": 0, "width": 2, "height": 1,
  "config": {
    "segments": [
      { "id": "online", "query": "{\"connectionStatus\":{\"$eq\":\"connected\"}}" },
      { "id": "total", "query": "{}" }
    ],
    "conditions": [
      { "condition": "{{online.count}} < 3", "color": "#E74C3C", "label": "Low online count" }
    ],
    "defaultCondition": {
      "color": "#27AE60",
      "value": "**{{online.count}}** / {{total.count}} online"
    }
  }
}
```

## Idiom notes

- `query` in each segment is a **JSON-encoded string** — build the query object and JSON.stringify it.
- Segment `id` is the key used in condition and value templates: `{{segmentId.count}}`.
- Use `query: "{}"` to count all devices in the application.
- Use `{{ctx.<name>}}` inside query strings and templates to parameterize by context variable.
