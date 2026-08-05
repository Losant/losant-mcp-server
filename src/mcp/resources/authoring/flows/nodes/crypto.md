# Crypto Nodes — Hash, Sign, Verify

Three nodes for cryptographic operations on workflow data.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default | Available in |
|---|---|---|---|---|
| `HashNode` | `logic` | `hash` | `"Crypto: Hash"` | cloud, exp, edge (1.1.0), custom |
| `CryptoSignNode` | `logic` | `crypto-sign` | `"Crypto: Sign"` | cloud, exp, edge (2.3.0), custom |
| `CryptoVerifyNode` | `logic` | `crypto-verify` | `"Crypto: Verify"` | cloud, exp, edge (2.3.0), custom |

## Cloud (Application) workflows

### Crypto: Hash Node (`type: "HashNode"`)

Creates a cryptographic hash (or HMAC with a secret) of a value.

```json
{
  "id": "hash-data",
  "type": "HashNode",
  "config": {
    "dataTemplate": "{{data.attributes.payload}}",
    "algorithmTemplate": "SHA256",
    "secretTemplate": "",
    "encodingTemplate": "hex",
    "dataEncodingTemplate": "utf8",
    "secretEncodingTemplate": "utf8",
    "destinationPath": "working.hash"
  },
  "meta": { "category": "logic", "name": "hash", "label": "Crypto: Hash", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `dataTemplate` | `""` | **Required.** Template resolving to the data to hash. |
| `algorithmTemplate` | `"SHA256"` | **Required.** Hash algorithm: `"MD5"`, `"SHA1"`, `"SHA256"`, `"SHA512"`, `"RIPEMD"`, `"Whirlpool"`. Template. |
| `secretTemplate` | `""` | Optional HMAC secret. When set, produces an HMAC instead of a plain hash. |
| `encodingTemplate` | `"hex"` | **Required.** Output encoding: `"hex"`, `"base64"`, `"latin1"`. |
| `dataEncodingTemplate` | `"utf8"` | **Required.** Input data encoding. GEA 1.32.0+ on edge. |
| `secretEncodingTemplate` | `"utf8"` | **Required.** Secret encoding. GEA 1.32.0+ on edge. |
| `destinationPath` | `""` | **Required.** Payload path to write the hash string. |

---

### Crypto: Sign Node (`type: "CryptoSignNode"`)

Generates a cryptographic signature using a private key. Used for verifying data integrity and authenticity.

```json
{
  "id": "sign-data",
  "type": "CryptoSignNode",
  "config": {
    "credentialNameTemplate": "my-signing-credential",
    "dataTemplate": "{{working.payload}}",
    "dataEncodingTemplate": "utf8",
    "algorithmTemplate": "SHA256",
    "paddingTemplate": "RSA_PKCS1_PADDING",
    "dsaEncodingTemplate": "der",
    "signatureEncodingTemplate": "base64",
    "resultPath": "working.signature"
  },
  "meta": { "category": "logic", "name": "crypto-sign", "label": "Crypto: Sign", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | Signing credential name. Use this OR `keyTemplate`/`keyTemplateType`. |
| `keyTemplateType` | — | Key source when not using credential: `"stringTemplate"`, `"payloadPath"`, or `"diskPath"` (edge). |
| `keyTemplate` | `""` | The private key, used when `keyTemplateType` is set. |
| `dataTemplate` | `""` | **Required.** Template resolving to the data to sign. |
| `dataEncodingTemplate` | `"utf8"` | **Required.** Data encoding. |
| `algorithmTemplate` | `"SHA256"` | **Required.** Hash algorithm for signing. Template. |
| `paddingTemplate` | `"RSA_PKCS1_PADDING"` | **Required.** RSA padding: `"RSA_PKCS1_PADDING"` or `"RSA_PKCS1_PSS_PADDING"`. |
| `dsaEncodingTemplate` | `"der"` | **Required.** DSA encoding: `"der"` or `"ieee-p1363"`. |
| `signatureEncodingTemplate` | `"base64"` | **Required.** Output signature encoding: `"base64"`, `"hex"`, `"latin1"`. |
| `resultPath` | `""` | Optional. Payload path to write `{ signature: "<string>" }` on success or `{ error: { message } }` on failure. |

---

### Crypto: Verify Node (`type: "CryptoVerifyNode"`)

Verifies a cryptographic signature against a key/certificate. Branches — `outputIds[0]` = **invalid** (verification failed); `outputIds[1]` = **valid** (verification passed). Note: this is consistent with the ConditionalNode pattern where index 0 is the failure/false path.

```json
{
  "id": "verify-sig",
  "type": "CryptoVerifyNode",
  "config": {
    "credentialNameTemplate": "my-signing-credential",
    "dataTemplate": "{{working.payload}}",
    "signatureTemplate": "{{working.signature}}",
    "dataEncodingTemplate": "utf8",
    "algorithmTemplate": "SHA256",
    "paddingTemplate": "RSA_PKCS1_PADDING",
    "dsaEncodingTemplate": "der",
    "signatureEncodingTemplate": "base64",
    "resultPath": "working.verifyError"
  },
  "meta": { "category": "logic", "name": "crypto-verify", "label": "Crypto: Verify", "x": 200, "y": 200 },
  "outputIds": [["invalid"], ["valid"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | Verification credential (public key or certificate). Use this OR `keyTemplate`/`keyTemplateType`. |
| `keyTemplateType` | — | Key source when not using credential. |
| `keyTemplate` | `""` | Public key/certificate when using `keyTemplateType`. |
| `dataTemplate` | `""` | **Required.** The data that was originally signed. |
| `signatureTemplate` | `""` | **Required.** The signature to verify. |
| `dataEncodingTemplate` | `"utf8"` | **Required.** |
| `algorithmTemplate` | `"SHA256"` | **Required.** Must match the algorithm used when signing. |
| `paddingTemplate` | `"RSA_PKCS1_PADDING"` | **Required.** |
| `dsaEncodingTemplate` | `"der"` | **Required.** |
| `signatureEncodingTemplate` | `"base64"` | **Required.** Must match the encoding used when signing. |
| `resultPath` | `""` | Optional. Payload path to write `{ error: { message } }` when the node throws an execution error (e.g. bad key). A clean `false` result (signature mismatch) routes to `outputIds[0]` without writing to `resultPath`. |

## Experience workflows

Same as Cloud.

## Edge workflows

**Crypto: Hash** — minimum GEA 1.1.0. `dataEncodingTemplate` and `secretEncodingTemplate` available on GEA 1.32.0+.

**Crypto: Sign / Crypto: Verify** — minimum GEA 2.3.0. `keyTemplateType: "diskPath"` is only available on edge (load key from local file).
