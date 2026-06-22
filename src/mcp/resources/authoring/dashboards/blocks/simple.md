# Simple Blocks

Trivial block types whose entire spec fits in ~10 lines. Each entry below is independent — read only the ones you need. Anchors match the `blockType` value (e.g. `#section-header`).

For the block object shape (`id`, `blockType`, `title`, `startX/Y/width/height`, `applicationId`) see the parent `dashboard-guide.md`. Only the `config` and any block-specific notes are documented here.

---

## section-header

A horizontal banner with a title and Markdown-supporting content. Pure presentation — no data queries.

- **Human-facing name:** Section Header
- **Application required on block:** Yes (in org/sandbox dashboards) — but the block doesn't actually use it.
- **Typical layout:** `width: 4, height: 0.5` (full-width strip).

config:

| Field | Type | Default | Notes |
|---|---|---|---|
| `title` | string | `""` | The large heading text. |
| `content` | string | `""` | Markdown body. Links, formatting, images all render. |

```json
{
  "blockType": "section-header",
  "startX": 0, "startY": 0, "width": 4, "height": 0.5,
  "config": {
    "title": "Truck #42",
    "content": "Telemetry from **truck 42** over the [last 24 hours](/docs)."
  }
}
```

---

## iframe

Embeds an external web page in an `<iframe>` on the dashboard. The URL **must be HTTPS** and the remote site must permit embedding (no `X-Frame-Options: DENY`).

- **Human-facing name:** External Website
- **Application required on block:** No — `iframe` is one of three blocks that doesn't carry `applicationId`.
- **Typical layout:** Whatever real-estate the embedded page wants.

config:

| Field | Type | Default | Notes |
|---|---|---|---|
| `url` | string | — | Required. HTTPS URL. Max 2048 chars. |

```json
{
  "blockType": "iframe",
  "title": "Weather",
  "startX": 0, "startY": 3, "width": 2, "height": 1.5,
  "config": { "url": "https://www.wunderground.com/embed/abc123" }
}
```

---

## image

Renders an image from a static URL, an application file URL, or a device attribute (blob or string). No interactivity beyond an optional click-through link.

- **Human-facing name:** Image
- **Application required on block:** Yes (in org/sandbox).
- **Typical layout:** Whatever fits the image's aspect ratio.

config:

| Field | Type | Default | Notes |
|---|---|---|---|
| `imageSource` | `"static"` \| `"attribute"` | `"static"` | `"static"` = fixed URL; `"attribute"` = URL/blob from device attribute. |
| `imageUrl` | string | — | Required when `imageSource` is `"static"`. The image URL. Supports templates. |
| `deviceId` | string | — | Required when `imageSource` is `"attribute"`. Device whose attribute holds the image. |
| `attribute` | string | — | Required when `imageSource` is `"attribute"`. Attribute name (blob or string URL). |
| `imageLinkUrl` | string | — | Optional. Clicking the image navigates here. Max 2048 chars. |
| `imageLinkNewWindow` | boolean | `false` | When true, opens `imageLinkUrl` in a new tab. |
| `bgColor` | string | — | CSS color behind the image (useful for transparent PNGs). |

```json
{
  "blockType": "image",
  "title": "",
  "startX": 0, "startY": 0, "width": 1, "height": 1,
  "config": {
    "imageSource": "static",
    "imageUrl": "https://example.com/logo.png",
    "bgColor": "#ffffff"
  }
}
```

---

## dashboard-list

Lists dashboards the owner can see. Useful as a navigation tool on org/sandbox dashboards.

- **Human-facing name:** Dashboard List
- **Application required on block:** **No** — one of three blocks without `applicationId`.
- **Typical layout:** Tall and narrow, often as a sidebar or landing-page index.

config:

| Field | Type | Default | Notes |
|---|---|---|---|
| `filter` | string | — | Optional glob pattern to filter dashboards by name. Max 255 chars. |

```json
{
  "blockType": "dashboard-list",
  "title": "Dashboards",
  "startX": 0, "startY": 0, "width": 1, "height": 3,
  "config": { "filter": "Fleet*" }
}
```

---

## device-log

Shows a chronological list of connection and disconnection events for one or more devices. Useful for monitoring device connectivity health.

- **Human-facing name:** Device Connection Log
- **Application required on block:** Yes.
- **Typical layout:** Wide and moderately tall.

config:

| Field | Type | Default | Notes |
|---|---|---|---|
| `deviceIds` | string[] | — | Explicit device IDs to include. Supports context templates. |
| `deviceTags` | object[] | — | Tag-based device selection. |
| `query` | string | — | Advanced device query as a JSON-encoded string. |
| `includeDeviceInfo` | boolean | `false` | When true, includes device name and ID columns in addition to log data. |
| `maxResultsPerDevice` | string | `"20"` | Maximum log entries to show per device. Templatable. |

```json
{
  "blockType": "device-log",
  "title": "Connection Log",
  "startX": 0, "startY": 0, "width": 4, "height": 2,
  "config": {
    "deviceIds": ["5f1c2d3e4f5a6b7c8d9e0f1a"],
    "includeDeviceInfo": true,
    "maxResultsPerDevice": "50"
  }
}
```

---

## open-event-indicator

Shows the most severe open event in the application as a color-coded banner. Color maps to level: critical/error = red, warning = orange, info = blue, none = green.

- **Human-facing name:** Open Event Indicator
- **Application required on block:** Yes.
- **Typical layout:** Typically `width: 4, height: 0.5` as a status strip.

config:

| Field | Type | Default | Notes |
|---|---|---|---|
| `allowUpdates` | boolean | `false` | When true, users with sufficient permissions can acknowledge or resolve events directly from the block. |
| `query` | string | — | Advanced event query (JSON-encoded string) to filter which events are considered. |
| `filter` | string | — | Name/subject glob filter. Max 255 chars. |

```json
{
  "blockType": "open-event-indicator",
  "title": "",
  "startX": 0, "startY": 0, "width": 4, "height": 0.5,
  "config": {
    "allowUpdates": true,
    "filter": "Temp*"
  }
}
```

---

## workflow-list

Lists workflows in the application with their enabled/disabled status and 24-hour run/error counts. Useful for operational monitoring dashboards.

- **Human-facing name:** Workflow List
- **Application required on block:** Yes.
- **Typical layout:** Tall and moderately wide.

config:

| Field | Type | Default | Notes |
|---|---|---|---|
| `filter` | string | — | Optional glob pattern to filter workflows by name. Max 255 chars. |
| `includeCloud` | boolean | `true` | Include application workflows. |
| `includeEdge` | boolean | `true` | Include edge workflows. |
| `includeEmbedded` | boolean | `true` | Include embedded workflows. |
| `includeExperience` | boolean | `true` | Include experience workflows. |
| `experienceVersion` | string | — | When set, only shows experience workflows belonging to this experience version slug. |

```json
{
  "blockType": "workflow-list",
  "title": "Workflows",
  "startX": 0, "startY": 0, "width": 2, "height": 3,
  "config": {
    "filter": "Alert*",
    "includeCloud": true,
    "includeEdge": false,
    "includeEmbedded": false,
    "includeExperience": false
  }
}
```

---

## application-list

Lists applications the dashboard's owner can see. Useful on multi-application org / sandbox dashboards as a navigation aid.

- **Human-facing name:** Application List
- **Application required on block:** **No** — doesn't carry `applicationId`.
- **Typical layout:** Tall and narrow, often as a sidebar.

config:

| Field | Type | Default | Notes |
|---|---|---|---|
| `filter` | string | — | Optional glob pattern to filter applications by name. Max 255 chars. |

```json
{
  "blockType": "application-list",
  "title": "Applications",
  "startX": 0, "startY": 0, "width": 1, "height": 3,
  "config": {}
}
```
