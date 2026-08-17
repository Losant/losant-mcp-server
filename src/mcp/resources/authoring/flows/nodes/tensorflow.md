# TensorFlow: Predict Node (`type: "TensorFlowPredictNode"`)

The TensorFlow: Predict Node makes predictions against a pre-trained TensorFlow model loaded on the Gateway Edge Agent.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"TensorFlowPredictNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"tensorflow-predict"` |
| `meta.label` | `"TensorFlow: Predict"` (default) |

## Cloud (Application) flows

Not available.

## Output

`resultPath` receives the prediction result:

```json
{ "working": { "prediction": { "success": true, "result": [0.92, 0.05, 0.03] } } }
```

`result` is an array of prediction values. On error: `{ "error": { "type": "TENSOR_FLOW_NODE_ERROR", "message": "..." } }`

## Experience flows

Not available.

## Edge flows

> **Minimum GEA version:** 1.10.0
>
> **Architecture note:** This node does not work on the Alpine GEA variant. Only the `amd64` and `arm32` (GEA &lt;2.0.0) architectures include the TensorFlow.js native bindings required by this node.

```json
{
  "id": "tf-predict",
  "type": "TensorFlowPredictNode",
  "config": {
    "modelTypeTemplate": "layers",
    "modelTemplate": "/data/models/sensor-model/model.json",
    "dataPath": "working.inputTensor",
    "shapePath": "",
    "dataTypeTemplate": "",
    "resultPath": "working.predictions"
  },
  "meta": { "category": "data", "name": "tensorflow-predict", "label": "TensorFlow: Predict", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `modelTypeTemplate` | `"layers"` | **Required.** TensorFlow model type: `"layers"` or `"graph"`. Template. |
| `modelTemplate` | `""` | **Required.** Full path to the `model.json` file on the GEA file system (e.g. `/data/models/my-model/model.json`), not the directory. Template. |
| `dataPath` | `""` | **Required.** Payload path containing the input tensor data (array or nested arrays). |
| `shapePath` | `""` | Optional payload path to an array specifying the input tensor shape. |
| `dataTypeTemplate` | `""` | Input data type: `"float32"`, `"int32"`, `"bool"`, `"string"`. Omit `dataTypeTemplate` (or set to `''`) to use autodetect mode. Template. `"autodetect"` is a UI-only label and must not be sent — passing `"autodetect"` as the value will cause a runtime validation error. |
| `resultPath` | `""` | Payload path to write the prediction results. |

## Custom Node workflows

Not available.
