# Date/Time Node (`type: "DateTimeNode"`)

Parses, manipulates, and formats date/time values using Moment.js operations — add/subtract time, format, convert, diff, extract parts, and more.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"DateTimeNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"date-time"` |
| `meta.label` | `"Date/Time"` (default) |

## Cloud (Application) workflows

```json
{
  "id": "format-date",
  "type": "DateTimeNode",
  "config": {
    "operation": "format",
    "sourcePath": "data.time",
    "sourceFormatString": "",
    "resultPath": "working.formattedDate",
    "resultFormatString": "YYYY-MM-DD HH:mm:ss",
    "timezone": "America/New_York"
  },
  "meta": { "category": "logic", "name": "date-time", "label": "Date/Time", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

### Config

| Field | Default | Notes |
|---|---|---|
| `operation` | `"add"` | **Required.** The operation to perform (see table below). |
| `sourcePath` | `""` | Payload path of the input date value. If empty, uses the current time. |
| `sourceFormatString` | `""` | Moment.js format string for parsing the source. Leave empty for ISO 8601 / Unix timestamps. |
| `resultPath` | `""` | **Required.** Payload path to write the result. |
| `resultFormatString` | `""` | Moment.js format string for the output (e.g. `"YYYY-MM-DD"`). Used by `format` operation. |
| `timezone` | `""` | IANA timezone (e.g. `"America/Chicago"`). Applied to the operation. |
| `numberValue` | `""` | Amount for add/subtract/set operations. Template. |
| `unit` | `"year"` | Time unit for add/subtract/set/start-of: `"year"`, `"month"`, `"day"`, `"hour"`, `"minute"`, `"second"`, `"millisecond"`. |
| `diffDataPath` | `""` | Payload path of the second date for `diff` operation. |
| `diffDataFormatString` | `""` | Format string for the diff comparison date. |

### Operations

| `operation` | Result | Notes |
|---|---|---|
| `add` | Date | Add `numberValue` `unit`s to the source date. |
| `subtract` | Date | Subtract `numberValue` `unit`s from the source date. |
| `format` | String | Format the date using `resultFormatString`. |
| `getDatePart` | Number | Extract a specific `unit` component from the date. |
| `setDatePart` | Date | Set a specific `unit` component to `numberValue`. |
| `diff` | Number | Difference between source and `diffDataPath` date in `unit`s. |
| `daysInMonth` | Number | Number of days in the source date's month. |
| `startOf` | Date | Round down to the start of the specified `unit`. |
| `toArray` | Array | Convert to `[year, month, day, hour, minute, second, ms]`. |
| `toObject` | Object | Convert to `{ years, months, date, hours, minutes, seconds, milliseconds }`. |
| `unixTimestamp` | Number | Convert to Unix timestamp (seconds). |

## Experience workflows

Same as Cloud.

## Edge workflows

> **Minimum GEA version:** 1.11.0

Same as Cloud.
