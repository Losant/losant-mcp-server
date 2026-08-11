# File Tail Trigger (`type: "fileTail"`)

The File Tail Trigger allows you to monitor and analyze logs and other files on the Gateway Edge Agent's container or host file system. It monitors new data being written to a file and fires a workflow whenever a configured delimiter or byte length has been reached.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"fileTail"` |
| `meta.category` | `"trigger"` |
| `meta.name` | `"fileTail"` |
| `meta.label` | `"File Tail"` (default) |

## Cloud (Application) workflows

Not available.

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.12.0

- `key` is server-generated — omit it.

Two parse modes are available. The UI always sends `config.path` and `config.encoding` regardless of mode.

### Delimiter mode (default)

Fires whenever the configured delimiter character or string is received. The delimiter is not included in the payload content.

```json
{
  "type": "fileTail",
  "config": {
    "path": "/data/logs/app.log",
    "encoding": "utf8",
    "delimiter": "\n"
  },
  "meta": {
    "category": "trigger",
    "name": "fileTail",
    "label": "File Tail",
    "x": 60,
    "y": 60
  },
  "outputIds": [["process-line"]]
}
```

Common delimiter values:

| Value | Description |
|---|---|
| `"\n"` | Unix/macOS line feed (default when omitted) |
| `"\r\n"` | Windows carriage return + line feed |
| `"\r"` | Legacy macOS carriage return |
| `"\t"` | Tab |
| `"\0"` | Null character |

Max delimiter length: 16 characters. Omit `delimiter` from config to use the default `\n`.

**Memory note:** Data received between delimiters is buffered in memory with no upper limit. For optimal performance, keep buffered data under 5 MB between delimiters.

---

### Byte length mode

Fires whenever the configured number of bytes has been accumulated. Used primarily for binary files.

```json
{
  "type": "fileTail",
  "config": {
    "path": "/data/sensor.bin",
    "encoding": "base64",
    "byteLength": "16"
  },
  "meta": {
    "category": "trigger",
    "name": "fileTail",
    "label": "File Tail",
    "x": 60,
    "y": 60
  },
  "outputIds": [["parse-binary"]]
}
```

For binary data, use `"encoding": "base64"`. Access the underlying bytes in a Function node:

```javascript
const buffer = Buffer.from(payload.data.content, 'base64');
payload.working.firstByte = buffer[0];
payload.working.nextInt = buffer.readInt32LE(1);
```

---

### Config fields

| Field | Default | Notes |
|---|---|---|
| `config.path` | `""` | **Required.** Full path to the file on the container file system. |
| `config.encoding` | `"utf8"` | **Required.** Output encoding: `"utf8"`, `"base64"`, or `"binary"`. |
| `config.delimiter` | `""` (= `\n`) | Used in delimiter mode. Omit to use newline default. |
| `config.byteLength` | — | Used in byte length mode. Number of bytes to accumulate before firing. **Must be a string** (e.g. `"16"`), not a number. |

Send either `delimiter` or `byteLength` — not both.

### Payload at runtime

```json
{
  "time": "<ISO timestamp>",
  "data": {
    "content": "<new file content as encoded string>",
    "path": "/data/logs/app.log"
  },
  "triggerId": "/data/logs/app.log",
  "triggerType": "fileTail",
  "applicationId": "...",
  "flowId": "...",
  "globals": {}
}
```

- `data.content` — the new file content encoded per `config.encoding`.
- `data.path` — the file path being tailed.
- `triggerId` — the configured file path. Use this to distinguish which File Tail trigger fired when multiple are present in the same workflow.

### File system access

The GEA runs inside a Docker container. `config.path` must be a path on the **container** file system. To tail a file on the host, mount it into the container with a Docker volume:

```bash
docker run -v /var/log/app.log:/data/logs/app.log ...
```

Host files often require permission changes before the GEA can read them:

```bash
sudo chmod a+rwx /var/log/app.log
```

Verify access by running `tail` inside the container:

```bash
docker exec -it <container_id> bash
tail /data/logs/app.log
```
