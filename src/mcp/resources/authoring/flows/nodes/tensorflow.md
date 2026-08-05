# TensorFlow: Predict Node (`type: "TensorFlowPredictNode"`)

The TensorFlow: Predict Node makes predictions against a pre-trained TensorFlow model loaded on the Gateway Edge Agent.

## Required Fields

| Field | Value |
|---|---|
| `type` | `"TensorFlowPredictNode"` |
| `meta.category` | `"data"` |
| `meta.name` | `"tensorflow-predict"` |
| `meta.label` | `"TensorFlow: Predict"` (default) |

## Cloud (Application) workflows

Not available.

## Output

`resultPath` receives the prediction result:

```json
{ "working": { "prediction": { "success": true, "result": [0.92, 0.05, 0.03] } } }
```

`result` is an array of prediction values. On error: `{ "success": false, "error": { "type": "TENSOR_FLOW_NODE_ERROR", "message": "..." } }`

## Experience workflows

Not available.

## Edge workflows

> **Minimum GEA version:** 1.10.0
>
> **Architecture note:** This node does not work on the Alpine GEA variant. Only the `amd64` and `arm32` (GEA &lt;2.0.0) architectures include the TensorFlow.js native bindings required by this node.

```json
{
  "id": "tf-predict",
  "type": "TensorFlowPredictNode",
  "config": {
    "modelTypeTemplate": "layers",
    "modelTemplate": "/data/models/sensor-model",
    "dataPath": "working.inputTensor",
    "shapePath": "",
    "dataTypeTemplate": "autodetect",
    "resultPath": "working.predictions"
  },
  "meta": { "category": "data", "name": "tensorflow-predict", "label": "TensorFlow: Predict", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `modelTypeTemplate` | `"layers"` | **Required.** TensorFlow model type: `"layers"` or `"graph"`. Template. |
| `modelTemplate` | `""` | **Required.** Path to the model directory on the GEA file system. Template. |
| `dataPath` | `""` | **Required.** Payload path containing the input tensor data (array or nested arrays). |
| `shapePath` | `""` | Optional payload path to an array specifying the input tensor shape. |
| `dataTypeTemplate` | `"autodetect"` | Input data type: `"autodetect"`, `"float32"`, `"int32"`, `"bool"`, `"string"`. When `"autodetect"`, omitted from config. Template. |
| `resultPath` | `""` | Payload path to write the prediction results. |
