# StockBattle — Platform Professionalization PRD

**Purpose of this document:** This is a requirements document for a scoped body of work — NOT bug fixes, NOT new trading features. Everything in this PRD is about closing the gap between "functionally correct" and "feels like a trustworthy, professional platform a trader would put real money into." Every feature already built (auth, wallet, trading engine, risk engine, analytics, leaderboard, certificates, admin) has already been verified with numeric traces and is considered stable. Do not modify trading/risk/margin logic as part of this work unless a section below explicitly says to.

**Ground rules for whoever executes this PRD:**
1. Every claim of "done" must be backed by an artifact: a screenshot, a captured network request/response, a repeated-test log, or a full file dump — never a prose description of what the code "should" do. This project has a documented history of confidently-worded "Fixed & Verified" reports that turned out to be wrong on live re-check (see `brain.md` for details). That pattern does not repeat here.
2. If something can't be verified in this environment (e.g., no browser automation available), say so explicitly and label it "Implemented, Not Verified" — do not round up to "Verified."
3. Work section by section. Do not skip ahead and summarize before finishing a section's verification.
4. If a requirement is ambiguous, state the assumption you're making and proceed — do not silently guess.

---

## Section 1 — Trust & Transparency Infrastructure

### 1.1 Terms & Conditions / Risk Disclosure / Refund Policy Pages

**Why this matters:** StockBattle sells paid evaluations with pass/fail outcomes and real payouts. Without visible legal/policy pages, the platform has no documented basis for how disputes, refunds, or failures are handled — this is a baseline requirement before real users pay real money, not a cosmetic nice-to-have.

**Requirements:**
- Create three new static pages: `/legal/terms`, `/legal/risk-disclosure`, `/legal/refund-policy`.
- Each page must be reachable from the site footer (create a footer if one doesn't exist) and from the Buy Challenge Configurator checkout flow (a checkbox: "I have read and agree to the Terms, Risk Disclosure, and Refund Policy" — required before the "Place Order" / purchase button becomes clickable).
- Content should cover, at minimum:
  - **Terms:** what a challenge purchase entitles the buyer to, what constitutes a pass/fail, that this is a simulated evaluation (not real capital trading, unless that's factually incorrect — confirm actual product positioning before writing this).
  - **Risk Disclosure:** that evaluation results and simulated trading do not guarantee real trading performance; that payouts are contingent on passing the consistency rule and other stated conditions.
  - **Refund Policy:** whether challenge purchases are refundable, under what conditions (e.g., before first trade placed vs. after), and the process to request one.
- Do NOT invent specific legal terms, refund percentages, or jurisdiction-specific clauses without confirming them with Kunal first — draft placeholder content clearly marked `[PLACEHOLDER — CONFIRM WITH FOUNDER]` for anything that constitutes an actual business/legal decision (refund %, governing jurisdiction, dispute resolution process). Do not present invented legal terms as final.

**Verification required:** Screenshot of all three pages rendering, screenshot of the required checkbox blocking purchase until checked, and a list of every `[PLACEHOLDER]` tag left in the content for Kunal's review.

### 1.2 Per-Tier Rules Transparency Page

**Why this matters:** A trader should be able to see every rule that can fail their challenge — daily loss %, max drawdown %, profit target %, minimum trading days — in plain language, before purchasing. Right now these values exist in the backend (`ChallengeTier` model) but are not fully surfaced to a prospective buyer in one clear place.

**Requirements:**
- Add a "Rules" tab or expandable section to the Buy Challenge Configurator (`/trader/challenges`) that, for the currently selected tier/capital size combination, displays:
  - Daily Loss Limit (%)
  - Max Drawdown Limit (%)
  - Profit Target (%) per phase
  - Minimum Trading Days (if any)
  - Consistency Rule threshold (the 15% figure used in payout logic) and a one-sentence plain-English explanation of what it means ("no single day's profit may account for more than 15% of your total profit at payout time").
  - Profit split percentage on payout.
- Pull every one of these values live from the actual `ChallengeTier` record for the selected configuration — do not hardcode them in the frontend, since if the backend values ever change, a hardcoded rules page would silently become false advertising.

**Verification required:** Screenshot showing the rules panel for at least two different tier configurations with visibly different numbers, and confirmation (via API response inspection) that the displayed numbers match the actual `ChallengeTier` row used to create that challenge.

### 1.3 "How It Works" — Payouts & Certificate Verification

**Why this matters:** You've built real HMAC certificate verification and a real consistency-rule payout engine — this section is about making that credibility *visible*, not about building anything new.

**Requirements:**
- A single static page (`/how-it-works` or similar) with two short sections:
  - **"How Certificates Are Verified"** — plain-language explanation that every certificate carries a cryptographic signature that can be independently verified, with a link to the public verify page. Do not explain the HMAC algorithm's implementation details or secret-handling in a way that could aid forgery — describe the guarantee ("tamper-evident," "independently verifiable"), not the mechanism internals.
  - **"How Payouts Work"** — plain-language explanation of the profit split, the consistency rule, and that payouts are processed atomically (safe language: "processed reliably and safely," not "we use database transactions" — that's an implementation detail, not user-facing copy).
- This is a copywriting + static page task, not a code change to any verification or payout logic.

**Verification required:** Screenshot of the final page.

---

## Section 2 — Consistent Error Handling Across the Entire App

**Why this matters:** The trading, analytics, certificate, and leaderboard pages have all been specifically hardened after real bugs surfaced. Other pages (Wallet, Buy Challenge Configurator, Admin Backoffice, user Settings if it exists) have not been through the same scrutiny and may still fail silently.

**Requirements:**
1. For every page under `/trader/*` and `/admin/*`, audit what happens when its primary API call fails (simulate this by temporarily pointing to a wrong endpoint or stopping the backend briefly):
   - Does the page show a clear, human-readable error message, or does it show a blank screen / stuck spinner / raw stack trace?
   - Is there a retry mechanism, or does the user have to manually refresh?
2. Standardize on one reusable error-state component (banner or inline message with an icon, consistent with the existing red/amber toast styling already used elsewhere) and apply it everywhere a data fetch can fail.
3. Confirm no page ever surfaces a raw error object, a stack trace, or an unhandled promise rejection to the end user in the browser console-visible UI.

**Verification required:** A table — one row per page — showing: Page | Simulated Failure Method | Resulting UI Behavior (Before) | Resulting UI Behavior (After) | Screenshot reference.

---

## Section 3 — First-Time User Onboarding

**Why this matters:** A brand-new user landing on an empty dashboard with zero challenges and zero trades is a common point where platforms lose new users through confusion, not through any actual defect.

**Requirements:**
- On `/trader` (the main dashboard), detect a user with zero challenges ever purchased, and show a distinct "Getting Started" empty state instead of (or in addition to) the normal dashboard cards, with three sequential steps:
  1. "Buy your first evaluation challenge" → links to `/trader/challenges`
  2. "Place your first trade in the Trading Sim" → links to `/trader/trading` (this step should visually indicate it's locked/greyed until step 1 is done, if no active challenge exists yet)
  3. "Track your progress in Analytics" → links to `/trader/analytics`
- Each step should show a checkmark once completed, computed from real backend state (has a challenge been purchased, has at least one order been placed) — not simulated or hardcoded as always-incomplete.
- This checklist should disappear automatically once the user has an active challenge and has placed at least one trade (do not keep nagging returning users).

**Verification required:** Screenshot of the onboarding checklist for a genuinely fresh test account with zero challenges, and a second screenshot after that same account buys a challenge and places one trade, showing the checklist correctly updating or disappearing.

---

## Section 4 — Mobile Responsiveness Pass

**Why this matters:** Everything verified in this project so far has been on a desktop browser. If any real user checks the platform on a phone, an unresponsive layout is often the single biggest "this feels unfinished" signal — more damaging to perceived professionalism than any single missing feature.

**Requirements:**
- Audit every route under `/trader/*` at a mobile viewport width (375px and 414px, representing common phone sizes) and identify any of the following: horizontal scroll/overflow, unreadable/overlapping text, buttons or inputs too small to tap reliably, the sidebar failing to collapse into a usable mobile nav pattern (hamburger menu or bottom nav).
- Priority order for fixing, if full responsiveness isn't feasible in one pass: (1) Dashboard, (2) Trading Sim, (3) Analytics, (4) Wallet, (5) everything else.
- The sidebar specifically must collapse to a hamburger/drawer pattern below a reasonable breakpoint (e.g., 768px) rather than staying permanently expanded and eating screen width.

**Verification required:** Screenshots at 375px width for every `/trader/*` route, before and after fixes, specifically calling out anything that remains broken and is being deliberately deferred.

---

## Section 5 — Brand & Interface Craft Details

**Why this matters:** These are individually small, but they compound into whether the product feels finished.

**Requirements:**
1. **Favicon & page titles:** Confirm a real StockBattle favicon exists and is applied (not the default Next.js icon). Confirm every route under `/trader/*` and `/admin/*` sets a distinct, correct `<title>` (e.g., "Analytics — StockBattle", not a generic default repeated everywhere).
2. **Loading state consistency:** Audit every page's loading state (initial data fetch, before content renders). The Trading Sim page already has a good custom skeleton pattern — apply an equivalent quality bar (not necessarily identical visuals, but not a bare generic spinner either) to Wallet, Leaderboard, Admin, and Challenges pages if they currently just show a plain spinner.
3. **Toast/notification stacking behavior:** Verify what happens when two notifications fire close together (e.g., an order fills at the same moment a risk breach triggers, or a success toast and an error toast overlap). Confirm they stack cleanly (e.g., vertically offset) rather than overlapping illegibly or one instantly replacing the other before it's readable.

**Verification required:** Screenshot of the real favicon in a browser tab, a list of page titles captured from each route, and a screenshot demonstrating two toasts stacking correctly when triggered close together.

---

## Section 6 — Security-Adjacent Professionalism

**Why this matters:** This platform handles authentication, OTPs, and monetary transactions (even simulated). Baseline account-security UX signals matter for perceived (and actual) legitimacy.

**Requirements:**
1. **Confirm rate-limiting is actually applied to auth endpoints specifically**, not just generally present in the codebase. Trace: is `ThrottlerModule` (or equivalent) actually guarding `/api/auth/login`, `/api/auth/verify-otp`, and `/api/auth/resend-otp` specifically? Test by making rapid repeated requests to `/api/auth/login` with a wrong password and confirming a 429 (Too Many Requests) eventually returns, with the actual threshold and window observed and reported.
2. **Session/device visibility:** At minimum, add a "Log out" that clearly invalidates the current session server-side (confirm the JWT/refresh token is actually invalidated on logout, not just cleared client-side — test by logging out, then trying to reuse the old token directly against the API and confirming it's rejected).
3. Do not implement full multi-device session management unless explicitly asked later — this section is about confirming the baseline (rate limiting works, logout actually invalidates server-side) is real, not building a full security dashboard.

**Verification required:** A captured trace of the rate-limit test (showing the exact request count before a 429 appears), and a captured trace showing a logged-out token being rejected by the API when reused.

---

## Definition of Done for This PRD

This PRD is complete when every "Verification required" line above has a corresponding artifact attached to the final report — not a description of what was built, but the screenshot, trace, or log itself. Any item that could not be verified (tooling limitation, environment limitation) must be explicitly labeled "Implemented, Not Verified" with the specific blocker named, never silently omitted or rounded up to "Done."
