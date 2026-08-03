# ═══════════════════════════════════════════════════════════════
# StockBattle API — Production Dockerfile (NestJS)
# Build from repo root:  docker build -f apps/api/Dockerfile -t stockbattle-api .
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: Build ──
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@11.13.1 --activate
WORKDIR /app

# Copy workspace configuration and lockfile
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies (frozen lockfile)
RUN pnpm install --frozen-lockfile

# 1. Build @stockbattle/shared (API depends on workspace:*)
RUN pnpm --filter @stockbattle/shared build

# 2. Generate Prisma client (must happen before NestJS build)
RUN cd apps/api && npx prisma generate

# 3. Build NestJS API
RUN pnpm --filter @stockbattle/api build

# 4. Deploy pruned production-only bundle for API service
RUN pnpm --filter @stockbattle/api --prod --legacy deploy /prod/api
RUN cp -r node_modules/.pnpm/@prisma+client* /prod/api/node_modules/.pnpm/

# ── Stage 2: Production runner (pruned & minimal) ──
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 stockbattle && \
    adduser --system --uid 1001 stockbattle

# Copy pruned production deployment bundle
COPY --from=builder /prod/api ./

# Copy Prisma schema + migrations (needed for Render Pre-Deploy: prisma migrate deploy)
COPY --from=builder /app/apps/api/prisma ./prisma

# Switch to non-root user
USER stockbattle

EXPOSE 3001

# NOTE: Migrations are NOT run here. Use Render's "Pre-Deploy Command"
# (or a CI step) to run: npx prisma migrate deploy
CMD ["node", "dist/main.js"]
