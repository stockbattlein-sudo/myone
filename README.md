# StockBattle

AI-native prop-trading evaluation platform (simulation-only). Traders pay a one-time fee to attempt a simulated risk-management challenge using live/near-live market data and virtual capital.

## Quick Start

```bash
# Prerequisites: Node.js 18+, pnpm 9+, Docker

# 1. Start databases
pnpm docker:up

# 2. Install dependencies
pnpm install

# 3. Run database migrations
pnpm db:migrate:dev

# 4. Start development servers
pnpm dev
# → API: http://localhost:3001/api
# → Web: http://localhost:3000
```

## Project Structure

```
stockbattle/
├── apps/
│   ├── api/          # NestJS backend (auth, business logic)
│   └── web/          # Next.js frontend (dashboard, auth pages)
├── packages/
│   └── shared/       # Shared types, constants, validation (Zod)
├── scripts/          # Utility scripts (waitlist export)
├── docker-compose.yml
└── .env.example
```

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS v4
- **Backend:** NestJS 10, Prisma, PostgreSQL 16, Redis 7
- **Auth:** JWT (httpOnly cookies), OTP via email
- **Monorepo:** pnpm workspaces

## Important

> StockBattle is a simulation-based evaluation platform. No real capital is deployed. All trading is simulated. Performance-based incentives are internal program rewards, not investment returns.
