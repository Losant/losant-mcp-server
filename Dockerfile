# Build stage
FROM node:26.13.0-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"


WORKDIR /app

# Copy package files
COPY ./ ./
# Install pnpm
RUN npx get-pnpm

# Install dependencies (production only)
RUN pnpm deploy --prod --frozen-lockfile /deploy

# Production stage
FROM node:26.13.0-alpine

LABEL org.opencontainers.image.title="Losant MCP Server" \
      org.opencontainers.image.description="Losant MCP Server for handling device communication and integration with Losant platform" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.authors="Losant Team <hello@losant.com>"

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

WORKDIR /deploy

# Copy installed dependencies and source from build stage
COPY --from=base --chown=losant:nodejs /deploy/node_modules ./node_modules
COPY --from=base --chown=losant:nodejs /deploy/src ./src
COPY --from=base --chown=losant:nodejs /deploy/bin ./bin
COPY --chown=losant:nodejs package.json pnpm-workspace.yaml ./

# Expose port (default 3000, can be overridden with PORT env var)
EXPOSE 3000
ENTRYPOINT ["tini", "-g", "--"]
# Start the server
CMD ["node", "bin/index.js"]
