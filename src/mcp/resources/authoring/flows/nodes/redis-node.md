# Redis Node (`type: "RedisNode"`)

The Redis Node allows a workflow to query or update values in a Redis database. Supports standalone and cluster connection modes and a wide range of Redis commands.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"RedisNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"redis"` |
| `meta.label` | `"Redis"` (default) |

## Cloud (Application) workflows

Two connection modes: standalone (single server) or cluster (multiple nodes).

**Standalone:**
```json
{
  "id": "redis-get",
  "type": "RedisNode",
  "config": {
    "host": "redis.example.com",
    "port": "6379",
    "password": "{{globals.redisPass}}",
    "username": "",
    "dbNumber": "0",
    "isCluster": false,
    "tlsOn": false,
    "command": "get",
    "arguments": ["myKey"],
    "resultPath": "working.value",
    "errorBehavior": "throw",
    "errorPath": ""
  },
  "meta": { "category": "data", "name": "redis", "label": "Redis", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

**Cluster:**
```json
{
  "id": "redis-set",
  "type": "RedisNode",
  "config": {
    "isCluster": true,
    "clusterMembers": [
      { "host": "node1.redis.example.com", "port": "6379" },
      { "host": "node2.redis.example.com", "port": "6379" }
    ],
    "password": "",
    "username": "",
    "tlsOn": false,
    "command": "set",
    "arguments": ["myKey", "myValue"],
    "resultPath": "",
    "errorBehavior": "throw",
    "errorPath": ""
  },
  "meta": { "category": "data", "name": "redis", "label": "Redis", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `isCluster` | `false` | `false` — standalone mode. `true` — cluster mode. |
| `host` | `""` | **Required** (standalone). Redis server hostname. |
| `port` | `""` | Redis port (standalone). Default Redis port is 6379. |
| `dbNumber` | `""` | Database number (standalone, non-cluster). |
| `clusterMembers` | `[]` | **Required** (cluster). Array of `{ host, port }` objects. At least one host required. Max 25 members. |
| `password` | `""` | Redis password. |
| `username` | `""` | Redis username. GEA 1.23.0+ on edge. |
| `tlsOn` | `false` | Enable TLS encryption. |
| `caCertTemplate` | `""` | Custom CA certificate for TLS. GEA 1.41.0+ on edge. Template. |
| `command` | `"get"` | **Required.** Redis command to execute (e.g. `"get"`, `"set"`, `"hget"`, `"zadd"`). |
| `arguments` | `[]` | Array of string arguments for the command. |
| `argumentsPath` | `""` | Payload path to an array of arguments. Alternative to `arguments`. GEA 1.35.0+ on edge. |
| `resultPath` | `""` | Payload path to write the command result. |
| `errorBehavior` | `"throw"` | `"throw"` — halt on error. `"payloadPath"` — write error to `errorPath`. GEA 1.35.0+ on edge. |
| `errorPath` | `""` | **Required** when `errorBehavior: "payloadPath"`. |

### Supported command groups

`keys`, `strings`, `lists`, `sets`, `sorted sets`, `hashes`, `streams`, `geo`, `hyperloglog`, `publishing`

## Output

The result shape at `resultPath` varies by command. Most commands return a scalar (string, number, `null`). `keys` and `smembers` return arrays. `hgetall` returns an object. On error, `errorPath` receives `{ type, message }`.

## Experience workflows

Same as Cloud.

## Edge workflows

Same as Cloud with the following version gates:
- `tlsOn` (TLS support) requires GEA **1.9.0+**.
- `isCluster` / cluster mode requires GEA **1.38.0+**. Feature availability by GEA version:

| Feature | Min GEA |
|---|---|
| Basic Redis commands | 1.0.0 |
| `username` authentication | 1.23.0 |
| `argumentsPath` (payload path for args) | 1.35.0 |
| `errorBehavior` / `errorPath` | 1.35.0 |
| `caCertTemplate` (custom CA cert for TLS) | 1.41.0 |
