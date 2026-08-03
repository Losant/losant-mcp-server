# Image Block (`blockType: "image"`)

Renders an image from a static URL, an application file URL, or a device attribute (blob or string). No interactivity beyond an optional click-through link.

## Block object shape

```json
{
  "id": "img-1",
  "blockType": "image",
  "title": "",
  "startX": 0,
  "startY": 0,
  "width": 2,
  "height": 1,
  "config": {
    "imageSource": "static",
    "imageUrl": "https://example.com/logo.png"
  }
}
```

## Config

| Field | Type | Default | Notes |
|---|---|---|---|
| `imageSource` | `"static"` \| `"attribute"` | `"static"` | `"static"` = fixed URL; `"attribute"` = URL or blob from a device attribute. |
| `imageUrl` | string | — | Required when `imageSource` is `"static"`. The image URL. Supports Losant templates. |
| `deviceId` | string | — | Required when `imageSource` is `"attribute"`. ID of the device whose attribute holds the image. |
| `attribute` | string | — | Required when `imageSource` is `"attribute"`. Attribute name (`blob` or `string` URL). |
| `imageLinkUrl` | string | — | Optional. Clicking the image navigates to this URL. Max 2048 chars. |
| `imageLinkNewWindow` | boolean | `false` | When `true`, opens `imageLinkUrl` in a new tab. |
| `bgColor` | string | — | CSS color painted behind the image. Useful for transparent PNGs. |

## Worked example — static logo with click-through link

```json
{
  "id": "logo",
  "blockType": "image",
  "title": "",
  "startX": 0,
  "startY": 0,
  "width": 1,
  "height": 0.5,
  "config": {
    "imageSource": "static",
    "imageUrl": "https://example.com/logo.png",
    "bgColor": "#ffffff",
    "imageLinkUrl": "https://example.com",
    "imageLinkNewWindow": true
  }
}
```

## Idiom notes

- Size to the image's natural aspect ratio — the block scales the image to fit while preserving aspect ratio.
- For `imageSource: "attribute"`, the attribute must be `dataType: "blob"` (raw image bytes) or `dataType: "string"` (URL). Blob attributes are the most common use case for device-captured images.
- `imageUrl` supports templates (`{{ctx.imageUrl}}`), making it possible to drive the image source from a context variable.
- Set `bgColor` when the image has a transparent background — without it, the dashboard theme color bleeds through.
