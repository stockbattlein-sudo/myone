# Phase 0 — StockBattle Foundation

Build the monorepo skeleton, auth system (JWT + OTP), role separation (Admin/Trader), and a role-gated empty dashboard. This replaces the existing waitlist app entirely.

## User Review Required

> [!IMPORTANT]
> **Existing code will be replaced.** The current repo contains a simple waitlist app (Express + Vite/React). Phase 0 will restructure the entire project into a monorepo. The old `backend/` and `frontend/` directories will be removed. The git history is preserved — this is a rebuild in-place.

> [!IMPORTANT]
> **Stack deviation from brief:** The brief says "Tailwind" — I'll use **Tailwind CSS v4** (latest, released Jan 2025). If you specifically want v3, let me know.

> [!WARNING]
> **NestJS vs Express:** The brief says "NestJS preferred." I'll use NestJS with its full module/service/controller structure — this is heavier upfront but pays off massively for the challenge engine, risk engine, and admin panel in later phases. The tradeoff is Phase 0 takes longer to scaffold. Confirming this is your preference.

## Open Questions

1. **Email provider for OTP:** You have Gmail + Resend configured in the old backend. Which one should be the primary OTP sender? I'll default to **Resend** (more production-ready) and keep Gmail as a dev fallback.
2. **SMS OTP:** The brief says "stub SMS provider behind an interface." I'll create the interface with a console-logger implementation. When you're ready, what provider will you use? (Twilio, MSG91, Gupshup, etc.)
3. **Domain:** What domain will this run on? Needed for cookie config, CORS, and email sender. I'll default to `localhost` for dev.
4. **Do you want to keep the waitlist data/table?** I can add a migration that preserves it, or we can start fresh.

---

## Proposed Changes

### Monorepo Structure

The entire repo will be restructured as a **pnpm workspace** monorepo:

```
stockbattle/
├── apps/
│   ├── web/                    # Next.js 15 frontend
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   │   ├── (auth)/     # Auth pages (login, signup, verify-otp)
│   │   │   │   ├── (dashboard)/ # Role-gated dashboard shell
│   │   │   │   │   ├── trader/ # Trader dashboard
│   │   │   │   │   └── admin/  # Admin dashboard
│   │   │   │   └── layout.tsx  # Root layout with disclaimer footer
│   │   │   ├── components/     # Shared UI components
│   │   │   ├── lib/            # API client, auth helpers
│   │   │   └── styles/         # Global CSS
│   │   ├── tailwind.config.ts
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── api/                    # NestJS backend
│       ├── src/
│       │   ├── auth/           # Auth module (signup, login, OTP, JWT)
│       │   ├── users/          # User module (CRUD, roles)
│       │   ├── common/         # Guards, decorators, filters
│       │   ├── config/         # Config module (env validation)
│       │   ├── prisma/         # Prisma service module
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── prisma/
│       │   ├── schema.prisma   # DB schema
│       │   └── migrations/     # Auto-generated migrations
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types, constants, validation schemas
│       ├── src/
│       │   ├── types/          # User, Role, API response types
│       │   ├── constants/      # Legal disclaimer, role enums
│       │   └── validation/     # Zod schemas (signup, login)
│       └── package.json
│
├── docker-compose.yml          # Postgres + Redis for local dev
├── pnpm-workspace.yaml
├── package.json                # Root scripts
├── .env.example
└── .gitignore
```

---

### Component: Infrastructure & Docker

#### [NEW] docker-compose.yml
- PostgreSQL 16 container (port 5432, `stockbattle` database)
- Redis 7 container (port 6379)
- Volume mounts for data persistence across restarts
- Health checks on both services

#### [NEW] pnpm-workspace.yaml
- Defines `apps/*` and `packages/*` as workspace members

#### [NEW] .env.example
- All environment variables documented with comments
- `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `OTP_SECRET`, `EMAIL_*`, `ADMIN_EMAILS`

---

### Component: Shared Package (`packages/shared`)

#### [NEW] packages/shared/src/types/user.ts
- `Role` enum: `TRADER`, `ADMIN`
- `User` interface (id, email, name, phone, role, emailVerified, createdAt)
- API response wrapper types (`ApiResponse<T>`, `PaginatedResponse<T>`)

#### [NEW] packages/shared/src/constants/legal.ts
- `LEGAL_DISCLAIMER` constant — the verbatim footer text from the brief
- `APP_NAME = "StockBattle"`

#### [NEW] packages/shared/src/validation/auth.ts
- Zod schemas: `signupSchema`, `loginSchema`, `verifyOtpSchema`
- Shared between frontend (form validation) and backend (request validation)

---

### Component: Backend API (`apps/api`) — NestJS

#### [NEW] apps/api/prisma/schema.prisma
PostgreSQL schema with the following models:

```prisma
model User {
  id             String    @id @default(cuid())
  email          String    @unique
  phone          String?   @unique
  name           String
  passwordHash   String
  role           Role      @default(TRADER)
  emailVerified  Boolean   @default(false)
  phoneVerified  Boolean   @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  otpCodes       OtpCode[]
  refreshTokens  RefreshToken[]
}

model OtpCode {
  id        String   @id @default(cuid())
  userId    String
  code      String
  type      OtpType  // EMAIL_VERIFY, LOGIN, PASSWORD_RESET
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

enum Role {
  TRADER
  ADMIN
}

enum OtpType {
  EMAIL_VERIFY
  LOGIN
  PASSWORD_RESET
}
```

#### [NEW] apps/api/src/auth/ (Auth Module)
- **AuthController**: `POST /auth/signup`, `POST /auth/login`, `POST /auth/verify-otp`, `POST /auth/refresh`, `POST /auth/logout`
- **AuthService**:
  - Signup: create user, hash password (bcrypt), generate 6-digit OTP, send via email, return JWT pair
  - Login: validate credentials, generate OTP, send via email
  - Verify OTP: validate code + expiry, mark email verified, return fresh JWT pair
  - Refresh: validate refresh token, issue new access token
  - JWT payload: `{ sub: userId, role: Role, email: string }`
  - Access token: 15min expiry; Refresh token: 7 days
- **OtpService**: Generate, store, validate OTP codes (6 digits, 10-min expiry, single-use)
- **EmailService** (interface + Resend implementation):
  - `sendOtp(to, code)` — sends formatted OTP email
  - Console-logger fallback for dev (logs OTP to stdout)
- **SmsService** (interface + stub):
  - `sendOtp(to, code)` — logs to console, prints "SMS OTP stub: {code} → {phone}"
  - Ready for Twilio/MSG91 swap later
- **JwtStrategy**, **JwtAuthGuard**, **RolesGuard**, **@Roles()** decorator

#### [NEW] apps/api/src/users/ (Users Module)
- **UsersController**: `GET /users/me` (returns current user profile)
- **UsersService**: findById, findByEmail, create, update

#### [NEW] apps/api/src/common/
- **RolesGuard**: checks JWT role against `@Roles()` decorator
- **ApiResponse** interceptor: wraps all responses in `{ success, data, message }`
- **HttpException filter**: catches errors, returns consistent error shape
- **Validation pipe**: global Zod-based request validation

#### [NEW] apps/api/src/config/
- NestJS ConfigModule with `.env` validation via Zod
- Required vars: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- Optional vars: `RESEND_API_KEY`, `SMTP_*`, `REDIS_URL`

#### [NEW] apps/api/Dockerfile
- Multi-stage build (deps → build → production)
- Runs Prisma generate + migrate on start

---

### Component: Frontend (`apps/web`) — Next.js 15

#### [NEW] apps/web/src/app/layout.tsx
- Root layout with Inter font (Google Fonts)
- Dark theme as default (matching reference site aesthetic)
- `<DisclaimerFooter />` on every page (the verbatim legal text)
- Auth context provider

#### [NEW] apps/web/src/app/(auth)/login/page.tsx
- Email + password form
- On submit → calls `/auth/login` → redirects to OTP verification

#### [NEW] apps/web/src/app/(auth)/signup/page.tsx
- Name, email, password, confirm password form
- On submit → calls `/auth/signup` → redirects to OTP verification

#### [NEW] apps/web/src/app/(auth)/verify-otp/page.tsx
- 6-digit OTP input (individual digit boxes)
- Resend OTP button with 60s cooldown
- On success → stores JWT → redirects to dashboard

#### [NEW] apps/web/src/app/(dashboard)/layout.tsx
- Authenticated layout wrapper
- Sidebar navigation (minimal for now — just profile/logout)
- Role-based redirect: traders → `/trader`, admins → `/admin`

#### [NEW] apps/web/src/app/(dashboard)/trader/page.tsx
- Empty dashboard shell: "Welcome, {name}! Your trader dashboard is coming soon."
- Header with user info + logout button

#### [NEW] apps/web/src/app/(dashboard)/admin/page.tsx
- Empty admin shell: "Admin Panel — coming in Phase 5"
- Protected by `ADMIN` role (middleware redirect if trader)

#### [NEW] apps/web/src/lib/api.ts
- Axios instance with base URL, interceptors for JWT attach + refresh
- Auto-redirect to login on 401

#### [NEW] apps/web/src/lib/auth.tsx
- React context: `AuthProvider`, `useAuth()` hook
- Stores access/refresh tokens in httpOnly cookies (set by API) or localStorage as fallback
- `isAuthenticated`, `user`, `login()`, `logout()`, `signup()`

#### [NEW] apps/web/src/components/
- `DisclaimerFooter` — the verbatim legal disclaimer
- `OtpInput` — 6-digit code input component
- `LoadingSpinner` — shared loading state

#### [NEW] apps/web/src/middleware.ts
- Next.js middleware for route protection
- `/trader/*` → requires auth + TRADER or ADMIN role
- `/admin/*` → requires auth + ADMIN role
- Unauthenticated → redirect to `/login`

---

### Files to Remove

#### [DELETE] backend/ (entire directory)
- Old Express waitlist server — replaced by NestJS in `apps/api`

#### [DELETE] frontend/ (entire directory)
- Old Vite + React waitlist app — replaced by Next.js in `apps/web`

#### [MODIFY] .gitignore
- Update for monorepo structure (node_modules in each app, .env files, prisma generated)

#### [DELETE] DEPLOY.md
- Will be replaced with new deployment docs when relevant

---

## Verification Plan

### Automated Tests
```bash
# From repo root
pnpm install
docker compose up -d              # Start Postgres + Redis
pnpm --filter api db:migrate      # Run Prisma migrations
pnpm --filter api dev             # Start NestJS on :3001
pnpm --filter web dev             # Start Next.js on :3000
```

### Manual Verification (Acceptance Criteria)
1. **Signup**: Navigate to `/signup` → fill form → receive OTP in email (or see it in console in dev mode) → enter OTP → land on trader dashboard
2. **Login**: Navigate to `/login` → enter credentials → receive OTP → verify → land on dashboard
3. **Role gating**: A trader user visiting `/admin` gets redirected to `/trader`. An admin user (set via direct DB update for now) can access `/admin`.
4. **JWT refresh**: Access token expiry → auto-refresh via refresh token → session continues seamlessly
5. **Docker**: `docker compose up` brings up Postgres + Redis, API connects without manual DB setup
6. **Legal disclaimer**: Visible in the footer of every page

### What Will Be Stubbed
- **SMS OTP**: Console-logger only — needs a provider credential (MSG91/Twilio) to go live
- **Email OTP**: Uses Resend if `RESEND_API_KEY` is set, otherwise logs to console
- **Admin user creation**: No admin signup flow yet — admins are created by updating the `role` column directly in the DB

### What I Need From You
- **Resend API key** (or confirmation to use Gmail app password from old config) — for real OTP emails
- Confirm it's okay to **delete the old `backend/` and `frontend/`** directories
- Any preference on **pnpm vs npm vs yarn** for the monorepo (I'm defaulting to pnpm — best workspace support)
