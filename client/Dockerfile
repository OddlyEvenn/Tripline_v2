# ─────────────────────────────────────────────
# Stage 1: Builder — compile the React/Vite app
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests for layer caching
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy full source
COPY . .

# Build the optimized production bundle
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Serve static files with NGINX
# ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove the default NGINX config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom NGINX config for the frontend container
COPY nginx.frontend.conf /etc/nginx/conf.d/default.conf

# Copy built assets from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# NGINX runs on port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
