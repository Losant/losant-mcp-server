# Build stage
FROM node:24.18.1-alpine AS base

# Install pnpm
RUN corepack enable

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies (production only)
RUN pnpm install --prod --frozen-lockfile

# Copy source files
COPY src ./src
COPY bin ./bin

# Production stage
FROM node:24.18.1-alpine

LABEL org.opencontainers.image.title="Losant MCP Server" \
      org.opencontainers.image.description="Losant MCP Server for handling device communication and integration with Losant platform" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.authors="Losant Team <hello@losant.com>"

# Install pnpm
RUN corepack enable

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S losant -u 1001

RUN npm uninstall npm -g \
  && apk upgrade -U \
  && apk add --no-cache tini openssl ca-certificates \
  && update-ca-certificates

# Switch to non-root user
USER losant

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
CMD wget -qO- http://localhost:${PORT:-3000}/healthz || exit 1

WORKDIR /app

# Copy installed dependencies and source from build stage
COPY --from=base --chown=losant:nodejs /app/node_modules ./node_modules
COPY --from=base --chown=losant:nodejs /app/src ./src
COPY --from=base --chown=losant:nodejs /app/bin ./bin
COPY --chown=losant:nodejs package.json pnpm-workspace.yaml ./

# Expose port (default 3000, can be overridden with PORT env var)
EXPOSE 3000
ENTRYPOINT ["tini", "-g", "--"]
# Start the server
CMD ["node", "bin/index.js"]
