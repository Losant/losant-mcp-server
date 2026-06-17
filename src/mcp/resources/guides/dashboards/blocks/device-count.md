# Device Count Block (`blockType: "device-count"`)

Displays counts of devices matching one or more queries, formatted with a Handlebars template. Use for fleet statistics like "online devices", "devices with low battery", or combined summaries.

See `workflow-guide.md` for block object shape, layout grid, and `applicationId` rules.

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

| Field | Type | Notes |
|---|---|---|
| `queries` | object[] | **Required. Up to 100.** Each query returns a count accessible as `{{value-i.count}}` (0-indexed). |
| `displayTemplate` | string | **Required.** Handlebars template for the displayed value. |
| `conditionalColors` | object[] | Optional conditions for block background color. |

### Query shape

```json
{
  "query": "{\"tags\":{\"$tagKey\":\"status\",\"$tagValue\":\"online\"}}",
  "label": "Online"
}
```

`query` is an advanced device query as a **JSON-encoded string**. The result count is accessed as `{{value-i.count}}` in `displayTemplate` (i = 0-based index of the query in the array).

`query` can also be `{}` (as a JSON string: `"{}"`) to count all devices.

### displayTemplate

Handlebars template. Available variables: `{{value-0.count}}`, `{{value-1.count}}`, etc. (one per query).

```json
"displayTemplate": "{{value-0.count}} / {{value-1.count}} online"
```

Supports full Handlebars and Markdown. Large values often look good with just `{{value-0.count}}`.

### Conditional colors

```json
"conditionalColors": [
  { "expression": "{{value-0.count}} < 5", "color": "#E74C3C" },
  { "expression": "{{value-0.count}} >= 5", "color": "#27AE60" }
]
```

## Worked example — online vs. total count

```json
{
  "id": "device-count",
  "blockType": "device-count",
  "title": "Fleet Status",
  "startX": 0, "startY": 0, "width": 2, "height": 1,
  "config": {
    "queries": [
      { "query": "{\"connectionStatus\":{\"$eq\":\"connected\"}}", "label": "Online" },
      { "query": "{}", "label": "Total" }
    ],
    "displayTemplate": "**{{value-0.count}}** / {{value-1.count}} online",
    "conditionalColors": [
      { "expression": "{{value-0.count}} < 3", "color": "#E74C3C" }
    ]
  }
}
```

## Idiom notes

- `query` in each query object is a **JSON-encoded string** — build the query object and JSON.stringify it.
- Use `{{ctx.<name>}}` inside `query` strings and `displayTemplate` to parameterize by context variable.
