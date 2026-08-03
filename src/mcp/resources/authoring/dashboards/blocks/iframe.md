# External Website Block (`blockType: "iframe"`)

Embeds an external web page in an `<iframe>`. The URL must be HTTPS and the remote site must permit embedding (no `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'`).

## Block object shape

```json
{
  "id": "iframe-1",
  "blockType": "iframe",
  "title": "Weather",
  "startX": 0,
  "startY": 0,
  "width": 2,
  "height": 1.5,
  "config": {
    "url": "https://www.example.com/embed/widget"
  }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `url` | string | — | **Required.** HTTPS URL to embed. Max 2048 chars. Supports Losant templates (`{{ctx.x}}`). |

## Worked example — embeddable weather widget

```json
{
  "id": "weather-iframe",
  "blockType": "iframe",
  "title": "Local Weather",
  "startX": 2,
  "startY": 0,
  "width": 2,
  "height": 2,
  "config": {
    "url": "https://forecast.example.com/embed?station=42"
  }
}
```

## Idiom notes

- Size to whatever real-estate the embedded page's content needs — there is no minimum beyond the `0.5 × 0.5` grid unit floor.
- Many popular sites block iframe embedding. Test before committing to the layout.
- `url` is templatable: use `{{ctx.stationId}}` to let the context variable drive which station is shown.
