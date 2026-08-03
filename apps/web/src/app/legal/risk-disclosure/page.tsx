import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Risk Disclosure — StockBattle',
  description: 'Important risk disclosures for StockBattle simulated trading evaluation participants.',
};

export default function RiskDisclosurePage() {
  return (
    <>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-[#686D7D] font-mono">Legal</p>
        <h1 className="text-3xl font-extrabold text-[#EEEFF3] tracking-tight">
          Risk Disclosure
        </h1>
        <p className="text-xs text-[#9A9FAE]">
          Last updated: July 2026
        </p>
      </div>

      <div className="space-y-8 text-sm text-[#9A9FAE] leading-relaxed">
        {/* Important Notice */}
        <section className="bg-[#F87171]/10 border border-[#F87171]/20 rounded-xl p-4 space-y-2">
          <p className="text-[#F87171] font-bold text-sm">⚠ Important Notice</p>
          <p>
            Please read this disclosure carefully before purchasing any evaluation challenge on
            StockBattle. By proceeding with a purchase, you acknowledge that you have read, understood,
            and accepted the risks described below.
          </p>
        </section>

        {/* 1. Simulated Trading Environment */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">1. Simulated Trading Environment</h2>
          <p>
            All trading on StockBattle occurs in a <strong className="text-[#EEEFF3]">simulated environment</strong>.
            Price feeds are derived from real-market data but execution conditions (fills, slippage,
            latency) may differ from live market conditions. Your performance on the platform does not
            guarantee, predict, or represent potential results in real capital markets.
          </p>
        </section>

        {/* 2. Evaluation Outcomes */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">2. Evaluation Outcomes Are Not Guaranteed</h2>
          <p>
            Purchasing a challenge does not guarantee passage of the evaluation. The majority of traders
            do not pass on their first attempt. Challenge fees are the cost of accessing the evaluation
            environment and are not refundable solely because the evaluation was not passed (see our{' '}
            <a href="/legal/refund-policy" className="text-[#9787FF] hover:underline">Refund Policy</a>{' '}
            for specific refund conditions).
          </p>
        </section>

        {/* 3. Payouts */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">3. Payout Conditions</h2>
          <p>
            Payouts are performance-based program rewards, contingent on meeting all of the following
            conditions:
          </p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Successfully passing the evaluation phase(s) for your challenge tier</li>
            <li>Maintaining compliance with all risk limits (trailing intraday daily loss limit tracking session peak equity, and fixed overall maximum drawdown)</li>
            <li>Meeting the consistency rule — no single trading day&apos;s profit may account for more than the stated threshold (typically 15%) of your total net profit at the time of payout</li>
            <li>Trading for at least the minimum required number of days</li>
          </ul>
          <p>
            Payouts represent the profit-sharing percentage specified for your tier applied to your
            net simulated profits. They are <strong className="text-[#EEEFF3]">not investment returns</strong> and
            should not be treated as such.
          </p>
        </section>

        {/* 4. Financial Risk */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">4. Financial Risk of Challenge Purchases</h2>
          <p>
            The purchase price of a challenge is the only real financial exposure you have to StockBattle.
            No additional margin calls, account top-ups, or further payments are required. However, you
            should only purchase challenges with funds you can afford to lose, as evaluation failure means
            the challenge fee may not be refundable.
          </p>
        </section>

        {/* 5. Market Data */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">5. Market Data & Price Feeds</h2>
          <p>
            Simulated price data on the Platform is derived from publicly available market data for
            NIFTY 50 equities. While we strive for accuracy, the Platform does not guarantee real-time
            data accuracy or continuity. Temporary data disruptions do not constitute grounds for
            reversing evaluation outcomes unless a verifiable platform-side error affected the outcome.
          </p>
          <p className="text-[#F5B450] text-xs font-medium">
            [PLACEHOLDER — CONFIRM WITH FOUNDER] Policy for handling disputes where a trader claims a
            platform data error caused a failure — investigation process, evidence standards, and
            remedy (refund vs. challenge reset) to be defined here.
          </p>
        </section>

        {/* 6. No Financial Advice */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">6. No Financial Advice</h2>
          <p>
            Nothing on the Platform constitutes financial advice, investment advice, or a recommendation
            to trade. StockBattle is an evaluation and skill-assessment platform. Users are solely
            responsible for their trading decisions within the simulated environment.
          </p>
        </section>
      </div>
    </>
  );
}
