# Simple Blocks

Trivial block types whose entire spec fits in ~10 lines. Each entry below is independent — read only the ones you need. Anchors match the `blockType` value (e.g. `#section-header`).

For the block object shape (`id`, `blockType`, `title`, `startX/Y/width/height`, `applicationId`) see `workflow-guide.md`. Only the `config` and any block-specific notes are documented here.

> _Demo subset — production version covers all ~9 trivial block types._

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

Renders a static image. No interactivity, no data binding.

- **Human-facing name:** Image
- **Application required on block:** Yes (in org/sandbox).
- **Typical layout:** Whatever fits the image's aspect ratio.

config:

| Field | Type | Default | Notes |
|---|---|---|---|
| `url` | string | — | Required. HTTPS URL pointing to the image. |
| `align` | `"left"` \| `"center"` \| `"right"` | `"center"` | Horizontal alignment within the block. |
| `fit` | `"contain"` \| `"cover"` \| `"fill"` \| `"none"` | `"contain"` | CSS object-fit semantics. |

```json
{
  "blockType": "image",
  "title": "",
  "startX": 0, "startY": 0, "width": 1, "height": 1,
  "config": { "url": "https://example.com/logo.png", "fit": "contain" }
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
| `sortColumn` | string | — | Column to sort by (`name`, `creationDate`, etc.). |
| `sortDirection` | `"asc"` \| `"desc"` | `"asc"` | Sort order. |
| `applicationIds` | string[] | — | Optional. When set, restricts the list to these applications. When omitted, shows all the owner can see. |

```json
{
  "blockType": "application-list",
  "title": "Applications",
  "startX": 0, "startY": 0, "width": 1, "height": 3,
  "config": { "sortColumn": "name", "sortDirection": "asc" }
}
```
