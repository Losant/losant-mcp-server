---
name: losant-dashboard-authoring
description: Build, edit, and update Losant dashboards through the API — dashboard envelope, the 4-column layout grid, the block object shape, the 24 block types and where their detail docs live, the context-variable system that lets one dashboard render against different inputs, refresh / duration / resolution semantics, public-vs-private access controls, and report configuration. Includes a catalog of every block type with pointers to detail docs. Use whenever you are creating or modifying a dashboard body (the `blocks` or `contextConfiguration` arrays) via the Losant REST API.
---

# Losant Dashboard Authoring

This guide is the entry point for creating and updating Losant dashboards through the API. The **envelope, layout grid, and shared block shape** are described here in full. The **per-block detail** — what goes in a block's `config` — lives in `blocks/<name>.md`, indexed by the catalog table below. Trivial block types (the ones whose entire spec fits in ~10 lines) are documented in `blocks/simple.md`. Cross-cutting concepts that several block docs reference live in `reference/`.

**Reading order for a new authoring task:**
1. Read the envelope, layout, and block-shape sections of this file (you're already here).
2. For each block type you intend to use, locate it in the catalog and read its Spec file.
3. If the user wants the dashboard to be parameterized (one layout, different devices/attributes/users), read `reference/context-configuration.md`.

---

## One resource, no versioning

Unlike workflows, a dashboard has **no version model**. There is one mutable document per dashboard. PATCH edits go live immediately for everyone viewing the dashboard on next refresh.

- `POST /dashboards` (organization / sandbox) or `POST /applications/{appId}/dashboards` (application-owned).
- `PATCH /dashboards/{dashboardId}` to update name, blocks, context, refresh rate, access, etc.
- `DELETE /dashboards/{dashboardId}` to remove.

The choice of POST endpoint determines the **data-source scope** (see next section). It cannot be changed after creation.

## Data-source scope

Set when the dashboard is created; cannot be changed later.

| Scope | Where data comes from |
|---|---|
| **Application-owned** | Only the one parent application. `applicationId` on the dashboard is fixed; blocks' `applicationId` is auto-populated to match. |
| **Organization-owned** | Any application owned by the organization. Each block specifies its own `applicationId`. |
| **Sandbox-owned** | Any application the user owns, or any organization the user belongs to. Each block specifies its own `applicationId`. |

Three block types (`application-list`, `dashboard-list`, `iframe`) do not target an application and have no `applicationId` on them.

## Dashboard create body (POST)

Required: `name`. For organization/sandbox dashboards, `orgId` is typically supplied too. For application-owned dashboards, post to the application-scoped endpoint instead and omit `orgId`.

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
  "contextConfiguration": [ /* see reference/context-configuration.md */ ],
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

Every block object has the same outer shape. The block-type-specific parts are `blockType`, `config`, and (for blocks that target an application in an org/sandbox dashboard) `applicationId`.

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
- `applicationId` is required on each block in an **organization or sandbox** dashboard (except the three no-app blocks listed above). It must reference an application that the dashboard's owner has access to. **Omit `applicationId` on blocks in an application-owned dashboard** — the server auto-fills it from the dashboard's `applicationId`.
- `startX` / `startY` / `width` / `height` are required (see Layout above).
- `config` shape is block-type-specific. Look up the per-block file via the catalog.

## Context configuration

`contextConfiguration` is what makes a dashboard parameterizable — e.g. "show this layout for device X, then change `?ctx[deviceId]=Y` in the URL to see the same layout for device Y." Six variable types are supported (`deviceId`, `deviceTag`, `deviceAttribute`, `number`, `string`, `experienceUser`). Each variable has a name, a default value, and optional validation. Block configs reference variables as `{{ctx.<name>}}` in templated fields and via the `deviceIds` / `deviceTags` selectors.

See `reference/context-configuration.md` for the full variable-type details and idiomatic usage.

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

> _Demo subset — production version covers all 24 block types._

| `blockType` | Human-facing name | Needs app? | Spec |
|---|---|---|---|
| `application-list` | Application List | no | `blocks/simple.md#application-list` |
| `bar` | Bar Chart | yes | `blocks/bar.md` |
| `custom-chart` | Custom Chart | yes | `blocks/custom-block.md` |
| `custom-html` | Custom HTML | yes | `blocks/custom-block.md` |
| `dashboard-list` | Dashboard List | no | `blocks/simple.md#dashboard-list` |
| `data-table` | Data Table | yes | `blocks/data-table.md` |
| `device-count` | Device Count | yes | `blocks/device-count.md` |
| `device-list` | Device List | yes | `blocks/device-list.md` |
| `device-log` | Device Connection Log | yes | `blocks/simple.md#device-log` |
| `device-state-table` | Device State Table | yes | `blocks/device-state-table.md` |
| `event-list` | Event List | yes | `blocks/event-list.md` |
| `gauge` | Gauge | yes | `blocks/gauge.md` |
| `graph` | **Time Series Graph** | yes | `blocks/graph.md` |
| `heatmap` | GPS Heatmap | yes | `blocks/heatmap.md` |
| `iframe` | External Website | no | `blocks/simple.md#iframe` |
| `image` | Image | yes | `blocks/simple.md#image` |
| `image-overlay` | Image Overlay | yes | `blocks/image-overlay.md` |
| `indicator` | Indicator | yes | `blocks/indicator.md` |
| `input` | Input Controls | yes | `blocks/input.md` |
| `map` | Map | yes | `blocks/map.md` |
| `open-event-indicator` | Open Event Indicator | yes | `blocks/simple.md#open-event-indicator` |
| `pie` | Pie Chart | yes | `blocks/pie.md` |
| `position-chart` | GPS History | yes | `blocks/position-chart.md` |
| `section-header` | Section Header | yes\* | `blocks/simple.md#section-header` |
| `workflow-list` | Workflow List | yes | `blocks/simple.md#workflow-list` |

\* `section-header` carries an `applicationId` in org/sandbox dashboards even though it doesn't query application data — the field is set per the dashboard's data-source scope.

The **Needs app?** column says whether a block's per-block `applicationId` is required (in an organization or sandbox dashboard). For an application-owned dashboard, the server handles this for you regardless.

---

## Validation errors you'll hit

- `Overlapping blocks.` — Two blocks have intersecting grid positions. Recompute `startX`/`startY`/`width`/`height` so they don't intersect.
- `Block positioned out of range.` — `startX + width > 4`. The grid is 4 columns wide.
- `Block IDs must be unique.` — Two blocks have the same `id`. Either omit `id` and let the server assign, or pick distinct values.
- `Resolution cannot be greater than Duration.` — Dashboard-level `resolution` exceeds `duration`. Both are in milliseconds.
- `Linked application is invalid.` — The `applicationId` on the dashboard or a block doesn't belong to the dashboard's owner.
- `Invalid Block Query String` — A `config.query` field on a block is missing/not-a-string/too-large. Block queries are templatable JSON strings; build the JSON in your code, then JSON.stringify it before assigning.

## Common mistakes

- Forgetting that the layout grid is **4 wide**, in 0.5-unit increments, with no row limit. A block taking the full width has `startX: 0, width: 4`.
- Putting `applicationId` on blocks in an application-owned dashboard. It's auto-filled — leave it off, or your write may fail if the value doesn't match.
- Omitting `applicationId` on blocks in an organization or sandbox dashboard. Every block (except `application-list`, `dashboard-list`, `iframe`) needs it.
- Using the human-facing block name (`"time-series-graph"`, `"external-website"`) as `blockType` instead of the API enum (`"graph"`, `"iframe"`). The catalog above is the source of truth.
- Setting `password` and `public: true` together — they're mutually exclusive; password protection only matters for non-public dashboards.
- Trying to "publish a version" — there are no versions. PATCH is live for all viewers on next refresh.

## Cross-cutting reference

- `reference/context-configuration.md` — the six context-variable types, how blocks reference them, validation, and the URL `?ctx[name]=value` mechanism.
- `reference/templates.md` — Losant's Handlebars dialect, the helpers available in block templates and conditions (`format`, expressions, etc.), and the dashboard render context (`{{ctx.x}}`, `{{dashboard.duration}}`, `{{value-i}}`, `{{time-i}}`).
- `reference/device-queries.md` — the device-query JSON shape used in `deviceIds` / `deviceTags` / `query` selectors on many blocks.
- `reference/aggregations.md` — the aggregation enum (`MEAN`, `MAX`, `MIN`, `COUNT`, `SUM`, `MEDIAN`, `STDDEV`, `FIRST`, `LAST`, `NONE`) used by time-series and gauge-style blocks.

## Worked examples

See `examples/` for end-to-end dashboard bodies covering multi-block patterns:

- `examples/single-device-overview.md` — application-owned, section header + graph + indicator + gauge for one device
- `examples/parameterized-by-context.md` — same layout, driven by a `deviceId` context variable so one dashboard works for the whole fleet
- `examples/org-multi-application.md` — organization-owned, blocks pulling from multiple applications
- `examples/public-status-page.md` — public dashboard, password-free, intended for external embedding
- `examples/email-report-config.md` — adding `reportConfigs` for a recurring PDF emailed to a list
