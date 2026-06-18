# CSV Nodes — Decode, Encode

Two nodes for converting between CSV strings and arrays of objects.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `CSVDecodeNode` | `logic` | `csv-decode` | `"CSV: Decode"` |
| `CSVEncodeNode` | `logic` | `csv-encode` | `"CSV: Encode"` |

## Cloud (Application) workflows

### CSV: Decode Node (`type: "CSVDecodeNode"`)

Parses a CSV string into an array of row objects. The first row is treated as column headers.

```json
{
  "id": "parse-csv",
  "type": "CSVDecodeNode",
  "config": {
    "source": "working.csvString",
    "destination": "working.rows",
    "delimiterTemplate": "",
    "recordDelimiterTemplate": "\n",
    "quoteCharTemplate": "",
    "escapeCharTemplate": "",
    "stripBom": false
  },
  "meta": { "category": "logic", "name": "csv-decode", "label": "CSV: Decode", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `source` | `""` | **Required.** Payload path of the CSV string to parse. |
| `destination` | `""` | **Required.** Payload path to write the resulting array of row objects. |
| `delimiterTemplate` | `""` | Column delimiter. Default (empty) = comma. |
| `recordDelimiterTemplate` | `"\n"` | Row delimiter. Default = line feed. |
| `quoteCharTemplate` | `""` | Quote character. Default (empty) = double quote. |
| `escapeCharTemplate` | `""` | Escape character. Default (empty) = double quote. |
| `stripBom` | `false` | Strip byte-order mark from the beginning of the string. |

---

### CSV: Encode Node (`type: "CSVEncodeNode"`)

Converts an array of row objects into a CSV string.

```json
{
  "id": "encode-csv",
  "type": "CSVEncodeNode",
  "config": {
    "source": "working.rows",
    "destination": "working.csvString",
    "delimiterTemplate": "",
    "recordDelimiterTemplate": "\n",
    "quoteCharTemplate": "",
    "escapeCharTemplate": "",
    "headerTemplateType": "objectKeys"
  },
  "meta": { "category": "logic", "name": "csv-encode", "label": "CSV: Encode", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `source` | `""` | **Required.** Payload path of the array of row objects to encode. |
| `destination` | `""` | **Required.** Payload path to write the resulting CSV string. |
| `delimiterTemplate` | `""` | Column delimiter. Default (empty) = comma. |
| `recordDelimiterTemplate` | `"\n"` | Row delimiter. Default = line feed. |
| `quoteCharTemplate` | `""` | Quote character. Default (empty) = double quote. |
| `escapeCharTemplate` | `""` | Escape character. Default (empty) = double quote. |
| `headerTemplateType` | `"objectKeys"` | Where to get column headers: `"objectKeys"` (use row object keys), `"stringTemplates"` (explicit list), or `"payloadPath"` (path to array of header strings). |
| `headerTemplate` | — | Used when `headerTemplateType` is `"stringTemplates"` or `"payloadPath"`. |

## Experience workflows

Same as Cloud.

## Edge workflows

> **Minimum GEA version:** 1.6.0

Same as Cloud.
