# Architecture

This document describes the architecture, design decisions, and technical implementation of the Losant MCP Server.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Authentication Flow](#authentication-flow)
- [Request Lifecycle](#request-lifecycle)
- [Core Components](#core-components)
- [Design Decisions](#design-decisions)
- [Security Considerations](#security-considerations)
- [Performance & Scalability](#performance--scalability)

---

## Overview

The Losant MCP Server is a [Model Context Protocol](https://modelcontextprotocol.io) server that provides AI assistants (like Claude) with secure access to Losant IoT platform resources. It implements OAuth 2.0 Bearer Token authentication and exposes two MCP tools for querying Losant resources and time-series data.

### Key Capabilities

- Query Losant applications, devices, flows, data tables, and other resources
- Retrieve time-series device data and state information
- OAuth 2.0 RFC-compliant authentication (RFC 6750, RFC 7235, RFC 8707, RFC 9728)
- Dynamic resource documentation from the `losant-rest` package
- Stateless per-request MCP server instances

## System Architecture

```
┌─────────────────────┐
│   AI Client         │
│   (Claude Desktop)  │
│                     │
│   MCP Client        │
└──────────┬──────────┘
           │ HTTPS + Bearer Token
           │ (JWT with aud claim)
           ▼
┌──────────────────────────────────────────────────────────┐
│                  Losant MCP Server (Hapi)                │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Routes                                            │  │
│  │  • POST /mcp - Main MCP endpoint                   │  │
│  │  • GET /healthz - Health check                     │  │
│  │  • GET /.well-known/oauth-protected-resource       |  |
|  |    (only when OAuth is enabled)                    │  │
│  └────────────────────────────────────────────────────┘  │
│                           │                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Bearer Auth (src/auth/bearer.js ENABLE_OAUTH=true)│  │
│  │  • Extract token from Authorization header         │  │
│  │  • Validate aud + exp claims                       │  │
│  │  • Build WWW-Authenticate challenges               │  │
│  └────────────────────────────────────────────────────┘  │
│                           │                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │  MCP Server Factory (per-request)                  │  │
│  │  • Create losant-rest client with bearer token     │  │
│  │  • Load resources (docs, schemas)                  │  │
│  │  • Register tools                                  │  │
│  └────────────────────────────────────────────────────┘  │
│         │                                │               │
│         ▼                                ▼               │
│  ┌──────────────┐              ┌──────────────────────┐  │
│  │  Resources   │              │  Tools               │  │
│  │              │              │                      │  │
│  │  • Docs      │              │  • losant_query      │  │
│  │  • Schemas   │              │  • losant_timeseries │  │
│  │  • Guides    │              │                      │  │
│  └──────────────┘              └──────────────────────┘  │
└────────────────────────┬─────────────────────────────────┘
                         │ Bearer Token
                         ▼
┌──────────────────────────────────────────────────────────┐
│                    Losant REST API                       │
│                (api.losant.com or self-hosted)           │
│  • Verifies JWT signature                                │
│  • Validates scopes                                      │
│  • Returns resource data                                 │
└──────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### OAuth 2.0 Bearer Token Validation

```
User → OAuth Server → JWT → MCP Server → Losant API
                      │
                      ▼
           Shallow Validation:
           • aud claim (prefix match)
           • exp claim (not expired)
           • NO signature check
                      │
                      ▼
           Create MCP Server
           (bound to token)
                      │
                      ▼
           Forward to Losant API
           (full signature check)
```

**Why shallow validation?**
- Avoids distributing JWT signing keys
- Simplifies key rotation
- Losant API already validates signatures
- Reduces attack surface

---

## Request Lifecycle

1. **HTTP Request** → POST /mcp with `Authorization: Bearer <jwt>`
2. **Extract Token** → Parse Authorization header
3. **Validate Token** → Check aud + exp claims
4. **Create MCP Server** → New instance bound to bearer token
5. **Load Resources** → API docs, schemas (cached 1 hour)
6. **Register Tools** → losant_query, losant_timeseries
7. **Execute Tool** → Call losant-rest client with bearer token
8. **Return Response** → MCP-formatted JSON response

---

## Core Components

### 1. HTTP Server (`src/http/server.js`)

**Technology:** [Hapi.js](https://hapi.dev/)

**Routes:**
- `POST /mcp` - Main MCP endpoint
- `GET /healthz` - Health check
- `GET /.well-known/oauth-protected-resource` - OAuth discovery (RFC 9728)

**Configuration:**
- CORS enabled (for browser MCP clients)
- HSTS headers (max-age: 1 year)
- 5 MB payload limit
- JSON only

### 2. Authentication (`src/auth/bearer.js`)

**Functions:**
- `extractBearerToken(request)` - Extract from Authorization header
- `validateBearerToken(token, aud)` - Validate aud + exp claims

**Security:**
- Validating audience by exact match of hostname and prefix matching on the path
- Support for audience arrays (RFC 8707)

### 3. MCP Server Factory (`src/mcp/server.js`)

Creates per-request MCP server instances:

1. Create `losant-rest` client with bearer token
2. Initialize MCP server with metadata
3. Load resources (docs, schemas, guides)
4. Register tools with Losant client
5. Return server instance

**Per-Request Pattern:**
- Each request gets new server instance
- Prevents token staleness
- Prevents cross-request leakage
- Simplifies state management

### 4. Resources (`src/mcp/resources/index.js`)

**Resource Types:**
- **API Docs** (`losant://docs/{name}`) - From losant-rest package
- **Query Schemas** (`losant://schemas/{name}`) - JSON schemas
- **Advanced Query Guide** (`losant://guides/advanced-queries`) - Details on querying appication reosurces with an advanced query
- **Query Tool Guide** (`losant://guides/losant-query-tool`) - Details on querying application resources
- **API Index** (`losant://docs/index`) - Auto-generated index

**Loading:**
- Uses `require.resolve('losant-rest')` for safe package resolution
- Memoized for 60 minutes
- Loads from `losant-rest/docs/*.md` and `losant-rest/lib/schemas/*Query.json`

### 5. Tools

#### losant_query (`src/mcp/tools/query-resources.js`)

Query Losant resources (applications, devices, flows, etc.).

**Operations:** list, get  
**Resources:** application, device, flow, applicationDashboard, dataTable, etc.  
**Features:** Pagination, filtering, sorting, MongoDB queries

#### losant_timeseries (`src/mcp/tools/query-timeseries.js`)

Query time-series device data.

**Operations:**
- timeSeriesQuery - Aggregated time-series data
- lastValueQuery - Last reported values
- getState - Device state history
- getCompositeState - Composite state
- getCommand - Command history
- getLogEntries - Log entries

### 6. Configuration (`src/config.js`)

**Technology:** Convict

**Features:**
- Type-safe configuration
- Environment variable support
- Strict validation (rejects unknown keys)
- URL format validation
- Default values

---

## Design Decisions

### 1. Per-Request MCP Server Instances

**Decision:** Create new MCP server for each request instead of long-lived sessions.

**Rationale:**
- ✅ Eliminates token staleness
- ✅ Prevents token leakage
- ✅ Simplifies state management
- ✅ Supports token rotation
- ✅ Horizontal scaling (no sticky sessions)

**Trade-offs:**
- ❌ Slightly higher memory overhead
- ✅ Mitigated by memoization

### 2. Shallow Token Validation

**Decision:** Validate only aud + exp claims; delegate signature verification to Losant API.

**Rationale:**
- ✅ No JWT signing keys on MCP server
- ✅ Simplified key rotation
- ✅ Losant API already validates
- ✅ Reduced attack surface

### 3. OAuth Discovery with Dynamic Scopes

**Decision:** Fetch scopes from Losant authorization server dynamically.

**Rationale:**
- ✅ Scopes auto-update with Losant features
- ✅ RFC 9728 compliant
- ✅ Cached for 5 minutes
- ✅ Fallback to config if server unavailable

### 4. Resources from losant-rest Package

**Decision:** Load API docs from [`losant-rest` npm package](https://www.npmjs.com/package/losant-rest) at runtime.

**Rationale:**
- ✅ Always in sync with API client version
- ✅ Zero documentation maintenance
- ✅ MCP clients can explore API dynamically
- ✅ Memoized for 60 minutes

---

## Security Considerations

### 1. Authentication

- Tokens validated on **every request**
- Audience claim prevents **token reuse across services**
- Token expiration with no leeway
- **Header injection** prevented (quote escaping)

### 2. Input Validation

- Tool inputs validated via **[Zod schemas](https://zod.dev/)**
- Resource types constrained to **enum**
- IDs validated as **24-char hex strings**
- Query objects validated against **[JSON schemas](https://json-schema.org/)**
- 5 MB payload limit prevents **DoS attacks**

### 3. Error Handling

- Generic error messages to clients (no stack traces)
- Detailed errors logged to Rollbar only
- RFC-compliant auth challenges (no internal details)

### 4. HTTPS Requirements

**Production deployment:**
- Deploy behind **reverse proxy** (e.g. [nginx](https://nginx.org/), [Cloudflare](https://www.cloudflare.com/))
- TLS 1.2+ only
- Strong cipher suites
- HSTS headers (already set by Hapi)

---

## Performance & Scalability

### 1. Stateless Architecture

- No server-side session state
- Each request is independent
- Horizontal scaling (no sticky sessions)
- Load balancers distribute freely

### 2. Caching

- **Resources:** 60-minute cache ([memoizee](https://www.npmjs.com/package/memoizee))
- **OAuth scopes:** 5-minute cache ([memoizee](https://www.npmjs.com/package/memoizee))
- Reduces filesystem I/O and HTTP requests

### 3. Graceful Shutdown

```javascript
process.on('SIGTERM', async () => {
  await server.stop({ timeout: shutdownTimeout });
  process.exit(0);
});
```

- Stop accepting new connections
- Wait for active requests (up to timeout)
- Close all connections
- Exit with code `0`

### 4. Horizontal Scaling

**Requirements:**
- ✅ Stateless design
- ✅ No sticky sessions
- ✅ Health check endpoint (/healthz)
- ✅ Graceful shutdown

---

## Testing Architecture

### Test Tools

- **[Mocha](https://mochajs.org/)** - Test runner
- **[Should.js](https://shouldjs.github.io/)** - Assertions
- **[Nock](https://github.com/nock/nock)** - HTTP mocking
- **[esmock](https://github.com/iambumblehead/esmock)** - ES module mocking
- **[Sinon](https://sinonjs.org/)** - Stubs/spies
- **[c8](https://github.com/bcoe/c8)** - Coverage

---

## Deployment Architecture

### Recommended Production Setup

```
Internet → Load Balancer (TLS) → MCP Servers (3+) → Losant API
```

### Environment Variables

```bash
NODE_ENV=production
PORT=3000
LOSANT_RESOURCE_URL=https://mcp.your-domain.com
ROLLBAR_KEY=<key>
ENABLE_OAUTH=true
```

### Docker

Multi-stage build:
1. **Base stage:** Install dependencies
2. **Production stage:** Copy artifacts, run as non-root

See [README.Docker.md](README.Docker.md) for details.

---

## Future Enhancements

1. **Built-in Rate Limiting** - Hapi plugin
2. **Metrics & Observability** - Prometheus endpoint
3. **WebSocket Transport** - Persistent connections
4. **Batch Operations** - Multiple tool calls in one request

---

## References

### RFCs

- **[RFC 6750](https://datatracker.ietf.org/doc/html/rfc6750)** - OAuth 2.0 Bearer Token Usage
- **[RFC 7235](https://datatracker.ietf.org/doc/html/rfc7235)** - HTTP Authentication
- **[RFC 7230](https://datatracker.ietf.org/doc/html/rfc7230)** - HTTP Message Syntax
- **[RFC 8707](https://datatracker.ietf.org/doc/html/rfc8707)** - OAuth Resource Indicators
- **[RFC 9728](https://datatracker.ietf.org/doc/html/rfc9728)** - OAuth Protected Resource Metadata

### MCP

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
- [HTTP Transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http)

### Losant

- [REST API](https://docs.losant.com/rest-api/overview/)
- [losant-rest](https://github.com/Losant/losant-rest-js)
- [OAuth](https://docs.losant.com/user-accounts/oauth/)

---

**Last Updated:** 2026-05-27
**Version:** 1.0.0
