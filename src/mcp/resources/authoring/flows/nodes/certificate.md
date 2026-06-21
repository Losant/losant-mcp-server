# Certificate Nodes — Create, Read

Two nodes for creating and reading X.509 certificates.

## Required Fields

| `type` | `meta.category` | `meta.name` | `meta.label` default |
|---|---|---|---|
| `CertificateCreateNode` | `logic` | `certificate-create` | `"Certificate: Create"` |
| `CertificateReadNode` | `logic` | `certificate-read` | `"Certificate: Read"` |

## Cloud (Application) workflows

### Certificate: Create Node (`type: "CertificateCreateNode"`)

Signs a Certificate Signing Request (CSR) with a CA key and certificate, issuing a new leaf certificate. **This node does not generate self-signed or root certificates** — it requires a pre-existing CA key/cert pair (via credential) and a CSR PEM as input.

```json
{
  "id": "create-cert",
  "type": "CertificateCreateNode",
  "config": {
    "credentialNameTemplate": "my-ca-credential",
    "csrTemplateType": "stringTemplate",
    "csrTemplate": "{{working.csrPem}}",
    "algorithmTemplate": "SHA256",
    "expiresInDaysTemplate": "365",
    "resultPath": "working.newCert"
  },
  "meta": { "category": "logic", "name": "certificate-create", "label": "Certificate: Create", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `credentialNameTemplate` | `""` | **Required** (cloud/experience). CA credential name containing the CA key and certificate. Template. |
| `csrTemplateType` | `"stringTemplate"` | **Required.** `"stringTemplate"`, `"payloadPath"`, or `"diskPath"` (edge). |
| `csrTemplate` | `""` | **Required.** The CSR PEM string or payload path per `csrTemplateType`. |
| `algorithmTemplate` | `"SHA256"` | Signing algorithm. Template. |
| `expiresInDaysTemplate` | `"365"` | Certificate validity in days. Template. |
| `notBeforeTemplate` | `""` | Certificate validity start date. Template. |
| `serialNumberTemplate` | `""` | Certificate serial number. Template. |
| `commonNameTemplate` | `""` | Override CSR Common Name. Template. |
| `subjectAltNames` | `[]` | Array of Subject Alternative Names `{ type, value }`. |
| `keyUsages` | `[]` | Array of key usage strings. |
| `extendedKeyUsages` | `[]` | Array of extended key usage strings. |
| `resultPath` | `""` | **Required.** Payload path to write the result object: `{ certificate: "<PEM string>", publicKey: "<PEM string>", info: { subject, issuer, validity, ... } }`. Access the cert PEM at `resultPath + ".certificate"`. |

---

### Certificate: Read Node (`type: "CertificateReadNode"`)

Reads a certificate's public key and metadata without requiring the private key.

```json
{
  "id": "read-cert",
  "type": "CertificateReadNode",
  "config": {
    "crtTemplateType": "stringTemplate",
    "crtTemplate": "{{working.certPem}}",
    "resultPath": "working.certInfo"
  },
  "meta": { "category": "logic", "name": "certificate-read", "label": "Certificate: Read", "x": 200, "y": 200 },
  "outputIds": [["next"]]
}
```

| Config field | Default | Notes |
|---|---|---|
| `crtTemplateType` | `"stringTemplate"` | **Required.** `"stringTemplate"`, `"payloadPath"`, or `"diskPath"` (edge). |
| `crtTemplate` | `""` | **Required.** The certificate PEM string, payload path, or disk path. |
| `resultPath` | `""` | **Required.** Payload path to write the certificate metadata (subject, issuer, validity dates, public key, etc.). |

## Experience workflows

Same as Cloud.

## Edge workflows

> **Minimum GEA version:** 2.3.0

Same as Cloud, except `CertificateCreateNode` uses `caKeyTemplate`/`caCrtTemplate` directly instead of `credentialNameTemplate`. `CertificateReadNode` defaults to `crtTemplateType: "diskPath"` on edge.
