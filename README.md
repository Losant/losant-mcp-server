# Losant MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-11.4.0-orange)](https://pnpm.io)

**Losant MCP Server** is a [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that provides AI assistants like Claude with secure access to the [Losant IoT Platform](https://www.losant.com). It supports two authentication modes: a simple API token mode for local use and development, and a full OAuth 2.0 flow for multi-user or production deployments.

## Features

- 🔐 **OAuth 2.0 Authentication** - RFC-compliant bearer token auth (RFC 6750, RFC 7235, RFC 8707, RFC 9728)
- 🛠️ **Two Powerful MCP Tools**:
  - `losant_query` - Query applications, devices, flows, data tables, and more
  - `losant_timeseries` - Retrieve time-series device data and state
- 📚 **Dynamic Documentation** - API docs and schemas loaded from `losant-rest` package
- 🚀 **Stateless & Scalable** - Per-request MCP server instances for horizontal scaling
- 🐳 **Docker Support** - Production-ready multi-stage Docker builds
- ✅ **Comprehensive Tests** - Tests covering unit, integration, and E2E scenarios

---

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [MCP Tools](#mcp-tools)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Development](#development)
- [Testing](#testing)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Quick Start

### Prerequisites

- **[Node.js](https://nodejs.org/)** >= 24.0.0
- **[pnpm](https://pnpm.io/)** >= 11.4.0
- **[Losant Account](https://www.losant.com/)** with an API token or OAuth configured

### Install & Run (API Token — Default)

The simplest way to get started. Set `LOSANT_API_TOKEN` and the server will authenticate all Losant API requests using that token. OAuth is disabled by default.

```bash
# Clone repository
git clone https://github.com/Losant/losant-mcp-server.git
cd losant-mcp-server

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Set LOSANT_API_TOKEN in .env (ENABLE_OAUTH must be false or unset)
# You can generate a token in your Losant account, e.g. https://app.losant.com/me/user-tokens
# If you do not have an account sign up for free at https://accounts.losant.com

# Start server
pnpm start

# Server running at http://localhost:3000
```

### Install & Run (OAuth 2.0)

For multi-user or production deployments, enable OAuth so each MCP client authenticates individually against the Losant auth server.

```bash
# Configure environment
cp .env.example .env
# Set LOSANT_RESOURCE_URL to the URL where the MCP server is hosted and ENABLE_OAUTH=true in .env

# Start server
pnpm start
```

### Verify Installation

```bash
# Health check
wget http://localhost:3000/healthz

# Expected response:
# {"ok":true,"server":"losant-mcp-server"}
```

---

## Installation

### From Source

```bash
git clone https://github.com/Losant/losant-mcp-server.git
cd losant-mcp-server
pnpm install
```

### Docker

```bash
# Pull image
docker losant/losant-mcp-server:latest

# Run container
docker run -d -p 3000:3000 \
  -e LOSANT_API_TOKEN=<your-api-token> \
  losant/losant-mcp-server:latest
```

See [README.Docker.md](README.Docker.md) for detailed Docker instructions.

---

## Configuration

Configuration is managed via environment variables. See [`.env.example`](.env.example) for all options.

### API Token Mode (Default — `ENABLE_OAUTH=false`)

The server authenticates every Losant API call using a single static token. No OAuth setup is required. This is the recommended mode for local development and single-user deployments.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `LOSANT_API_TOKEN` | **Yes** | Losant API token used for all requests to the Losant API | `your-api-token` |

`ENABLE_OAUTH` must be `false` (the default) when using this mode.

### OAuth 2.0 Mode (`ENABLE_OAUTH=true`)

Each MCP client connection authenticates independently against the Losant OAuth server. The server validates the resulting bearer token on every request and forwards it to the Losant API. This is the recommended mode for multi-user and production deployments.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `LOSANT_RESOURCE_URL` | **Yes** | MCP server resource URL — must prefix-match the JWT audience claim | `https://mcp.your-domain.com` |
| `LOSANT_AUTH_SERVER_URL` | No | Losant OAuth authorization server | `https://accounts.losant.com/oauth` |
| `LOSANT_OAUTH_SCOPES` | No | Fallback OAuth scopes requested during authorization | `all.Organization.bounded, only.User.read` |

### Common Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HOST` | `null` | Server host (`null` = all interfaces) |
| `NODE_ENV` | `development` | Environment (`production` recommended) |
| `LOSANT_API_URL` | `https://api.losant.com` | Losant API endpoint |
| `MCP_TITLE` | `"Losant"` | Server title shown in MCP clients |
| `MCP_ICON_URL` | `""` | Server icon URL (SVG format) |
| `ROLLBAR_KEY` | `""` | Rollbar error reporting key |
| `SHUTDOWN_TIMEOUT` | `10000` | Graceful shutdown timeout (milliseconds) |
| `ENABLE_OAUTH` | `false` | Set to `true` to enable OAuth endpoints |

### Example `.env` — API Token Mode

```bash
# Authentication
LOSANT_API_TOKEN=your-losant-api-token

# Optional
PORT=3000
NODE_ENV=production
MCP_TITLE=Losant MCP Server
```

### Example `.env` — OAuth Mode

```bash
# Authentication
ENABLE_OAUTH=true
LOSANT_RESOURCE_URL=https://mcp.your-domain.com

# Optional
PORT=3000
NODE_ENV=production
MCP_TITLE=Losant MCP Server
ROLLBAR_KEY=your-rollbar-api-key
```

---

## Usage

### Claude Desktop Integration

#### API Token Mode (Default)

When `ENABLE_OAUTH=false`, the server uses `LOSANT_API_TOKEN` for all Losant API calls. No bearer token is required from the MCP client — just point Claude Desktop at the server:

```json
{
  "mcpServers": {
    "losant": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

#### OAuth 2.0 Mode

When `ENABLE_OAUTH=true`, each client must authenticate against the Losant auth server before making requests. Claude Desktop handles this automatically:

```json
{
  "mcpServers": {
    "losant": {
      "url": "https://mcp.your-domain.com/mcp"
    }
  }
}
```

On first connection, Claude will:
1. Discover the OAuth server via `/.well-known/oauth-protected-resource`
2. Redirect you to log in to your Losant account
3. Request the configured scopes
4. Include the resulting bearer token on every subsequent request

#### Using MCP Tools

Once connected (either mode), you can ask Claude:
- "List my Losant applications"
- "Show devices in application X"
- "Get temperature data for device Y"

### HTTP API

The server exposes standard MCP endpoints over HTTP:

#### POST /mcp

Main MCP endpoint for tool calls and resource queries.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "losant_query",
    "arguments": {
      "operation": "list",
      "resourceType": "application"
    }
  }
}
```

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"count\":5,\"items\":[...]}"
    }]
  }
}
```

#### GET /healthz

Health check endpoint.

**Response:**
```json
{"ok":true,"server":"losant-mcp-server"}
```

#### GET /.well-known/oauth-protected-resource

OAuth 2.0 Protected Resource Metadata (RFC 9728).

**Response:**
```json
{
  "resource": "https://mcp.your-domain.com/mcp",
  "authorization_servers": ["https://accounts.losant.com/oauth"],
  "bearer_methods_supported": ["header"],
  "scopes_supported": [ "all.Application.read", "all.Application.bounded", "only.Organization.read", "only.Organization.bounded", "all.Organization.read", "all.Organization.bounded", "only.User.read" ]
}
```

---

## MCP Tools

### 1. losant_query

Query Losant resources (applications, devices, flows, data tables, etc.).

**Parameters:**
- `operation` - "list" or "get"
- `resourceType` - Type of resource (application, device, flow, etc.)
- `applicationId` - Application ID (required for app-scoped resources)
- `parentResourceId` - Parent resource ID (for nested resources)
- `resourceId` - Resource ID (required for "get" operation)
- `page`, `perPage` - Pagination
- `filterField`, `filter` - Filtering
- `sortField`, `sortDirection` - Sorting
- `query` - Advanced MongoDB-style queries

**Supported Resource Types:**
- Top-level: `application`
- App-scoped: `event`, `device`, `applicationKey`,`deviceRecipe`,`dataTable`,`webhook`,`integration`,`applicationDashboard`,`notebook`,`flow`,`resourceJob`,`credential`,`file`,`privateFile`,`experienceDomain`,`experienceEndpoint`,`experienceGroup`,`experienceSlug`,`experienceUser`,`experienceVersion`,`experienceView`
- Nested: `flowVersion` (requires `flowId`), `dataTableRow` (requires `dataTableId`)

**Example: List Applications**
```json
{
  "name": "losant_query",
  "arguments": {
    "operation": "list",
    "resourceType": "application",
    "perPage": 10
  }
}
```

**Example: Get Device by ID**
```json
{
  "name": "losant_query",
  "arguments": {
    "operation": "get",
    "resourceType": "device",
    "applicationId": "507f1f77bcf86cd799439011",
    "resourceId": "507f1f77bcf86cd799439012"
  }
}
```

**Example: List Devices with Filter**
```json
{
  "name": "losant_query",
  "arguments": {
    "operation": "list",
    "resourceType": "device",
    "applicationId": "507f1f77bcf86cd799439011",
    "filterField": "name",
    "filter": "Temperature*",
    "perPage": 25
  }
}
```

### 2. losant_timeseries

Query time-series device data and state information.

**Parameters:**
- `operation` - Operation type (see below)
- `applicationId` - Application ID (required)
- `deviceId` - Device ID (for state/command/logs)
- `query` - Query object (for timeSeriesQuery/lastValueQuery)
- `start`, `end` - Time range
- `limit`, `offset` - Pagination

**Operations:**
- `timeSeriesQuery` - Query time-series data with aggregation
- `lastValueQuery` - Get last reported values
- `getState` - Get device state history
- `getCompositeState` - Get composite device state
- `getCommand` - Get device command history
- `getLogEntries` - Get device log entries

**Example: Time-Series Aggregation**
```json
{
  "name": "losant_timeseries",
  "arguments": {
    "operation": "timeSeriesQuery",
    "applicationId": "507f1f77bcf86cd799439011",
    "query": {
      "aggregation": {
        "duration": "1h",
        "operation": "mean"
      },
      "devices": [{"id": "507f1f77bcf86cd799439012"}],
      "attributes": ["temperature", "humidity"]
    }
  }
}
```

**Example: Get Last Values**
```json
{
  "name": "losant_timeseries",
  "arguments": {
    "operation": "lastValueQuery",
    "applicationId": "507f1f77bcf86cd799439011",
    "query": {
      "deviceIds": ["507f1f77bcf86cd799439012"],
      "attributes": ["temperature"]
    }
  }
}
```

---

## Authentication

The server supports two mutually exclusive authentication modes controlled by `ENABLE_OAUTH`.

### Mode 1: API Token (Default — `ENABLE_OAUTH=false`)

Set `LOSANT_API_TOKEN` to a Losant API token. The server uses this token for every call to the Losant API, regardless of which MCP client is connected. No bearer token is required from the client.

This mode is ideal for:
- Local development
- Single-user deployments
- Environments where OAuth is not available

### Mode 2: OAuth 2.0 (`ENABLE_OAUTH=true`)

Each MCP client connection must authenticate with the Losant OAuth server before making requests. The server implements **OAuth 2.0 Bearer Token authentication** with shallow validation:

1. **Client obtains JWT** from Losant OAuth server
2. **Client includes JWT** in `Authorization: Bearer <token>` header
3. **Server validates JWT**:
   - Audience (`aud`) prefix-matches `LOSANT_RESOURCE_URL`
   - Expiry (`exp`) is in the future
   - **No signature verification** (delegated to Losant API)
4. **Server creates MCP instance** bound to that bearer token
5. **Losant API validates** signature and scopes

This mode is ideal for:
- Multi-user deployments
- Production environments
- Scenarios requiring per-user access control

### Security Model

- ✅ Token validated on **every request**
- ✅ Audience claim prevents **token reuse across services**
- ✅ Per-request server instances prevent **token leakage**
- ✅ Signature verification **delegated to Losant API**
- ✅ RFC-compliant error responses with `WWW-Authenticate` headers

### Supported RFCs (OAuth Mode)

- **RFC 6750** - OAuth 2.0 Bearer Token Usage
- **RFC 7235** - HTTP Authentication (WWW-Authenticate)
- **RFC 7230** - HTTP Message Syntax (quoted-string)
- **RFC 8707** - Resource Indicators (audience arrays)
- **RFC 9728** - Protected Resource Metadata

---

## Deployment

### Production Checklist

**Both modes:**
- [ ] Set `NODE_ENV=production`
- [ ] Set up HTTPS reverse proxy (nginx, Cloudflare, etc.)
- [ ] Configure Rollbar for error reporting
- [ ] Enable health checks
- [ ] Set appropriate resource limits (memory, CPU)
- [ ] Configure graceful shutdown timeout
- [ ] Set up monitoring and alerting

**API Token mode** (`ENABLE_OAUTH=false`):
- [ ] Set `LOSANT_API_TOKEN` to a valid Losant API token

**OAuth mode** (`ENABLE_OAUTH=true`):
- [ ] Configure `LOSANT_RESOURCE_URL` with your production URL
- [ ] Verify `LOSANT_AUTH_SERVER_URL` points to the correct Losant auth server

### Docker Deployment

See [README.Docker.md](README.Docker.md) for:
- Building Docker images
- Running containers
- Docker Compose examples
- Kubernetes deployments

### Horizontal Scaling

The server is **stateless** and can be horizontally scaled:

- No sticky sessions required
- No shared state between instances
- Health check endpoint for load balancers
- Graceful shutdown support

**Example load balancer configuration:**
```yaml
# AWS ALB Target Group
HealthCheckEnabled: true
HealthCheckPath: /healthz
HealthCheckIntervalSeconds: 30
HealthCheckTimeoutSeconds: 5
HealthyThresholdCount: 2
UnhealthyThresholdCount: 3
```

---

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/Losant/losant-mcp-server.git
cd losant-mcp-server

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env

# Start development server
pnpm start:dev
```

### Available Scripts

```bash
# Start production server
pnpm start

# Start development server (NODE_ENV=development)
pnpm start:dev

# Run all tests
pnpm test

# Run E2E tests (requires a local mcp server to be running)
pnpm test:e2e

# Coverage report
pnpm test:coverage

# Lint code
pnpm lint

# Auto-fix linting issues
pnpm lint:fix
```

### Debug Mode

Enable debug logs for specific components:

```bash
# All logs
DEBUG=losant-mcp-server:* pnpm start:dev

# HTTP server logs only
DEBUG=losant-mcp-server:http pnpm start:dev

# Tools logs only
DEBUG=losant-mcp-server:tools:* pnpm start:dev
```

### Project Structure

```
losant-mcp-server/
├── bin/
│   └── index.js              # Entry point
├── src/
│   ├── auth/
│   │   └── bearer.js         # Bearer token validation
│   ├── http/
│   │   ├── server.js         # Hapi HTTP server
│   │   └── oauth-discovery.js # OAuth metadata endpoint
│   ├── mcp/
│   │   ├── server.js         # MCP server factory
│   │   ├── tools/            # MCP tool implementations
│   │   │   ├── index.js
│   │   │   ├── query-resources.js
│   │   │   └── query-timeseries.js
│   │   └── resources/        # MCP resource loaders
│   │       ├── index.js
│   │       ├── build-api-index-content.js
│   │       ├── query-tool-guide.js
│   │       └── advanced-query-guide.js
│   ├── helpers/
│   │   └── rollbar.js        # Error reporting
│   ├── config.js             # Configuration schema
│   └── constants.js          # Shared constants
├── test/                     # Test suite
├── .env.example              # Environment template
├── Dockerfile                # Docker image definition
├── package.json              # Dependencies
└── pnpm-lock.yaml           # Lock file
```

---

## Testing

### Run Tests

```bash
# All tests
pnpm test

# E2E tests (requires a local mcp server to be running)
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

### Test Technologies

- **Mocha** - Test runner
- **Should.js** - Assertions
- **Nock** - HTTP mocking
- **esmock** - ES module mocking
- **Sinon** - Stubs and spies
- **c8** - Coverage reporting

---

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design decisions
- **[README.Docker.md](README.Docker.md)** - Docker deployment guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development and contribution guidelines
- **[SECURITY.md](SECURITY.md)** - Security policy and best practices
- **[CHANGELOG.md](CHANGELOG.md)** - Version history

### External Resources

- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification
- [Losant REST API](https://docs.losant.com/rest-api/overview/) - Losant API docs
- [Losant OAuth](https://docs.losant.com/user-accounts/oauth/) - OAuth configuration
- [RFC 6750](https://datatracker.ietf.org/doc/html/rfc6750) - Bearer Token Usage
- [RFC 9728](https://datatracker.ietf.org/doc/html/rfc9728) - Protected Resource Metadata

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup
- Coding standards
- Testing requirements
- Pull request process

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Run tests (`pnpm test`)
6. Commit changes (`git commit -m 'feat: add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Support

### Issues

Report bugs and request features via [GitHub Issues](https://github.com/Losant/losant-mcp-server/issues).

### Security

For security vulnerabilities, email **hello@losant.com** (do not use GitHub Issues).

See [SECURITY.md](SECURITY.md) for details.

### Community

- **Email:** hello@losant.com
- **Website:** https://www.losant.com
- **Documentation:** https://docs.losant.com
- **Blog:** https://www.losant.com/blog

---

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification
- [Anthropic](https://www.anthropic.com) - Claude AI and MCP SDK
- [Losant](https://www.losant.com) - IoT platform
- All contributors and maintainers

---

**Made with ❤️ by Losant**

[GitHub](https://github.com/Losant/losant-mcp-server) | [Losant](https://www.losant.com) | [Documentation](https://docs.losant.com)
