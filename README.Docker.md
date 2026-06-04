# Docker Deployment Guide

This guide covers building, running, and deploying the Losant MCP Server using Docker.

## Table of Contents

- [Quick Start](#quick-start)
- [Building the Image](#building-the-image)
- [Running the Container](#running-the-container)
- [Environment Variables](#environment-variables)
- [Docker Compose](#docker-compose)
- [Production Deployment](#production-deployment)
- [Health Checks](#health-checks)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Pull from Registry (when available)

```bash
docker pull losant/losant-mcp-server:latest
```

### Run Container

```bash
docker run -d \
  --name losant-mcp-server \
  -p 3000:3000 \
  -e LOSANT_API_TOKEN=<my-api-token> \
  -e LOSANT_API_URL=https://api.losant.com \
  -e ROLLBAR_KEY=your-rollbar-key \
  losant/losant-mcp-server:latest
```

### Verify Health

```bash
wget http://localhost:3000/healthz
```

Expected response:
```json
{"ok":true,"server":"losant-mcp-server"}
```

---

## Building the Image

### Build Locally

```bash
# From project root
docker build -t losant-mcp-server:latest .
```

### Build with Specific Tag

```bash
docker build -t losant-mcp-server:1.0.0 .
```

### Multi-Platform Build

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t losant-mcp-server:latest .
```

---

## Running the Container

### Basic Run

```bash
docker run -d \
  --name losant-mcp-server \
  -p 3000:3000 \
  -e LOSANT_API_TOKEN=<my-api-token> \
  -e NODE_ENV=production \
  losant-mcp-server:latest
```

### With Environment Variables

```bash
docker run -d \
  --name losant-mcp-server \
  -p 3000:3000 \
  -e LOSANT_API_URL=https://api.losant.com \
  -e LOSANT_AUTH_SERVER_URL=https://accounts.losant.com/oauth \
  -e MCP_TITLE="My Losant MCP Server" \
  -e MCP_ICON_URL=https://your-domain.com/icon.png \
  -e LOSANT_API_TOKEN=<my-api-token> \
  -e ROLLBAR_KEY=your-rollbar-key \
  -e NODE_ENV=production \
  losant-mcp-server:latest
```

### With Environment File

Create `.env.production`:
```bash
LOSANT_RESOURCE_URL=https://mcp.your-domain.com
LOSANT_API_URL=https://api.losant.com
ROLLBAR_KEY=your-rollbar-key
NODE_ENV=production
ENABLE_OAUTH=true
MCP_TITLE=Losant MCP Server
```

Run with:
```bash
docker run -d \
  --name losant-mcp-server \
  -p 3000:3000 \
  --env-file .env.production \
  losant-mcp-server:latest
```

### Custom Port

```bash
# Map host port 8080 to container port 3000
docker run -d \
  --name losant-mcp-server \
  -p 8080:3000 \
  -e PORT=3000 \
  losant-mcp-server:latest
```

### Run with Logs

```bash
# Follow logs in real-time
docker run -d --name losant-mcp-server -p 3000:3000 losant-mcp-server:latest
docker logs -f losant-mcp-server
```

### Interactive Mode (for debugging)

```bash
docker run -it --rm \
  -p 3000:3000 \
  -e LOSANT_API_TOKEN=<your-api-token> \
  losant-mcp-server:latest
```

---

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `LOSANT_RESOURCE_URL` | MCP server resource URL — must prefix-match the JWT audience claim | `https://mcp.your-domain.com` |
| `LOSANT_API_TOKEN` | Losant API Token to use over OAuth, this is required when ENABLE_OAUTH is false. | `my-user-token` |
| `ENABLE_OAUTH` | Whether to enable OAuth endpoints, if true LOSANT_API_TOKEN should not be set. | `false` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `HOST` | `null` | Server host (null = all interfaces) |
| `NODE_ENV` | `development` | Environment (`production` recommended) |
| `LOSANT_API_URL` | `https://api.losant.com` | Losant API endpoint |
| `LOSANT_AUTH_SERVER_URL` | `https://accounts.losant.com/oauth` | OAuth server URL |
| `MCP_TITLE` | `"Losant"` | MCP server title (shown in clients) |
| `MCP_ICON_URL` | `""` | MCP server icon URL (SVG) |
| `ROLLBAR_KEY` | `""` | Rollbar API key (optional) |
| `SHUTDOWN_TIMEOUT` | `10000` | Graceful shutdown timeout (ms) |

See [`.env.example`](.env.example) for full configuration options.

---

## Docker Compose

### Basic docker-compose.yml

```yaml
services:
  losant-mcp-server:
    image: losant/losant-mcp-server:latest
    container_name: losant-mcp-server
    ports:
      - "3000:3000"
    environment:
      - LOSANT_API_URL=https://api.losant.com
      - NODE_ENV=production
      - ROLLBAR_KEY=${ROLLBAR_KEY}
      - LOSANT_API_TOKEN=${LOSANT_API_TOKEN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "sh", "-c", "node -e \"require('http').get('http://localhost:3000/healthz', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

### Run with Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart
```

---

## Production Deployment

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: losant-mcp-server
  labels:
    app: losant-mcp-server
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app: losant-mcp-server
  template:
    metadata:
      labels:
        app: losant-mcp-server
    spec:
      containers:
      - name: losant-mcp-server
        image: losant/losant-mcp-server:1.0.0
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: LOSANT_API_TOKEN
          valueFrom:
             secretKeyRef:
              name: losant-mcp-secrets
              key: losant-api-key
        - name: NODE_ENV
          value: "production"
        - name: ROLLBAR_KEY
          valueFrom:
            secretKeyRef:
              name: losant-mcp-secrets
              key: rollbar-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /healthz
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
---
apiVersion: v1
kind: Service
metadata:
  name: losant-mcp-server
spec:
  selector:
    app: losant-mcp-server
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: losant-mcp-server
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - mcp.your-domain.com
    secretName: mcp-tls
  rules:
  - host: mcp.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: losant-mcp-server
            port:
              number: 80
```

---

## Health Checks

### Built-in Health Check

The Docker image includes a health check configured in the Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD sh -c "node -e \"require('http').get('http://localhost:${PORT:-3000}/healthz', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""
```

### Check Container Health

```bash
# View health status
docker ps
docker inspect losant-mcp-server | jq '.[0].State.Health'

# Manual health check
docker exec losant-mcp-server \
  sh -c "node -e \"require('http').get('http://localhost:3000/healthz', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""
```

### Custom Health Check

Override the built-in health check:

```bash
docker run -d \
  --name losant-mcp-server \
  -p 3000:3000 \
  --health-cmd="wget -f http://localhost:3000/healthz || exit 1" \
  --health-interval=10s \
  --health-timeout=3s \
  --health-retries=3 \
  losant-mcp-server:latest
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker logs losant-mcp-server
```

**Common issues:**
- Missing `LOSANT_RESOURCE_URL` environment variable
- Invalid configuration (check config validation errors)
- Port conflict (change `-p` mapping)

### Health Check Failing

**Verify endpoint manually:**
```bash
docker exec losant-mcp-server wget http://localhost:3000/healthz
```

### Permission Issues

The container runs as non-root user `losant` (UID 1001). If you encounter permission errors with volume mounts:

```bash
# Check file ownership
docker exec losant-mcp-server ls -la /app

# Run as root (debugging only, not recommended for production)
docker run --user root losant-mcp-server:latest
```

### Out of Memory

**Increase container memory:**
```bash
docker run -d \
  --memory="1g" \
  --memory-swap="2g" \
  losant-mcp-server:latest
```

**Monitor memory usage:**
```bash
docker stats losant-mcp-server
```

### Network Issues

**Test connectivity to Losant API:**
```bash
docker exec losant-mcp-server wget https://api.losant.com
```

### Debug Mode

**Run with debug logs:**
```bash
docker run -it --rm \
  -p 3000:3000 \
  -e DEBUG=losant-mcp-server:* \
  losant-mcp-server:latest
```

### Shell Access

**Get shell in running container:**
```bash
docker exec -it losant-mcp-server sh
```

**Run new container with shell:**
```bash
docker run -it --rm losant-mcp-server:latest sh
```

---

## Security Best Practices

### 1. Don't Run as Root

The Docker image already runs as non-root user `losant`. **Never override this** unless absolutely necessary.

### 2. Use Read-Only Filesystem

```bash
docker run -d \
  --read-only \
  --tmpfs /tmp \
  losant-mcp-server:latest
```

### 3. Limit Container Capabilities

```bash
docker run -d \
  --cap-drop=ALL \
  --cap-add=NET_BIND_SERVICE \
  losant-mcp-server:latest
```

### 4. Use Secrets for Sensitive Data

**Docker Secrets (Swarm mode):**
```bash
echo "your-rollbar-key" | docker secret create rollbar_key -

docker service create \
  --name losant-mcp-server \
  --secret rollbar_key \
  -e ROLLBAR_KEY_FILE=/run/secrets/rollbar_key \
  losant-mcp-server:latest
```

**Environment variables from files:**
```bash
docker run -d \
  -e ROLLBAR_KEY=$(cat /path/to/secret) \
  losant-mcp-server:latest
```

### 5. Keep Image Updated

```bash
# Pull latest security patches
docker pull losant/losant-mcp-server:latest

# Rebuild your image
docker build --pull -t losant-mcp-server:latest .
```

### 6. Scan for Vulnerabilities

```bash
# Using Trivy
trivy image losant-mcp-server:latest
```

---

## Performance Tuning

### Resource Limits

```bash
docker run -d \
  --cpus="1.0" \
  --memory="1g" \
  --memory-reservation="512m" \
  losant-mcp-server:latest
```

### Node.js Memory Limits

```bash
docker run -d \
  -e NODE_OPTIONS="--max-old-space-size=768" \
  losant-mcp-server:latest
```

### Logging

**Limit log size:**
```bash
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  losant-mcp-server:latest
```

---

## Additional Resources

- [Dockerfile](Dockerfile) - Image definition
- [.dockerignore](.dockerignore) - Excluded files
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [Docker Documentation](https://docs.docker.com/)

---

**Last Updated:** 2026-05-27
**Version:** 1.0.0
