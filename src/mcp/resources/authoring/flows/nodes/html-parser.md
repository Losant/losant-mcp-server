# HTML/XML Parser Node (`type: "HtmlParserNode"`)

The HTML/XML Parser Node parses an HTML or XML document string and optionally applies a CSS selector, returning the result as text, XML, or JSON.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"HtmlParserNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"html-parser"` |
| `meta.label` | `"HTML/XML Parser"` (default) |

## Cloud (Application) flows

```json
{
  "id": "parse-html",
  "type": "HtmlParserNode",
  "config": {
    "documentPath": "working.htmlContent",
    "selectorTemplate": "table.data-table tr",
    "resultFormatTemplate": "json",
    "resultPath": "working.parsedRows"
  },
  "meta": { "category": "logic", "name": "html-parser", "label": "HTML/XML Parser", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `documentPath` | `""` | **Required.** Payload path containing the HTML or XML string to parse. |
| `selectorTemplate` | `""` | Optional CSS selector to apply after parsing. When empty, the entire document is returned. Template. |
| `resultFormatTemplate` | `"text"` | **Required.** Output format: `"text"` (visible text concatenated), `"xml"` (XML string), or `"json"` (structured JSON via xml-js). Template. |
| `resultPath` | `""` | **Required.** Payload path to write the parsed result. **Always an array** — one element per matched element. Even without a selector the result is a one-element array containing the whole document. |

## Experience flows

Same as Cloud.

## Edge flows

Same as Cloud.
