---
name: losant-dashboard-authoring
description: Build, edit, and update Losant application dashboards through the API — dashboard envelope, the 4-column layout grid, the block object shape, the 24 block types and where their detail docs live, the context-variable system that lets one dashboard render against different inputs, refresh / duration / resolution semantics, public-vs-private access controls, and report configuration. Includes a catalog of every block type with pointers to detail docs. Use whenever you are creating or modifying a dashboard body (the `blocks` or `contextConfiguration` arrays) via the Losant REST API.
---

# Losant Dashboard Authoring

This guide covers **application-owned dashboards** — created via `POST /applications/{appId}/dashboards`. Organization-owned and sandbox-owned dashboards (which allow blocks to draw from multiple applications) are supported by the Losant platform but are not currently available through the MCP tools.

The **envelope, layout grid, and shared block shape** are described here in full. The **per-block detail** — what goes in a block's `config` — lives in `losant://dashboard/blocks/{blockType}`, indexed by the catalog table below. Cross-cutting concepts that several block docs reference live in `reference/`.

**Reading order for a new authoring task:**
1. **Discover device attributes before choosing blocks** — call `losant_query operation=get resourceType=device` on the target device(s) and inspect the `attributes` array. Attribute names in block configs must match exactly.
2. Read the envelope, layout, and block-shape sections of this file (you're already here).
3. For each block type you intend to use, locate it in the catalog and read its Spec file.
4. If the user wants the dashboard to be parameterized (one layout, different devices/attributes/users), read `losant://references/dashboard/context-configuration`.
5. If the dashboard will be served inside a Losant Experience (as part of a web portal for experience users), read `losant://guides/experiences` — dashboards can be embedded via the `{{element 'dashboard' ...}}` Handlebars helper in any experience page, with context variable values driven directly from the experience request context.

---

## One resource, no versioning

Unlike workflows, a dashboard has **no version model**. There is one mutable document per dashboard. PATCH edits go live immediately for everyone viewing the dashboard on next refresh.

- `POST /applications/{appId}/dashboards` to create.
- `PATCH /dashboards/{dashboardId}` to update name, blocks, context, refresh rate, access, etc.
- `DELETE /dashboards/{dashboardId}` to remove.

The choice of POST endpoint determines the **data-source scope** (see next section). It cannot be changed after creation.

## Data-source scope

These guides cover **application-owned dashboards** — created via `POST /applications/{appId}/dashboards`. All blocks draw data from that single parent application. The server automatically populates `applicationId` on every block that needs it; do not set it in block objects.

Three block types (`application-list`, `dashboard-list`, `iframe`) have no application data source and carry no `applicationId` at all.

## Dashboard create body (POST)

Required: `name`. POST to `/applications/{appId}/dashboards`.

```json
{
  "name": "Fleet overview",
  "description": "Top-level view of all trucks",
  "defaultTheme": "dark",
  "refreshRate": 60,
  "duration": 86400000,
  "resolution": 3600000,
  "public": false,
  "blocks": [ /* see Blocks */ ],
  "contextConfiguration": [ /* see losant://references/dashboard/context-configuration */ ],
  "reportConfigs": [ /* email reports — optional */ ]
}
```

### Dashboard-level fields

| Field | Type | Default | Notes |
|---|---|---|---|
| `name` | string | — | **Required.** |
| `description` | string | — | Optional. Visible on public dashboards too. |
| `defaultTheme` | `"dark"` \| `"light"` | `"light"` | The theme a new viewer sees; individual users can override and the preference sticks per-user. |
| `refreshRate` | number (seconds) | `60` | How often data-bearing blocks re-query. Range: 5–600. |
| `duration` | integer (ms) | — | Dashboard-level time window for time-series blocks that reference `{{dashboard.duration}}`. |
| `resolution` | integer (ms) | — | Dashboard-level aggregation bucket size. Must be **≤ `duration`** or the save will fail. |
| `public` | boolean | `false` | When `true`, the dashboard is reachable without a Losant session. **Any data shown in a public dashboard is public.** |
| `password` | string \| `null` | `null` | When set, the dashboard requires this password in addition to the URL. Not compatible with `public: false`. |
| `reportConfigs` | object[] | `[]` | Up to 10 recurring email reports. Each entry: `{ "emailAddresses": string[], "time": "HH:MM", "timezone": "America/Chicago", "days": [0–6], "subject": string, "message": string, "context": object }`. `days` is 0 = Sunday through 6 = Saturday. `context` overrides context variable defaults for the report render. Reports are PDF snapshots of the dashboard at the scheduled time. |

## Layout grid

Blocks are positioned on a **4-column grid** (columns indexed 0 through 3, in 0.5-unit increments) with **no row limit** (the dashboard scrolls vertically).

- `startX` / `startY`: top-left corner of the block (in grid units).
- `width` / `height`: block size (in grid units).
- All four are snapped to the nearest 0.5 on save (`0` → `0`, `1.3` → `1.5`, etc.).
- `startX + width` must not exceed 4. (E.g. `startX: 0, width: 4` fills a row; `startX: 2, width: 3` is rejected.)
- `startY + height` has no upper bound.
- **Blocks may not overlap.** The save call returns an "Overlapping blocks" validation error.
- Minimum block size is `0.5 × 0.5`.

## Block object shape

Every block object has the same outer shape. The block-type-specific part is `blockType` and `config`.

```json
{
  "id": "ts-1",
  "blockType": "graph",
  "title": "Temperature",
  "description": "",
  "startX": 0,
  "startY": 0,
  "width": 4,
  "height": 2,
  "config": { /* type-specific — see the detail file */ }
}
```

- `blockType` is the lower-case kebab string from the catalog below (e.g. `"graph"`, `"section-header"`, `"custom-html"`). **Not** the same as the human-facing block name on docs.losant.com (e.g. the API `blockType: "graph"` is documented as "Time Series Graph").
- `id` is optional on create — the server assigns one if omitted. Required to be unique within the dashboard.
- `title` is the block's header bar text. Empty / omitted = no header bar (some block types still render their own internal title).
- `description` is shown in a tooltip on the header bar.
- Do not set `applicationId` on blocks — the server populates it automatically from the parent application. The three no-app blocks (`application-list`, `dashboard-list`, `iframe`) never carry `applicationId`.
- `startX` / `startY` / `width` / `height` are required (see Layout above).
- `config` shape is block-type-specific. Look up the per-block file via the catalog. **Required on some block types** (e.g. `image-overlay`) — omitting `config` when it is required causes a 400.

## Context configuration

`contextConfiguration` is what makes a dashboard parameterizable — e.g. "show this layout for device X, then change `?ctx[deviceId]=Y` in the URL to see the same layout for device Y." Six variable types are supported (`deviceId`, `deviceTag`, `deviceAttribute`, `number`, `string`, `experienceUser`). Each variable has a name, a default value, and optional validation. Block configs reference variables as `{{ctx.<name>}}` in templated fields and via the `deviceIds` / `deviceTags` selectors.

See [losant://references/dashboard/context-configuration](losant://references/dashboard/context-configuration) for the full variable-type details and idiomatic usage.

---

## Minimal example — one application-owned dashboard with two blocks

```json
{
  "name": "Truck #42 telemetry",
  "refreshRate": 60,
  "duration": 86400000,
  "resolution": 3600000,
  "blocks": [
    {
      "blockType": "section-header",
      "startX": 0, "startY": 0, "width": 4, "height": 0.5,
      "config": {
        "title": "Truck #42",
        "content": "Last 24 hours of telemetry from truck 42."
      }
    },
    {
      "blockType": "graph",
      "title": "Engine temperature",
      "startX": 0, "startY": 0.5, "width": 4, "height": 2,
      "config": {
        "duration": "{{dashboard.duration}}",
        "resolution": "{{dashboard.resolution}}",
        "segments": [
          {
            "deviceIds": ["5f1c2d3e4f5a6b7c8d9e0f1a"],
            "attribute": "engineTempC",
            "aggregation": "MEAN",
            "graphType": "line",
            "yAxisId": "main"
          }
        ],
        "yAxes": [
          { "id": "main", "label": "°C", "position": "left" }
        ]
      }
    }
  ]
}
```

(For an application-owned dashboard, POST to `/applications/{appId}/dashboards` and leave each block's `applicationId` off — the server fills it in.)

---

## Block catalog

### Choose by category

Use this to pick the right block before looking up its spec.

| Category | Blocks | Use when… |
|---|---|---|
| **Time series & gauges** | `graph`, `gauge`, `bar`, `pie` | Displaying numeric telemetry over time or as a current value |
| **Device & fleet tables** | `device-state-table`, `device-list`, `device-count`, `device-log` | Showing device metadata, attribute state, or connectivity across a fleet |
| **Location** | `map`, `heatmap`, `position-chart` | Visualizing where devices are or have been (GPS or image-coordinate) |
| **Events & status** | `event-list`, `open-event-indicator`, `indicator` | Surfacing alerts, event state, or computed go/no-go status |
| **Control & interaction** | `input` | Letting viewers send device commands or trigger workflows |
| **Visual & layout** | `image`, `image-overlay`, `section-header`, `iframe` | SCADA panels, background images, dividers, embedded external pages |
| **Custom rendering** | `custom-chart`, `custom-html` | Vega/Vega-Lite visualizations or arbitrary HTML/JS |
| **Administrative lists** | `application-list`, `dashboard-list`, `workflow-list`, `data-table` | Showing platform resources, not device telemetry |

### Full catalog

| `blockType` | Human-facing name | Spec |
|---|---|---|
| `application-list` | Application List | [losant://dashboard/blocks/application-list](losant://dashboard/blocks/application-list) |
| `bar` | Bar Chart | [losant://dashboard/blocks/bar](losant://dashboard/blocks/bar) |
| `custom-chart` | Custom Chart | [losant://dashboard/blocks/custom-block](losant://dashboard/blocks/custom-block) |
| `custom-html` | Custom HTML | [losant://dashboard/blocks/custom-block](losant://dashboard/blocks/custom-block) |
| `dashboard-list` | Dashboard List | [losant://dashboard/blocks/dashboard-list](losant://dashboard/blocks/dashboard-list) |
| `data-table` | Data Table | [losant://dashboard/blocks/data-table](losant://dashboard/blocks/data-table) |
| `device-count` | Device Count | [losant://dashboard/blocks/device-count](losant://dashboard/blocks/device-count) |
| `device-list` | Device List | [losant://dashboard/blocks/device-list](losant://dashboard/blocks/device-list) |
| `device-log` | Device Connection Log | [losant://dashboard/blocks/device-log](losant://dashboard/blocks/device-log) |
| `device-state-table` | Device State Table | [losant://dashboard/blocks/device-state-table](losant://dashboard/blocks/device-state-table) |
| `event-list` | Event List | [losant://dashboard/blocks/event-list](losant://dashboard/blocks/event-list) |
| `gauge` | Gauge | [losant://dashboard/blocks/gauge](losant://dashboard/blocks/gauge) |
| `graph` | **Time Series Graph** | [losant://dashboard/blocks/graph](losant://dashboard/blocks/graph) |
| `heatmap` | GPS Heatmap | [losant://dashboard/blocks/heatmap](losant://dashboard/blocks/heatmap) |
| `iframe` | External Website | [losant://dashboard/blocks/iframe](losant://dashboard/blocks/iframe) |
| `image` | Image | [losant://dashboard/blocks/image](losant://dashboard/blocks/image) |
| `image-overlay` | Image Overlay | [losant://dashboard/blocks/image-overlay](losant://dashboard/blocks/image-overlay) |
| `indicator` | Indicator | [losant://dashboard/blocks/indicator](losant://dashboard/blocks/indicator) |
| `input` | Input Controls | [losant://dashboard/blocks/input](losant://dashboard/blocks/input) |
| `map` | GPS History | [losant://dashboard/blocks/map](losant://dashboard/blocks/map) |
| `open-event-indicator` | Open Event Indicator | [losant://dashboard/blocks/open-event-indicator](losant://dashboard/blocks/open-event-indicator) |
| `pie` | Pie Chart | [losant://dashboard/blocks/pie](losant://dashboard/blocks/pie) |
| `position-chart` | Position Chart | [losant://dashboard/blocks/position-chart](losant://dashboard/blocks/position-chart) |
| `section-header` | Section Header | [losant://dashboard/blocks/section-header](losant://dashboard/blocks/section-header) |
| `workflow-list` | Workflow List | [losant://dashboard/blocks/workflow-list](losant://dashboard/blocks/workflow-list) |

---

## Validation errors you'll hit

- `Overlapping blocks.` — Two blocks have intersecting grid positions. Recompute `startX`/`startY`/`width`/`height` so they don't intersect.
- `Block positioned out of range.` — `startX + width > 4`. The grid is 4 columns wide.
- `Block IDs must be unique.` — Two blocks have the same `id`. Either omit `id` and let the server assign, or pick distinct values.
- `Resolution cannot be greater than Duration.` — Dashboard-level `resolution` exceeds `duration`. Both are in milliseconds.
- `Linked application is invalid.` — The `applicationId` on the dashboard itself doesn't correspond to a valid application for this endpoint.
- `Invalid Block Query String` — A `config.query` field on a block is missing/not-a-string/too-large. Block queries are templatable JSON strings; build the JSON in your code, then JSON.stringify it before assigning.

## Common mistakes

- Forgetting that the layout grid is **4 wide**, in 0.5-unit increments, with no row limit. A block taking the full width has `startX: 0, width: 4`.
- Using the human-facing block name (`"time-series-graph"`, `"external-website"`) as `blockType` instead of the API enum (`"graph"`, `"iframe"`). The catalog above is the source of truth.
- Setting `password` on a dashboard with `public: false` — password protection is silently discarded on non-public dashboards; `password` only applies when `public: true`.
- Trying to "publish a version" — there are no versions. PATCH is live for all viewers on next refresh.

## Cross-cutting reference

- [losant://references/dashboard/context-configuration](losant://references/dashboard/context-configuration) — the six context-variable types, how blocks reference them, validation, the URL `?ctx[name]=value` mechanism, the `{{dashboard.*}}` render context, and how context values are supplied when dashboards are embedded in Experience pages.
- [losant://references/dashboard/templates](losant://references/dashboard/templates) — Losant's Handlebars dialect, the helpers available in block templates and conditions (`format`, expressions, etc.), and the full dashboard render context (`{{ctx.x}}`, `{{dashboard.duration}}`, `{{value-i}}`, `{{time-i}}`).
- [losant://references/dashboard/device-queries](losant://references/dashboard/device-queries) — the device-query shape (`deviceIds`, `deviceTags`, `query`) used in most blocks, including context-variable substitution and the `fromCtx` pattern.
- [losant://references/dashboard/aggregations](losant://references/dashboard/aggregations) — the aggregation enum (`MEAN`, `MAX`, `MIN`, `COUNT`, `SUM`, `MEDIAN`, `STD_DEV`, `FIRST`, `LAST`, `NONE`) used by time-series and gauge-style blocks.
- [losant://guides/experiences](losant://guides/experiences) — how to embed this dashboard in a Losant Experience view, and how to wire experience request context (user, path params, pageData) into dashboard context variables.
