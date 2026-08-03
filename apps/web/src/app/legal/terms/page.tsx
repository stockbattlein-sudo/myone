import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions — StockBattle',
  description: 'StockBattle platform terms of service for evaluation challenge purchases, trading simulation, and payouts.',
};

export default function TermsPage() {
  return (
    <>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-[#686D7D] font-mono">Legal</p>
        <h1 className="text-3xl font-extrabold text-[#EEEFF3] tracking-tight">
          Terms & Conditions
        </h1>
        <p className="text-xs text-[#9A9FAE]">
          Last updated: July 2026
        </p>
      </div>

      <div className="space-y-8 text-sm text-[#9A9FAE] leading-relaxed">
        {/* 1. Platform Overview */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">1. Platform Overview</h2>
          <p>
            StockBattle (&quot;the Platform&quot;) is a simulation-based trading evaluation platform. When you purchase
            a challenge, you receive access to a simulated trading environment with virtual capital.{' '}
            <strong className="text-[#F5B450]">No real capital is ever deployed on your behalf.</strong> All
            trading activity on the Platform is simulated using market-derived price feeds.
          </p>
          <p>
            Performance-based incentives (payouts) are internal program rewards issued to traders who
            successfully pass the evaluation criteria, not investment returns or profits from real trading activity.
          </p>
        </section>

        {/* 2. Challenge Purchases */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">2. Challenge Purchases</h2>
          <p>
            A challenge purchase entitles you to one evaluation attempt at the selected tier and capital
            size. Each challenge has clearly defined rules including:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-[#9A9FAE]">
            <li>A profit target (percentage of account capital) that must be reached to pass each phase</li>
            <li>A trailing intraday daily loss limit (tracks the highest equity reached during the trading day, resetting at 00:00 IST) that, if breached, results in immediate challenge failure</li>
            <li>A maximum overall drawdown limit (fixed against initial account capital) that, if breached, results in immediate challenge failure</li>
            <li>A minimum number of trading days that must elapse before the challenge can be passed</li>
          </ul>
          <p>
            All rules applicable to your challenge are displayed on the purchase page and are locked into
            your challenge record at the time of purchase. Rule parameters may vary between tiers and
            account sizes.
          </p>
        </section>

        {/* 3. Pass & Fail Criteria */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">3. Pass & Fail Criteria</h2>
          <p>
            A challenge is <strong className="text-[#34D399]">passed</strong> when the trader&apos;s virtual account
            balance reaches the profit target for the current phase while remaining within all risk limits
            and having traded for at least the minimum required number of days.
          </p>
          <p>
            A challenge is <strong className="text-[#F87171]">failed</strong> when any of the following occur:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-[#9A9FAE]">
            <li>The daily loss limit is breached (intraday unrealised + realised losses exceed the threshold)</li>
            <li>The maximum drawdown limit is breached (peak-to-trough decline exceeds the threshold)</li>
          </ul>
          <p>
            Risk limit checks are performed automatically by the platform&apos;s risk engine at regular intervals.
            The platform&apos;s determination of pass or fail is final.
          </p>
        </section>

        {/* 4. Payouts */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">4. Payouts</h2>
          <p>
            Traders who pass the evaluation and hold an active funded (Instant) account may request payouts
            of their simulated profits according to the profit-sharing percentage specified for their tier.
          </p>
          <p>
            Payouts are subject to the consistency rule: no single trading day&apos;s profit may account for
            more than the specified percentage of total net profits at payout time. This is designed to
            ensure consistent, disciplined trading rather than concentrated risk-taking.
          </p>
          <p className="text-[#F5B450] text-xs font-medium">
            [PLACEHOLDER — CONFIRM WITH FOUNDER] Payout processing timeline, minimum payout amount,
            and payout method (bank transfer / UPI / other) to be specified here.
          </p>
        </section>

        {/* 5. Account Conduct */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">5. Account Conduct</h2>
          <p>
            Each account is for individual use only. Account sharing, automated bot trading (unless
            explicitly permitted by your tier), or any attempt to exploit platform mechanics may result
            in account suspension and challenge forfeiture.
          </p>
          <p className="text-[#F5B450] text-xs font-medium">
            [PLACEHOLDER — CONFIRM WITH FOUNDER] Specific prohibited conduct list, consequences
            (temporary suspension vs permanent ban), and appeals process to be defined here.
          </p>
        </section>

        {/* 6. Intellectual Property */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">6. Intellectual Property</h2>
          <p>
            All content, branding, software, and proprietary technology on the Platform are owned by
            StockBattle. Certificates issued by the platform carry cryptographic signatures and may not
            be forged, reproduced, or misrepresented.
          </p>
        </section>

        {/* 7. Governing Law */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">7. Governing Law & Dispute Resolution</h2>
          <p className="text-[#F5B450] text-xs font-medium">
            [PLACEHOLDER — CONFIRM WITH FOUNDER] Governing jurisdiction (e.g., India — specific
            state/courts), dispute resolution mechanism (arbitration vs courts), and applicable
            regulatory framework to be specified here.
          </p>
        </section>

        {/* 8. Amendments */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">8. Amendments</h2>
          <p>
            StockBattle reserves the right to update these Terms at any time. Material changes will be
            communicated via email to registered users. Continued use of the Platform after changes
            constitutes acceptance of the updated Terms.
          </p>
        </section>
      </div>
    </>
  );
}
