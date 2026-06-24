# ─────────────────────────────────────────────
# Stage 1: Builder — install ALL deps (dev too)
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (layer cache)
COPY package.json package-lock.json ./

# Install all deps including devDependencies
RUN npm ci

# Copy source
COPY . .

# ─────────────────────────────────────────────
# Stage 2: Production — lean final image
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling (graceful shutdown)
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S tripline -u 1001

WORKDIR /app

# Copy only production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY --chown=tripline:nodejs . .

# Switch to non-root user
USER tripline

# Expose backend port
EXPOSE 8080

# Healthcheck — hits the /health endpoint every 30s
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Use dumb-init as PID 1 to forward signals correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/app.js"]
