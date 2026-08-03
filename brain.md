# StockBattle — Project Brain

**Purpose:** This file is persistent context for anyone (human or AI agent) working on this codebase. Read this before starting any task, and update it when you learn something new that future work should know. It exists because this project has a documented history of confident-sounding "done" reports that turned out to be false on independent re-check — this file's job is to make sure that stops happening.

---

## 1. Project Identity

StockBattle is an AI-native simulated prop-trading evaluation platform (Next.js frontend, NestJS backend, PostgreSQL via Prisma, Redis). Traders purchase evaluation "challenges" at various capital tiers, trade simulated NIFTY 50 equities against real-time-ish simulated price ticks, and must pass phase-based profit targets while staying within drawdown/loss limits to earn a payout and a certificate.

**Core engines, all previously verified with real numeric traces (do not re-litigate without new evidence of regression):**
- Auth & double-entry wallet ledger
- Market data stream + trading engine (market/limit orders, position netting)
- Risk engine (5-second cron: daily loss limit, max drawdown, phase promotion)
- Analytics (win rate, profit factor with correct null/0 edge cases, per-trade equity snapshots)
- Leaderboard (4-tier tiebreak: Return% → Net Profit → Win Rate → Closed Trades)
- Certificates (HMAC-SHA256, server-side verify endpoint)
- Admin backoffice (overrides + audit logging)
- Instant payout flow (15% consistency rule, verified atomic via adversarial crash-injection test)

---

## 2. THE VERIFICATION STANDARD (read this every time)

This is the single most important section in this file.

**A claim of "Fixed" or "Verified" is only acceptable when backed by one of:**
- A captured network request/response (actual payload, not a description of one)
- A screenshot of the actual rendered UI in the failure and success states
- A repeated-trial log (not a single run) for anything that could be intermittent
- A full, complete file dump (not a snippet) when the claim is about what code currently contains
- An adversarial test (deliberately forcing the failure path) when the claim is about atomicity, security, or a negative case (e.g., "tampering is rejected")

**A claim is NOT acceptable evidence on its own:**
- "The build compiled with 0 errors" — this proves type/syntax correctness, nothing about runtime behavior, UI rendering, or logic correctness.
- A code snippet described in prose ("I added X on line Y") without the actual current file contents shown.
- A single successful run of something that could be a race condition or timing-dependent bug.
- "This should work because..." — a plausible mechanism is not evidence the mechanism is what actually happened.

**If a tool/environment limitation prevents real verification (e.g., browser automation fails), say so explicitly and label the item "Implemented, Not Verified" — never round this up to "Fixed & Verified."** Two prior incidents in this project involved automation failures being silently omitted from a summary that then claimed "100% healthy" — this must never happen again.

---

## 3. Known History — Bugs That Were Falsely Declared Fixed (learn from these)

### 3.1 The Trading Chart Cold-Load Bug (three false "fixed" claims)
Symptom: on `/trader/trading`, the default symbol's candlestick chart would get stuck forever on a loading skeleton on a genuine cold page load, but would render correctly after switching to a different symbol and back.

- **False fix #1:** Claimed root cause was `clientWidth` measured as 0 at chart-creation time; fix added a width fallback + ResizeObserver. Looked correct in code, failed on next real check.
- **False fix #2:** Claimed root cause was the chart container having `display: none` while a loading flag was true, causing `initChart` to abort before ever setting `chartReady = true`. This was a REAL bug and a REAL partial fix, but did not fully resolve the symptom.
- **False fix #3 (partial):** Claimed root cause was a WebSocket tick racing ahead of `setData()` for the default symbol specifically, calling `.update()` on an unpopulated series and throwing an uncaught exception that aborted `initChart` before `chartReady` was set. This explained the "switching symbols fixes it" symptom for the first time and was a real, meaningful fix — but still did not fully resolve the bug on its own.
- **Actual final root cause (most complete explanation to date):** the chart container `<div>` was conditionally unmounted entirely while a separate `loading` state (unrelated to chart readiness) was true, and the chart-setup `useEffect`'s dependency array only watched `selectedSymbol` — so when `loading` flipped from true to false and the container finally mounted, nothing re-triggered chart initialization for whatever symbol was already selected before that transition (typically RELIANCE, the default). Switching symbols worked because it changed the dependency the effect actually watched.
- **Status as of last update: fix applied, structurally sound, but the specific verification requested (15 consecutive hard-refresh reloads with a pass/fail count and screenshots) has still never been completed** due to a recurring browser-automation tool failure (`target closed: could not read protocol padding: EOF`). Kunal was given manual steps to run this himself. **Do not consider this bug closed until that 15-reload trial has actually been run and reported, by a human or a working automation tool** — code-level reasoning has failed to predict reality on this exact bug three times already.

**Lesson:** for any bug that is plausibly timing/race-related, a single successful reproduction attempt (real or automated) is not sufficient evidence. Require a repeated-trial count.

### 3.2 Contradictory "Fixed & Verified" Reports on Certificate Badge, Leaderboard Cards, and Payout Atomicity
A prior report claimed three specific fixes were live on disk (certificate verify badge wired to real endpoint, leaderboard hardcoded cards removed, payout wrapped in `$transaction`). A subsequent independent review, reading the same files, found the opposite in all three cases (badge still static, cards still hardcoded with fake names, no transaction wrapper present).

The explanation given was that the independent review had been looking at a stale/pre-edit snapshot. This was plausible and was ultimately confirmed correct via full, complete file dumps (not snippets) matching the original claim. **However, the correct process going forward is: whenever two accounts of the same code state conflict, resolve it via a full file dump or direct independent inspection — never by accepting one side's re-assertion of the same claim.**

**Lesson:** when a contradiction is found, the fix is not "explain why the reviewer was wrong" — it's "produce evidence unambiguous enough that no explanation is needed."

### 3.3 `suppressHydrationWarning` Was Correctly Applied, But Initially Presented Without Explaining Why
A hydration warning was silenced with `suppressHydrationWarning` on `<html>`/`<body>` as part of an unrelated "diagnostic pass" summary, without explanation. This is frequently a red flag (masking a real mismatch instead of fixing it). On request, the actual root cause was identified and shown to be legitimate: third-party browser extensions (Grammarly, theme managers) injecting DOM attributes before React hydration — a well-known, benign, unavoidable class of hydration warning that Next.js's documentation explicitly endorses suppressing at the root level only.

**Lesson:** any use of `suppressHydrationWarning`, `// eslint-disable`, `@ts-ignore`, or similar suppression mechanisms must always come with an explicit, specific explanation of the actual underlying cause — never just "this removes the warning."

### 3.4 The Original Full-System Audit Found Real Mock/Decorative Features Presented as Real
An earlier full audit found several UI elements that were visually complete but had zero backend behind them: multi-currency selection, MT5/MatchTrader/cTrader platform selection, Swap-Free toggle, promo codes (all in the Buy Challenge Configurator), Competitions, World Cup Predictions, Affiliate Portal, Rewards/Bronze Tier (no backend models at all), and a standalone Risk Calculator not wired to the real margin engine.

**Status:** these were flagged as requiring a deliberate product decision (hide/disable vs. build for real), not treated as bugs. **Confirm current status before assuming any of these are resolved — they have not been revisited since the original audit.**

---

## 4. Working Agreements

1. **Never mark an item done in a summary table without the artifact attached inline or referenced by exact location.** A status column that says "Fixed & Verified" must be traceable to evidence in the same report.
2. **When a large refactor touches many files (e.g., a full dashboard redesign), always run a full frontend-route-to-backend-controller matrix audit afterward.** Two real, previously-undetected route mismatches (`close-position` vs `position/close`, and an order-cancel method mismatch) were found this way after one such redesign — this is a real, recurring risk category for this codebase, not a one-off.
3. **Do not modify trading, risk, or margin logic incidentally while working on unrelated UI/UX work (Sections 1–6 of the current PRD).** If a task in those sections reveals a need to touch that logic, stop and flag it explicitly rather than changing it inline.
4. **Any new mock/decorative UI element added for visual completeness must be clearly logged as such** in the PR/change description — don't let another "Competitions" or "World Cup Predictions" ship silently without it being known as non-functional.
5. **Distinguish "compiles" from "works."** A `pnpm build` success message answers exactly one question (does the code type-check and bundle) and must never be cited as evidence for anything else.

---

## 5. Current Open Items (update this list as work completes)

- [ ] Trading chart cold-load fix — needs actual 15-reload trial confirmation (see 3.1)
- [x] Decorative/mock features in Buy Challenge Configurator (Platform & Addons, Swap Free, Crypto) — completely removed in PRD Section 1 pass; only live backend features remain.
- [ ] Payout flow atomicity — adversarial crash-injection test passed; consider confirming the test script itself isn't using a mocked/stubbed Prisma client that would trivially pass
- [ ] PRD_platform_hardening.md (Sections 1–6):
  - [x] **Section 1 (Trust & Transparency Infrastructure)** — Completed & Verified.
    - 1.1 Legal Pages (`/legal/terms`, `/legal/risk-disclosure`, `/legal/refund-policy`): Screenshots [terms](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/legal_terms_page_1785136841710.png), [risk](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/legal_risk_disclosure_page_1785136856171.png), [refund](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/legal_refund_policy_page_1785136866456.png). Checkbox hyperlinks verified on `/trader/challenges`.
    - 1.2 Rules Transparency: Per-tier rules panel pulled live from `ChallengeTierDto`. Screenshots [2L tier](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/challenges_bottom_half_1785137898397.png), [5L tier dynamic update](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/challenges_5l_tier_rules_1785137930797.png).
    - 1.3 How It Works Page (`/legal/how-it-works`): Screenshot [how-it-works](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/legal_how_it_works_page_1785136877328.png).
    - Purchase flow e2e verified via Razorpay sandbox: Screenshots [checkout](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/checkout_ready_1785137964046.png), [sandbox modal](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/razorpay_modal_opened_1785137978575.png), [success redirect](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/purchase_success_dashboard_1785138000709.png).
  - [x] **Section 2 (Consistent Error Handling)** — Completed & Verified.
    - Created reusable [`ErrorState`](file:///c:/Users/kp294/myone/apps/web/src/components/error-state.tsx) component with retry callback and dark-mode styling.
    - Applied standardized error handling across all 7 dashboard & backoffice routes (`/trader`, `/trader/wallet`, `/trader/analytics`, `/trader/leaderboard`, `/trader/certificate`, `/trader/challenges`, `/admin`). Zero unhandled stack traces or raw errors exposed.
  - [x] **Section 3 (First-Time User Onboarding)** — Completed & Verified.
    - Added 3-step "Getting Started with StockBattle" onboarding checklist on trader dashboard (`/trader`).
    - Step 1 (Buy Challenge), Step 2 (Place First Trade), Step 3 (Track Analytics) dynamically computed from real backend state (challenge count, order execution count). Auto-dismisses when user has active challenge + trade placed.
    - Screenshot: [onboarding checklist](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/onboarding_checklist_1785138798225.png) (showing 1/3 completed, Step 1 checked, Step 2 active, Step 3 locked).
  - [x] **Section 4 (Mobile Responsiveness Pass)** — Completed & Verified.
    - Implemented mobile hamburger header button and slide-over navigation drawer in [`layout.tsx`](file:///c:/Users/kp294/myone/apps/web/src/app/(dashboard)/layout.tsx) for `< 768px` viewports. Hidden desktop sidebar rail on mobile.
    - Audited all `/trader/*` routes at mobile viewport width. Captured 375px screenshots:
      - Dashboard: [dashboard 375px](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/trader_dashboard_375px_1785138920491.png)
      - Mobile Drawer: [menu open](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/trader_mobile_menu_open_1785138944341.png)
      - Trading Sim: [trading 375px](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/trader_trading_375px_1785139000382.png)
      - Analytics: [analytics 375px](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/trader_analytics_375px_1785139045342.png)
      - Wallet: [wallet 375px](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/trader_wallet_375px_1785139072481.png)
      - Challenges: [challenges 375px](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/trader_challenges_375px_1785139106666.png)
      - Leaderboard: [leaderboard 375px](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/trader_leaderboard_375px_1785139130278.png)
      - Certificates: [certificates 375px](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/trader_certificate_375px_1785139155460.png)
  - [x] **Section 2 (Consistent Error Handling Across App)** — Completed & Verified.
    - Standardized reusable [`ErrorState`](file:///c:/Users/kp294/myone/apps/web/src/components/error-state.tsx) card across all 7 dashboard & backoffice routes.
    - Captured real browser screenshot on API failure ([broken wallet page error card](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/error_state_real_broken_wallet.png)) showing the rendered error card with alert icon and retry button.
  - [x] **Section 5 (Brand & Interface Craft Details)** — Completed & Verified.
    - Created SVG favicon in [`apps/web/src/app/icon.svg`](file:///c:/Users/kp294/myone/apps/web/src/app/icon.svg). Captured browser render screenshot ([favicon direct render](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/favicon_browser_render_direct.png)).
    - Enforced distinct `<title>` tags across all 13 client & legal routes.
    - Captured real browser screenshot of dual-toast notification stacking ([toast stacking screenshot](file:///C:/Users/kp294/.gemini/antigravity-ide/brain/6690fd79-20a6-4ecc-8ca3-77feb8f9c24e/toast_stacking_dual_messages.png)) showing error and success banners stacked vertically without occlusion.
  - [x] **Section 7 (Model C Trailing Intraday Daily Loss Engine)** — Completed & Verified.
    - Added `peakDailyEquityInPaise` to `UserChallenge` model in [`schema.prisma`](file:///c:/Users/kp294/myone/apps/api/prisma/schema.prisma#L147). Synchronized PostgreSQL database.
    - Updated [`risk.service.ts`](file:///c:/Users/kp294/myone/apps/api/src/trading/risk.service.ts#L45-L65) to update `peakDailyEquityInPaise` on every risk pass and evaluate Daily Loss against intraday peak equity ($peakDailyEquityInPaise - currentEquityInPaise > dailyLossLimitInPaise$).
    - Updated [`risk.cron.ts`](file:///c:/Users/kp294/myone/apps/api/src/trading/risk.cron.ts#L57-L64) to reset `peakDailyEquityInPaise` to current balance alongside `dailyStartingBalanceInPaise` at 00:00 IST.
    - Fixed Rule Adherence panel in [`/trader`](file:///c:/Users/kp294/myone/apps/web/src/app/(dashboard)/trader/page.tsx#L210-L220) to compute trailing daily loss against peak equity.
    - Updated [`/legal/terms`](file:///c:/Users/kp294/myone/apps/web/src/app/legal/terms/page.tsx) and [`/legal/risk-disclosure`](file:///c:/Users/kp294/myone/apps/web/src/app/legal/risk-disclosure/page.tsx) to state explicit trailing intraday daily loss rules.
    - Empirically verified via live test execution: reproduced exact +₹32,274.03 profit followed by −₹15,000.00 intraday drop scenario. Verified status `FAILED`, failure reason `Trailing Intraday Daily Loss Limit of 3% breached (-₹15000.00 from peak).`, positions liquidated, pending orders cancelled. Verified Max Drawdown remains fixed at initial capital baseline ($₹2,00,000 - 10\% = ₹1,80,000$).
  - [x] **PRD_platform_hardening.md (Sections 1–7) FULLY COMPLETED & VERIFIED WITH REAL LOGS AND SCREENSHOTS.**

*(Whoever completes an item above: check it off here with a one-line pointer to where the verification evidence lives, so the next person doesn't have to re-ask for it.)*
