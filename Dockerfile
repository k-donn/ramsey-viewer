# ============================================
# Stage 1: Dependencies Installation Stage
# ============================================

# IMPORTANT: Docker Hardened Image (DHI) Version Maintenance
# This Dockerfile uses a DHI Node build image and the official Caddy image. Regularly validate and update image versions for security and compatibility.

FROM dhi.io/node:26-alpine-dev AS dependencies

WORKDIR /app

# Copy package-related files first to leverage Docker's caching mechanism
COPY package.json package-lock.json .npmrc* ./

# Install project dependencies with frozen lockfile for reproducible builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ============================================
# Stage 2: Build Next.js Application
# ============================================

FROM dhi.io/node:26-alpine-dev AS builder

WORKDIR /app

# Copy project dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source code
COPY . .

ENV NODE_ENV=production

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
RUN --mount=type=cache,target=/app/.next/cache npm run build

# =========================================
# Stage 3: Serve Static Files with Caddy
# =========================================
FROM dhi.io/caddy:2 AS production

COPY --from=builder /app/Caddyfile /etc/caddy/Caddyfile

COPY --from=builder /app/out /srv/
