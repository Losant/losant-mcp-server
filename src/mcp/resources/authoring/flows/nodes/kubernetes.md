# Kubernetes Node (`type: "KubernetesNode"`)

The Kubernetes Node allows the Gateway Edge Agent to interact with a Kubernetes cluster, whether the agent's container is orchestrated by the cluster or running alongside it on the edge network. It is only available in Edge Workflows. The node supports curated operations across Pods, Deployments, Services, ConfigMaps, Namespaces, and Nodes, Server-Side Apply (SSA) for deploying YAML/JSON manifests, and an escape-hatch Custom operation for arbitrary REST endpoints and Custom Resource Definitions (CRDs).

## Required Fields

| Field | Value |
|---|---|
| `type` | `"KubernetesNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"kubernetes"` |
| `meta.label` | `"Kubernetes"` (default) |

## Cloud (Application) flows

Not available.

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 2.7.0

The node is divided into four configuration areas: Authentication, Operation & Target, Server-Side Apply, and Result & Disk Storage.

---

### Authentication

The node supports two authentication modes configured via `authMode`:

- **`inCluster` (default)**: Used when the Gateway Edge Agent is running inside a pod within the Kubernetes cluster. Automatically discovers the control plane URL via the environment variables `KUBERNETES_SERVICE_HOST` and `KUBERNETES_SERVICE_PORT_HTTPS` (or `KUBERNETES_SERVICE_PORT`), defaulting to `https://kubernetes.default.svc`. Automatically mounts and uses the service account bearer token from `/var/run/secrets/kubernetes.io/serviceaccount/token` and the cluster CA certificate from `/var/run/secrets/kubernetes.io/serviceaccount/ca.crt`.
- **`inline`**: Used when the GEA is running outside the cluster or targeting an external cluster. Requires `kubernetesUrlTemplate` and bearer token configuration, with optional custom CA certificate or SSL verification disabling.

> **RBAC ServiceAccount permissions in cluster:** When using `authMode: "inCluster"`, the GEA pod's Kubernetes `ServiceAccount` must have appropriate RBAC permissions (configured via a `Role` or `ClusterRole` and corresponding `RoleBinding` / `ClusterRoleBinding`) for the resources and verbs the flow executes. If the ServiceAccount lacks permissions, the Kubernetes API will return a `403 Forbidden` response status code.

#### Example: List Pods with Label Selector (In-Cluster)

```json
{
  "id": "list-pods-node",
  "type": "KubernetesNode",
  "config": {
    "authMode": "inCluster",
    "operationTemplate": "listPods",
    "namespaceTemplate": "default",
    "labelSelectorTemplate": "app=web,tier!=backend",
    "limitTemplate": "50",
    "timeoutTemplate": "30000",
    "resultPath": "working.pods"
  },
  "meta": { "category": "data", "name": "kubernetes", "label": "List Pods", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

#### Example: Inline Authentication

```json
{
  "id": "inline-auth-node",
  "type": "KubernetesNode",
  "config": {
    "authMode": "inline",
    "kubernetesUrlTemplate": "https://k8s.example.com:6443",
    "tokenSource": "stringTemplate",
    "tokenTemplate": "{{globals.k8sToken}}",
    "caCertSource": "stringTemplate",
    "caCertTemplate": "{{globals.k8sCaCert}}",
    "disableSSLVerification": false,
    "operationTemplate": "listDeployments",
    "namespaceTemplate": "production",
    "timeoutTemplate": "15000",
    "resultPath": "working.deployments"
  },
  "meta": { "category": "data", "name": "kubernetes", "label": "List Deployments", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

#### Authentication Fields

| Config field | Default | Notes |
|---|---|---|
| `authMode` | `"inCluster"` | `"inCluster"` — read credentials from cluster pod environment. `"inline"` — supply control plane URL, token, and CA certificate manually. |
| `kubernetesUrlTemplate` | `""` | **Required when `authMode: "inline"`.** Control plane base URL (e.g. `https://k8s.example.com:6443`). Template. |
| `tokenSource` | `"stringTemplate"` | When `authMode: "inline"`. `"stringTemplate"` — direct template. `"diskPath"` — path to token file on GEA container. |
| `tokenTemplate` | `""` | **Required when `tokenSource: "stringTemplate"`.** Bearer token template. |
| `tokenDiskPathTemplate` | `""` | **Required when `tokenSource: "diskPath"`.** Local file path containing the bearer token. Template. |
| `caCertSource` | `"none"` | When `authMode: "inline"`. `"none"` — standard trust store. `"stringTemplate"` — PEM certificate string. `"diskPath"` — path to CA cert file. |
| `caCertTemplate` | `""` | **Required when `caCertSource: "stringTemplate"`.** PEM CA certificate string. Ignored when `disableSSLVerification` is `true`. Template. |
| `caCertDiskPathTemplate` | `""` | **Required when `caCertSource: "diskPath"`.** Path to PEM CA certificate file. Ignored when `disableSSLVerification` is `true`. Template. |
| `disableSSLVerification` | `false` | When `true`, disables TLS certificate verification (applies to both `inline` and `inCluster` modes). |
| `timeoutTemplate` | `""` | Optional. Timeout in **milliseconds** (e.g. `"30000"` for 30 seconds). Maximum allowed value is `30000` (30 seconds); values above 30000 throw a validation error. If omitted, defaults to the external call timeout. Passed as `?timeoutSeconds=Math.floor(timeoutMs / 1000)` to the Kubernetes API where supported. **UI Note:** While the Losant Workflow UI may label this field in seconds (`"Timeout Template (Seconds)"`), the underlying GEA runtime strictly evaluates `timeoutTemplate` in milliseconds. When authoring workflow JSON directly or via MCP tools, always supply milliseconds (e.g. `"30000"`). Values `<= 30` will time out after 30 milliseconds. Integer template. |
| `operationTemplate` | `"applyManifest"` | **Required.** Operation to execute. Defaults to `"applyManifest"` in the Workflow Editor UI (SP-15597+), or `"listPods"` in older versions. See Supported Operations table below. Template. |

---

### Operation & Target

#### Supported Operations

| Operation (`operationTemplate`) | Category | Target Resource | HTTP Method & Path |
|---|---|---|---|
| `listPods` | Pods | Pod list | `GET /api/v1[/namespaces/{ns}]/pods` |
| `getPod` | Pods | Single pod | `GET /api/v1/namespaces/{ns}/pods/{name}` |
| `createPod` | Pods | New pod | `POST /api/v1/namespaces/{ns}/pods` |
| `deletePod` | Pods | Single pod | `DELETE /api/v1/namespaces/{ns}/pods/{name}` |
| `getPodLogs` | Pods | Log stream | `GET /api/v1/namespaces/{ns}/pods/{name}/log` |
| `listDeployments` | Deployments | Deployment list | `GET /apis/apps/v1[/namespaces/{ns}]/deployments` |
| `getDeployment` | Deployments | Single deployment | `GET /apis/apps/v1/namespaces/{ns}/deployments/{name}` |
| `createDeployment` | Deployments | New deployment | `POST /apis/apps/v1/namespaces/{ns}/deployments` |
| `updateDeployment` | Deployments | Replace deployment | `PUT /apis/apps/v1/namespaces/{ns}/deployments/{name}` |
| `patchDeployment` | Deployments | Strategic merge patch | `PATCH /apis/apps/v1/namespaces/{ns}/deployments/{name}` |
| `deleteDeployment` | Deployments | Single deployment | `DELETE /apis/apps/v1/namespaces/{ns}/deployments/{name}` |
| `listServices` | Services | Service list | `GET /api/v1[/namespaces/{ns}]/services` |
| `getService` | Services | Single service | `GET /api/v1/namespaces/{ns}/services/{name}` |
| `createService` | Services | New service | `POST /api/v1/namespaces/{ns}/services` |
| `updateService` | Services | Replace service | `PUT /api/v1/namespaces/{ns}/services/{name}` |
| `patchService` | Services | Strategic merge patch | `PATCH /api/v1/namespaces/{ns}/services/{name}` |
| `deleteService` | Services | Single service | `DELETE /api/v1/namespaces/{ns}/services/{name}` |
| `listConfigMaps` | Config Maps | ConfigMap list | `GET /api/v1[/namespaces/{ns}]/configmaps` |
| `getConfigMap` | Config Maps | Single ConfigMap | `GET /api/v1/namespaces/{ns}/configmaps/{name}` |
| `createConfigMap` | Config Maps | New ConfigMap | `POST /api/v1/namespaces/{ns}/configmaps` |
| `updateConfigMap` | Config Maps | Replace ConfigMap | `PUT /api/v1/namespaces/{ns}/configmaps/{name}` |
| `patchConfigMap` | Config Maps | Strategic merge patch | `PATCH /api/v1/namespaces/{ns}/configmaps/{name}` |
| `deleteConfigMap` | Config Maps | Single ConfigMap | `DELETE /api/v1/namespaces/{ns}/configmaps/{name}` |
| `listNamespaces` | Namespaces | Namespace list | `GET /api/v1/namespaces` |
| `getNamespace` | Namespaces | Single namespace | `GET /api/v1/namespaces/{name}` |
| `listNodes` | Nodes | Cluster nodes list | `GET /api/v1/nodes` |
| `getNode` | Nodes | Single cluster node | `GET /api/v1/nodes/{name}` |
| `applyManifest` (alias `apply`) | Apply | Server-Side Apply | `PATCH` per resource via SSA with `Content-Type: application/apply-patch+yaml` |
| `custom` | Custom | Custom path & method | User-specified method, path, and body |

#### Resource Target & Body Fields

| Config field | Default | Notes |
|---|---|---|
| `namespaceTemplate` | `""` | Target Kubernetes namespace: <br>• **Single-resource namespaced operations** (`getPod`, `createPod`, `updateDeployment`, etc.): **Required**.<br>• **Server-Side Apply (`applyManifest`)**: Fallback namespace for manifest objects that omit `metadata.namespace`. Defaults to `"default"` if blank.<br>• **List operations (`list*`)**: Omit or leave empty to query cluster-wide across all namespaces.<br>Must match standard DNS label format (`^[a-z0-9]([-a-z0-9]{0,61}[a-z0-9])?$`). Template. |
| `nameTemplate` | `""` | **Required** for single-resource operations (`get*`, `delete*`, `update*`, `patch*`, `getNode`, `getNamespace`, `getPodLogs`). Name of the target resource. Cannot contain `/`, `%`, `.`, or `..`. Template. |
| `bodyTemplate` | `""` | **Required** for `create*`, `update*`, and `patch*` operations. JSON body template rendered against the flow payload and parsed via LJSON. For `patch*` operations, sent with `Content-Type: application/strategic-merge-patch+json`. Template. |

#### List Query Fields (`list*` operations)

| Config field | Default | Notes |
|---|---|---|
| `labelSelectorTemplate` | `""` | Comma-separated label selector query (e.g. `environment=production,tier!=frontend`). Template. |
| `fieldSelectorTemplate` | `""` | Comma-separated field selector query (e.g. `status.phase=Running`). Template. |
| `limitTemplate` | `""` | Maximum number of records to return from the API. Integer template. |
| `continueTemplate` | `""` | Pagination continuation token. In list responses, the token is returned at `body.metadata.continue`. Pass this value into `continueTemplate` in a Loop node flow to retrieve subsequent pages. See `losant://flow/nodes/loop` for loop patterns. Template. |
| `resourceVersionTemplate` | `""` | Target Kubernetes resource version. Template. Supported on list operations and single-resource get/delete operations. |
| `resourceVersionMatch` | `""` | Resource version match strategy for list operations: `""`, `"Exact"`, or `"NotOlderThan"`. Ignored by the Kubernetes API unless `resourceVersionTemplate` is also set. |

#### Pod Log Fields (`operationTemplate: "getPodLogs"`)

| Config field | Default | Notes |
|---|---|---|
| `containerTemplate` | `""` | Container name within the pod. Optional if the pod only has a single container. Template. |
| `tailLinesTemplate` | `""` | Number of most recent log lines to retrieve. Positive integer template. |

#### Custom Operation Fields (`operationTemplate: "custom"`)

The `custom` operation serves as an escape hatch for arbitrary Kubernetes REST endpoints, metrics APIs, and Custom Resource Definitions (CRDs).

| Config field | Default | Notes |
|---|---|---|
| `customMethodTemplate` | `"GET"` | HTTP method: `"GET"`, `"POST"`, `"PUT"`, `"PATCH"`, or `"DELETE"`. Defaults to `"GET"`. Template. |
| `customPathTemplate` | `""` | **Required.** Kubernetes API URL path (e.g. `/apis/cert-manager.io/v1/namespaces/default/certificates`). Must be an API path relative to the server root, not a full URL. Query parameters can be included directly in the path (e.g. `?limit=5`). Template. |
| `customBodyTemplate` | `""` | JSON body template for `"POST"`, `"PUT"`, and `"PATCH"` custom requests. Parsed via LJSON and sent with `Content-Type: application/json`. Ignored for `"GET"` and `"DELETE"`. Template. |

#### Example: Custom Operation (CRD Query)

```json
{
  "id": "custom-crd-node",
  "type": "KubernetesNode",
  "config": {
    "authMode": "inCluster",
    "operationTemplate": "custom",
    "customMethodTemplate": "GET",
    "customPathTemplate": "/apis/cert-manager.io/v1/namespaces/default/certificates",
    "resultPath": "working.certificates"
  },
  "meta": { "category": "data", "name": "kubernetes", "label": "Get Certificates CRD", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

---

### Server-Side Apply (`operationTemplate: "applyManifest"`)

The node uses Kubernetes Server-Side Apply (SSA) with `Content-Type: application/apply-patch+yaml` to declare and reconcile desired states for single- or multi-document YAML/JSON manifests. Manifests can contain multiple Kubernetes resource definitions separated by standard YAML document markers (`---`).

#### Supported Manifest Resource Types

`Pod`, `Deployment`, `Service`, `ConfigMap`, `Namespace`, `Node`, `StatefulSet`, `DaemonSet`, `ReplicaSet`, `Secret`, `ServiceAccount`, `Job`, `CronJob`, `Ingress`, `PersistentVolumeClaim`, `Role`, `RoleBinding`, `ClusterRole`, `ClusterRoleBinding`.

> [!NOTE]
> Server-Side Apply in the Gateway Edge Agent resolves resource endpoints using an internal mapping of standard Kubernetes types rather than performing dynamic API discovery (`/apis`) against the cluster. Consequently, manifest documents containing Custom Resource Definitions (CRDs) or unrecognized `kind` values will throw a validation error. To create, update, or query custom resources, use the `custom` operation with the resource's explicit API endpoint (for example, `PATCH /apis/<group>/<version>/namespaces/<ns>/<plural>/<name>`).

#### Example: Server-Side Apply Manifest (Inline Auth)

```json
{
  "id": "apply-k8s-manifest",
  "type": "KubernetesNode",
  "config": {
    "authMode": "inline",
    "kubernetesUrlTemplate": "https://k8s.local:6443",
    "tokenSource": "stringTemplate",
    "tokenTemplate": "{{globals.k8sToken}}",
    "disableSSLVerification": true,
    "operationTemplate": "applyManifest",
    "namespaceTemplate": "production",
    "manifestSource": "stringTemplate",
    "manifestTemplate": "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: app-config\ndata:\n  VERSION: \"{{working.version}}\"",
    "fieldManagerTemplate": "gea",
    "forceConflicts": false,
    "timeoutTemplate": "30000",
    "resultPath": "working.applyResult"
  },
  "meta": { "category": "data", "name": "kubernetes", "label": "Apply Manifest", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

#### Server-Side Apply Fields

| Config field | Default | Notes |
|---|---|---|
| `manifestSource` | `"stringTemplate"` | Source for the manifest: `"stringTemplate"`, `"payloadPath"`, or `"diskPath"`. |
| `manifestTemplate` | `""` | **Required when `manifestSource: "stringTemplate"`.** Multi-document YAML or JSON manifest string (documents separated by `---`). Evaluated as a Handlebars template before parsing. Template. |
| `manifestPayloadPath` | `""` | **Required when `manifestSource: "payloadPath"`.** Payload path pointing to a manifest string, a single resource JavaScript object, or an array of resource objects (`[podObj, svcObj]`). |
| `manifestDiskPathTemplate` | `""` | **Required when `manifestSource: "diskPath"`.** Local file path on the GEA container to a YAML or JSON manifest file (max 1 MB). Template. |
| `fieldManagerTemplate` | `"gea"` | Name of the field manager claiming ownership during Server-Side Apply. Defaults to `"gea"`. Template. |
| `forceConflicts` | `false` | When `true`, forces ownership conflicts and overrides existing field managers (`?force=true`). |

---

### Result & Disk Storage

By default, operation results are written directly to `resultPath` on the payload. For operations that return large responses (such as `getPodLogs` or cluster-wide `listPods`), the response body can be streamed directly to a file on the Gateway Edge Agent container or mounted host storage, bypassing the standard 5 MB flow payload size cap.

> **Pod Logs and Payload Caps:** Kubernetes pod logs can easily exceed the Losant 5 MB payload limit. Whenever retrieving high volumes of log lines via `getPodLogs`, configure `resultDiskPathTemplate` to stream logs directly to local disk.

#### Example: Get Pod Logs Streamed to Local Disk

```json
{
  "id": "get-pod-logs-node",
  "type": "KubernetesNode",
  "config": {
    "authMode": "inCluster",
    "operationTemplate": "getPodLogs",
    "namespaceTemplate": "default",
    "nameTemplate": "api-gateway-pod-xyz",
    "containerTemplate": "api-gateway",
    "tailLinesTemplate": "1000",
    "resultPath": "working.logResult",
    "resultDiskPathTemplate": "/data/logs/api-gateway.log"
  },
  "meta": { "category": "data", "name": "kubernetes", "label": "Get Pod Logs", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

#### Result & Disk Storage Fields

| Config field | Default | Notes |
|---|---|---|
| `resultPath` | `""` | Payload path where operation results are written. Optional; if omitted, no result is stored on the payload. |
| `resultDiskPathTemplate` | `""` | Optional. Local file path on the GEA container where the response body is written (overwrites any existing file). If set and the request returns a 2xx status code with a body, the body is saved to disk and `body` in `resultPath` is replaced with the resolved file path string. Non-2xx responses are not written to disk; their error body is retained in memory on `resultPath`. Template. |

---

## Output

### Standard API Responses

When `resultPath` is configured, responses from the Kubernetes API write an object containing `statusCode` and `body` to the specified payload path. For example, when `resultPath` is `"working.k8sResult"`:

```json
{
  "working": {
    "k8sResult": {
      "statusCode": 200,
      "body": {
        "kind": "PodList",
        "apiVersion": "v1",
        "metadata": {
          "resourceVersion": "104928"
        },
        "items": [
          {
            "metadata": { "name": "web-pod-1", "namespace": "default" },
            "status": { "phase": "Running" }
          }
        ]
      }
    }
  }
}
```

- **Pod Logs**: For `getPodLogs`, `body` is the raw plain-text string of the requested log lines.
- **Disk Path Streaming**: When `resultDiskPathTemplate` is specified and the request succeeds with 2xx, the response body is written to disk and `body` becomes the resolved file path string:
```json
{
  "working": {
    "k8sResult": {
      "statusCode": 200,
      "body": "/data/logs/api-gateway.log"
    }
  }
}
```
- **Non-2xx HTTP Status Codes**: Errors returned by the Kubernetes API (such as `404 Not Found`, `403 Forbidden`, `409 Conflict`, or `422 Unprocessable Entity`) are **not** treated as flow errors. They are written to `resultPath` with their corresponding `statusCode` and the Kubernetes `Status` JSON response object in `body`:
```json
{
  "working": {
    "k8sResult": {
      "statusCode": 404,
      "body": {
        "kind": "Status",
        "apiVersion": "v1",
        "metadata": {},
        "status": "Failure",
        "message": "pods \"nonexistent-pod\" not found",
        "reason": "NotFound",
        "code": 404
      }
    }
  }
}
```
Use a Conditional node (`losant://flow/nodes/conditional`) downstream to branch on `working.k8sResult.statusCode`.

### Server-Side Apply Responses

- For a **single-document manifest**, `body` is a single result object: `{ kind, name, [namespace], statusCode, body }`:
```json
{
  "working": {
    "k8sResult": {
      "statusCode": 201,
      "body": {
        "kind": "ConfigMap",
        "name": "app-config",
        "namespace": "production",
        "statusCode": 201,
        "body": { "apiVersion": "v1", "kind": "ConfigMap", "metadata": { "name": "app-config" } }
      }
    }
  }
}
```
- For a **multi-document manifest**, `body` is an array of result objects in the order they were declared:
```json
{
  "working": {
    "k8sResult": {
      "statusCode": 200,
      "body": [
        {
          "kind": "ConfigMap",
          "name": "app-config",
          "namespace": "production",
          "statusCode": 200,
          "body": {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": { "name": "app-config" }
          }
        },
        {
          "kind": "Deployment",
          "name": "web-deploy",
          "namespace": "production",
          "statusCode": 201,
          "body": {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": { "name": "web-deploy" }
          }
        }
      ]
    }
  }
}
```
If any document fails with a non-2xx status code, the remaining documents continue to be applied. The outer `statusCode` reflects the status code of the first failing document.

### Runtime Errors

When a transport failure, network error, timeout, in-cluster token failure, or disk write error occurs, an error object is written to `resultPath`:

```json
{
  "working": {
    "k8sResult": {
      "error": {
        "type": "TIMEOUT",
        "message": "timeout of 30000ms exceeded"
      }
    }
  }
}
```

Common error `type` values:
- `TIMEOUT` — the request exceeded `timeoutTemplate` or the external call timeout.
- `KubernetesAuthError` — in-cluster service account token could not be loaded from `/var/run/secrets/kubernetes.io/serviceaccount/token` (e.g. running outside of a Kubernetes pod).
- `ECONNREFUSED` — connection refused by the Kubernetes API server host or port.
- `ENOTFOUND` / `EAI_AGAIN` — DNS resolution failure for the control plane hostname.
- Disk I/O errors (e.g. `EACCES`, `ENOSPC`) if the agent cannot write to `resultDiskPathTemplate`.

#### Partial Multi-Document SSA Transport Failure
If a multi-document SSA operation encounters a transport or network failure after applying earlier documents, execution stops and returns partial results on `resultPath` without a `statusCode` property:
```json
{
  "working": {
    "k8sResult": {
      "error": {
        "type": "TIMEOUT",
        "message": "timeout of 30000ms exceeded"
      },
      "body": [
        {
          "kind": "ConfigMap",
          "name": "app-config",
          "namespace": "default",
          "statusCode": 200,
          "body": {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": { "name": "app-config" }
          }
        },
        {
          "kind": "Deployment",
          "name": "web-deploy",
          "namespace": "default",
          "error": {
            "type": "TIMEOUT",
            "message": "timeout of 30000ms exceeded"
          }
        }
      ]
    }
  }
}
```

### Configuration Errors

Configuration and validation errors throw workflow execution errors and halt the flow without writing to `resultPath`:
- `MissingField` — missing required fields (e.g. `operationTemplate`, `nameTemplate` for single-resource operations, `kubernetesUrlTemplate` for inline auth, `manifestTemplate` for string template manifests, `customPathTemplate` for custom operations).
- `Validation` — invalid resource name (contains `/`, `%`, `.`, or `..`), invalid namespace format, invalid `apiVersion`, invalid YAML syntax, manifest resource missing `kind` or `metadata.name`, unsupported manifest kind, `timeoutTemplate` exceeding 30,000 milliseconds (30 seconds), or empty disk path.
- `InvalidJsonTemplate` — malformed JSON in `bodyTemplate` or `customBodyTemplate`.

---

## Custom Node flows

Available as part of edge custom node flows. Same configuration as Edge.
