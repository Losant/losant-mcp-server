# Changelog

All notable changes to the Losant MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-11-03

### Added
- `losant_flow_diagnostics` MCP tool — query a flow's run statistics and historical per-node errors in one call
- `losant_flow_debug_listener` MCP tool — watch a flow's live debug output and optionally trigger a Virtual Button press to capture a test run
- Flow debug patterns reference doc (`losant://references/flow/debug-patterns`) covering manual and tool-assisted flow debugging approaches
- Flow authoring guide: node specs for the Kubernetes, OpenTelemetry Logs Write, and OpenTelemetry Metrics Write nodes
- Webhook guide (`losant://guides/webhook`)

### Changed
- Upgraded `@modelcontextprotocol/sdk` from v1 to v2 (split into `@modelcontextprotocol/node`/`server`/`client` packages)
- Reorganized all tool guides under a dedicated `tools/` resource directory and standardized their markdown structure
- Bumped `losant-rest` to the tagged `v4.3.0` release
- Upgraded Node.js runtime to 24.22.1 and updated pnpm and other dependencies

## [1.2.0] - 2026-09-23

### Added
- `losant_delete` MCP tool — delete Losant resources by type and ID
- Docker Hub automated release via cloud build (multi-platform)

### Changed
- `losant_write` for `flow` and `flowVersion`: added `strictValidation` on create and update, which returns all node validation errors instead of stopping at the first
- Upgraded Node.js runtime to 24.21.0 and updated pnpm and dependencies

## [1.1.0] - 2026-08-25

### Added
- `losant_write` MCP tool — create and update Losant resources using structured authoring guides and JSON schemas
- Writable resource types: `flow`, `flowVersion`, `device`, `deviceRecipe`, `dataTable`, `dataTableRow`, `applicationDashboard`, `experienceView`, `experienceEndpoint`, `experienceGroup`, `experienceUser`, `experienceVersion`, `experienceDomain`, `experienceSlug`, `applicationCertificate`, `applicationCertificateAuthority`, `applicationKey`, `webhook`, `integration`, `resourceJob`, `credential`, `file`, `privateFile`, `notebook`, `event`
- Flow authoring guide (`losant://authoring/flows/flow`) with per-node and per-trigger reference documentation:
  - 90 flow node specs covering all available node types across cloud, experience, edge, and custom node flow classes
  - 35 trigger specs
  - Reference docs: payload structure, global variables, custom node authoring, execution model, Handlebars helper reference, and common flow patterns
- Dashboard authoring guide (`losant://authoring/dashboards/dashboard`) with block-level specs for all dashboard block types
- Experience authoring guides for views (`losant://authoring/experiences/experience-view`) and endpoints (`losant://authoring/experiences/experience-endpoint`)
- ARM64 Docker image support (multi-platform builds)
- Docker image SBOM and provenance attestations

### Changed
- Upgraded Node.js runtime to 24.19
- Updated dependencies

## [1.0.1] - 2026-06-12

### Added
- `/.well-known/oauth-authorization-server` endpoint to comply with OAuth 2.0 Authorization Server Metadata (RFC 8414 / MCP spec version 2025-03-26)

## [1.0.0] - 2026-06-04

### Added
- Initial release of Losant MCP Server
- Supports using a Losant User Token (LOSANT_API_TOKEN)
- OAuth 2.0 Bearer Token authentication (RFC 6750, RFC 7235, RFC 8707, RFC 9728)
- Two MCP tools:
  - `losant_query` - Query Losant resources (applications, devices, flows, etc.)
  - `losant_timeseries` - Query time-series device data and state
- Dynamic resource documentation from `losant-rest` package
- OAuth Protected Resource Metadata endpoint (RFC 9728)
- Dynamic scope discovery from Losant authorization server
- Comprehensive test suite
- Docker support with multi-stage builds
- Health check endpoint (`/healthz`)
- Rollbar error reporting integration
- Graceful shutdown handling (SIGTERM, SIGINT)
- Initial Root HTML page
- Security features:
  - Bearer token validation on every request
  - Shallow validation (audience + expiry only)
  - Signature verification delegated to Losant API
  - Per-request MCP server instances (no token reuse)
  - RFC-compliant WWW-Authenticate challenges
  - Quote escaping in WWW-Authenticate headers
  - 5 MB payload size limit
  - HSTS security headers
  - Non-root Docker user

[1.2.0]: https://github.com/Losant/losant-mcp-server/releases/tag/v1.2.0
[1.1.0]: https://github.com/Losant/losant-mcp-server/releases/tag/v1.1.0
[1.0.1]: https://github.com/Losant/losant-mcp-server/releases/tag/v1.0.1
[1.0.0]: https://github.com/Losant/losant-mcp-server/releases/tag/v1.0.0
