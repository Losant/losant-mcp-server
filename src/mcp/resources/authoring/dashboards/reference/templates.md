# Dashboard Template Reference

Losant's dashboard templating uses a Handlebars-based dialect. Most block config fields that accept a string also accept `{{...}}` expressions — the rendered value is what the block uses at display time.

## The render context

### Context variables (`ctx`)

Variables defined in `contextConfiguration` are available as `{{ctx.<name>}}` anywhere a field is templated. The exact value depends on the variable type — see `losant://references/dashboard/context-configuration` for the full type reference and how each resolves.

### Dashboard variables (`dashboard`)

Always available, regardless of context configuration:

| Variable | Type | Notes |
|---|---|---|
| `{{dashboard.id}}` | string | Unique ID of this dashboard. |
| `{{dashboard.name}}` | string | The dashboard's name. |
| `{{dashboard.duration}}` | integer (ms) | Global duration currently applied. Use as a block's `duration` value to inherit the dashboard-level time control. |
| `{{dashboard.resolution}}` | integer (ms) | Global resolution currently applied. Use alongside `duration: "{{dashboard.duration}}"`. |
| `{{dashboard.refreshRate}}` | number (seconds) | Current refresh interval. |
| `{{dashboard.time}}` | integer (Unix ms) | Timestamp of the most recent data fetch; when viewing a past dashboard state, the selected past timestamp. |
| `{{dashboard.themeName}}` | `"light"` \| `"dark"` | Current presentation theme. |
| `{{dashboard.isFullScreen}}` | boolean | Whether the dashboard is in browser fullscreen mode. |
| `{{dashboard.viewContext}}` | string | How the dashboard is being consumed: `"platform"`, `"experience"`, `"embeddedBlock"`, `"embeddedDashboard"`, or `"report"`. |

`{{dashboard.viewContext}}` is useful for adapting content when a dashboard is embedded vs. viewed on-platform — for example, hiding navigation links in a `section-header` when rendered in a report.

### Segment result variables

Inside segment `expression` fields and indicator block condition expressions, the query result is available:

| Variable | Notes |
|---|---|
| `{{value}}` | The aggregated value for this data point or gauge result. |
| `{{time}}` | The timestamp of the data point (Unix ms). |

In `indicator` block conditions, each segment result is indexed (0-based):
- `{{value-0}}`, `{{time-0}}` — first segment result
- `{{value-1}}`, `{{time-1}}` — second segment result, etc.

### Row template variables

In column `rowTemplate` fields (device-list, device-state-table, event-list), per-row variables are available:

| Variable | Notes |
|---|---|
| `{{value}}` | The cell's data value. |
| `{{time}}` | State timestamp (where applicable). |
| `{{deviceId}}` | The device's ID. |
| `{{deviceName}}` | The device's name. |
| `{{deviceTags.KEY}}` | Tag value for a specific tag key. |
| `{{ctx.<name>}}` | Any context variable. |

For `event-list` custom columns, the full `event` object is available:
```
{{event.subject}}, {{event.level}}, {{event.state}}, {{event.data.FIELD}}
```

---

## The `format` helper

`{{format value}}` renders a value with Losant's default formatter: numbers get locale-appropriate formatting, timestamps become human-readable strings. Use in `rowTemplate` fields when you want sensible display without specifying a D3 format string.

---

## Expressions

Fields labelled `expression` (e.g. on graph segments, gauge segments) accept a Handlebars template that transforms the raw value before display:

```handlebars
{{add (multiply value 1.8) 32}}
```

Available helpers: arithmetic (`add`, `subtract`, `multiply`, `divide`), comparison (`gt`, `lt`, `eq`), string (`upper`, `lower`, `concat`). An invalid expression reverts to the raw value — no error is surfaced to the viewer.

---

## JSON templates

The `payload` field on Input Controls buttons is a **JSON template** — the entire string is evaluated as Handlebars and the result must be valid JSON:

```json
{"brightness": {{brightness}}, "enabled": {{enabled}}, "label": "{{text-label}}"}
```

Numbers and booleans render unquoted; strings must be double-quoted.

---

## Advanced query strings

Any block `query` field (device query, event query, data-table query) is a **JSON-encoded string**. Build the query object, `JSON.stringify()` it, then assign. The Handlebars context is available inside query strings for templated queries:

```js
const queryObj = { "tags.fleet": { "$eq": ctx.fleet } };
block.config.query = JSON.stringify(queryObj);
```

Never paste a raw JSON object into `query` — the field must be a string.
