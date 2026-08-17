# Date/Time Node (`type: "DateTimeNode"`)

Parses, manipulates, and formats date/time values using Moment.js operations — add/subtract time, format, convert, diff, extract parts, and more.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"DateTimeNode"` |
| `meta.category` | `"logic"` |
| `meta.name` | `"date-time"` |
| `meta.label` | `"Date/Time"` (default) |

## Cloud (Application) flows

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
| `resultPath` | `""` | Optional. Payload path to write the result. When omitted, result is discarded. |
| `resultFormatString` | `""` | Moment.js format string for the output (e.g. `"YYYY-MM-DD"`). Used by the `format`, `add`, `subtract`, `getDatePart`, `setDatePart`, and `startOfTime` operations. Leave empty to use ISO 8601 output. |
| `timezone` | `""` | IANA timezone (e.g. `"America/Chicago"`). Applied to the operation. |
| `numberValue` | `""` | Amount for add/subtract/set operations. Template. |
| `unit` | `"year"` | Time unit for add/subtract/set/start-of: `"year"`, `"quarter"`, `"month"`, `"week"`, `"dayOfYear"`, `"day"`, `"dayOfWeek"`, `"hour"`, `"minute"`, `"second"`, `"millisecond"`. |
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
| `diff` | Number | Difference between source and `diffDataPath` date in **milliseconds**. `unit` is not used for this operation. |
| `daysInMonth` | Number | Number of days in the source date's month. |
| `startOfTime` | Date | Round down to the start of the specified `unit`. |
| `toArray` | Array | Convert to `[year, month, day, hour, minute, second, ms]`. |
| `toObject` | Object | Convert to `{ years, months, date, hours, minutes, seconds, milliseconds }`. |
| `unixTimestampSeconds` | Number | Convert to Unix timestamp in seconds. |
| `unixTimestampMilliseconds` | Number | Convert to Unix timestamp in milliseconds. |

## Experience flows

Same as Cloud.

## Edge flows

> **Minimum GEA version:** 1.11.0
>
> **GEA 1.13.0+:** Output Timezone, Result Format Template, and the `"dayOfYear"` / `"dayOfWeek"` unit values are only available from GEA 1.13.0 onwards.

Same as Cloud.
