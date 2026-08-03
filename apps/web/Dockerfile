# ═══════════════════════════════════════════════════════════════
# StockBattle Web — Production Dockerfile (Next.js Standalone)
# Build from repo root:  docker build -f apps/web/Dockerfile -t stockbattle-web .
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: Build ──
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@11.13.1 --activate
WORKDIR /app

# Build-time environment variables (required for Next.js static optimization)
# These are baked into the client bundle at build time — supply via:
#   docker build --build-arg NEXT_PUBLIC_API_URL=https://api.stockbattle.in ...
#
# NEXT_PUBLIC_API_URL: Backend API URL for the /api/* rewrite proxy in next.config.ts
# NEXT_PUBLIC_WS_URL:  WebSocket URL for live price ticks in the trading terminal
ARG NEXT_PUBLIC_API_URL=https://api.stockbattle.in
ARG NEXT_PUBLIC_WS_URL=https://api.stockbattle.in
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}

# Copy workspace manifests and lockfile
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY apps/api/package.json ./apps/api/package.json

# Install dependencies (frozen lockfile)
RUN pnpm install --frozen-lockfile

# 1. Build @stockbattle/shared first (web depends on workspace:*)
RUN pnpm --filter @stockbattle/shared build

# 2. Build Next.js (produces .next/standalone via output: 'standalone')
RUN pnpm --filter @stockbattle/web build

# ── Stage 2: Production runner (minimal standalone image) ──
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 stockbattle && \
    adduser --system --uid 1001 stockbattle

# Copy the standalone server bundle (includes its own minimal node_modules)
COPY --from=builder /app/apps/web/.next/standalone ./

# Copy static assets into the expected location
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Switch to non-root user
USER stockbattle

EXPOSE 3000

# Next.js standalone server entry point
# The standalone output places server.js at apps/web/server.js
CMD ["node", "apps/web/server.js"]
