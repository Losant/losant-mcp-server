# Serial Trigger (`type: "serial"`)

The Serial Trigger fires a flow whenever the Edge Compute Device receives enough data via a Serial connection to satisfy the configured parse method.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"serial"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"serial"` |
| `meta.label` | `"Serial"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.6.0

- `key` is server-generated — omit it.

Two parse modes are available. **`meta.parseBy`** is always sent and tells the UI which mode was configured.

### Delimiter mode (default) — GEA 1.6.0+

Fires when the configured delimiter character is received. The delimiter is not included in the payload.

```json
{
  "type": "serial",
  "config": {
    "path": "/dev/ttyUSB0",
    "baudRate": 9600,
    "encoding": "utf8",
    "delimiter": "\n",
    "delimiterEncoding": "utf8",
    "parity": "none",
    "dataBits": 8,
    "stopBits": 1,
    "rtscts": false,
    "writeOnOpen": "",
    "writeOnOpenEncoding": "utf8"
  },
  "meta": {
    "category": "trigger",
    "name": "serial",
    "label": "Serial",
    "parseBy": "delimiter",
    "x": 60,
    "y": 60
  },
  "outputIds": [["handle-data"]]
}
```

### Byte length mode — GEA 1.6.0+

Fires when the configured number of bytes has been received.

```json
{
  "type": "serial",
  "config": {
    "path": "/dev/ttyUSB0",
    "baudRate": 9600,
    "encoding": "base64",
    "byteLength": "16",
    "parity": "none",
    "dataBits": 8,
    "stopBits": 1,
    "rtscts": false,
    "writeOnOpen": "",
    "writeOnOpenEncoding": "utf8"
  },
  "meta": {
    "category": "trigger",
    "name": "serial",
    "label": "Serial",
    "parseBy": "byteLength",
    "x": 60,
    "y": 60
  },
  "outputIds": [["parse-binary"]]
}
```

### Config fields

| Field | Default | GEA | Notes |
|---|---|---|---|
| `config.path` | `""` | 1.6.0 | **Required.** Serial port path (e.g. `/dev/ttyUSB0`). |
| `config.baudRate` | `9600` | 1.6.0 | **Required.** Communication speed. Any positive integer (GEA 1.19.2+). Pre-1.19.2: must be one of `110`, `300`, `600`, `1200`, `2400`, `4800`, `9600`, `14400`, `19200`, `38400`, `57600`, `115200`, `128000`, `256000`. |
| `config.encoding` | `"utf8"` | 1.6.0 | **Required.** Output encoding for received data: `"utf8"`, `"ascii"`, `"utf16le"`, `"ucs2"`, `"latin1"`, `"base64"`, `"binary"`, `"hex"`. |
| `config.delimiter` | `""` | 1.6.0 | Required in delimiter mode. Character or string that triggers the flow. |
| `config.delimiterEncoding` | `"utf8"` | 1.19.2 | Encoding for the delimiter value: `"utf8"`, `"ascii"`, `"utf16le"`, `"ucs2"`, `"latin1"`, `"base64"`, `"binary"`, `"hex"`. |
| `config.byteLength` | `""` | 1.6.0 | Required in byte length mode. Number of bytes to accumulate before firing. |
| `config.parity` | `"none"` | 1.19.0 | `"none"`, `"even"`, `"odd"`, `"mark"`, `"space"`. Fixed at `"none"` for GEA < 1.19.0. |
| `config.dataBits` | `8` | 1.19.0 | Bits per character: `5`, `6`, `7`, or `8`. Fixed at `8` for GEA < 1.19.0. |
| `config.stopBits` | `1` | 1.19.0 | Stop bits: `1` or `2`. Fixed at `1` for GEA < 1.19.0. |
| `config.rtscts` | `false` | 1.19.0 | RTS/CTS handshaking. Fixed at `false` for GEA < 1.19.0. |
| `config.writeOnOpen` | `""` | 1.6.0 | Optional string written to the port once when it opens. |
| `config.writeOnOpenEncoding` | `"utf8"` | 1.19.2 | Encoding for `writeOnOpen`: `"utf8"`, `"ascii"`, `"utf16le"`, `"ucs2"`, `"latin1"`, `"base64"`, `"binary"`, `"hex"`. |
| `meta.parseBy` | `"delimiter"` | 1.6.0 | **Required.** Always send in `meta`. `"delimiter"` or `"byteLength"`. |

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "path": "/dev/ttyUSB0",
    "serial": "Hello, Serial!"
  },
  "triggerId": "<unique trigger ID>",
  "triggerType": "serial",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `triggerId` — the server-generated node key assigned when this trigger was saved.
- `data.path` — the serial port path the data was received on.
- `data.serial` — the received data, encoded per `config.encoding`. For binary data use `"base64"` encoding and parse with `Buffer.from(payload.data.serial, 'base64')` in a Function node.
