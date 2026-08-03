# Section Header Block (`blockType: "section-header"`)

A horizontal banner with a title and Markdown-supporting body. Pure presentation — no data queries, no device selection.

## Block object shape

```json
{
  "id": "hdr-1",
  "blockType": "section-header",
  "title": "",
  "startX": 0,
  "startY": 0,
  "width": 4,
  "height": 0.5,
  "config": {
    "title": "Truck #42",
    "content": "Telemetry from **truck 42** over the last 24 hours."
  }
}
```

- `title` on the outer block object is the block header bar; `config.title` is the large heading rendered inside the block.

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `title` | string | `""` | Large heading text rendered inside the block. |
| `content` | string | `""` | Markdown body. Links, bold, italic, images all render. |

## Worked example — full-width section divider with Markdown body

```json
{
  "id": "hdr-fleet",
  "blockType": "section-header",
  "title": "",
  "startX": 0,
  "startY": 0,
  "width": 4,
  "height": 0.5,
  "config": {
    "title": "Fleet Status",
    "content": "Live telemetry — refreshes every 60 s. [Docs](/docs)"
  }
}
```

## Idiom notes

- Typical size is `width: 4, height: 0.5` — a full-width strip that consumes half a grid row.
- Use as a visual divider between groups of blocks; set `title: ""` on the outer object so the block has no header bar of its own.
- `config.content` supports full Markdown including links, but avoid large tables — they won't reflow well in a narrow banner.
