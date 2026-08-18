# Annotation Node (`type: "AnnotationNode"`)

A visual-only node that displays a text label on the flow canvas. Has no runtime behavior and does not affect payload or execution. Available in all flow classes.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"AnnotationNode"` |
| `meta.category` | `"annotation"` |
| `meta.name` | `"note"` |
| `meta.label` | `"Note"` (default) |

## Cloud (Application) flows

```json
{
  "id": "note",
  "type": "AnnotationNode",
  "config": {},
  "meta": {
    "category": "annotation",
    "name": "note",
    "label": "Note",
    "x": 60,
    "y": 60,
    "annotationText": "This section handles error recovery",
    "width": 260,
    "height": 220
  },
  "outputIds": []
}
```

`config` is always `{}`. `outputIds` must be `[]` (no outputs). All annotation content lives in `meta`:

| `meta` field | Default | Notes |
|---|---|---|
| `annotationText` | `""` | Text displayed inside the annotation box. Markdown is supported. |
| `width` | `260` | Width in pixels. Must be a multiple of 20. UI range: 100–600. |
| `height` | `220` | Height in pixels. Must be a multiple of 20. UI range: 100–600. |

## Output

The Annotation Node has no runtime outputs and does not affect the payload. `outputIds` must be `[]` (empty — zero outputs).

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.

## Custom Node flows

For edge custom node flows, same configuration as Edge. For all other custom node flows, same as Cloud.
