import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy — StockBattle',
  description: 'StockBattle refund policy for evaluation challenge purchases.',
};

export default function RefundPolicyPage() {
  return (
    <>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-[#686D7D] font-mono">Legal</p>
        <h1 className="text-3xl font-extrabold text-[#EEEFF3] tracking-tight">
          Refund Policy
        </h1>
        <p className="text-xs text-[#9A9FAE]">
          Last updated: July 2026
        </p>
      </div>

      <div className="space-y-8 text-sm text-[#9A9FAE] leading-relaxed">
        {/* Overview */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">1. Overview</h2>
          <p>
            This policy governs refunds for evaluation challenge purchases made on StockBattle.
            We want every trader to feel confident in their purchase, and we aim to be transparent
            about what is and isn&apos;t eligible for a refund.
          </p>
        </section>

        {/* Eligibility */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">2. Refund Eligibility</h2>

          <div className="bg-[#34D399]/10 border border-[#34D399]/20 rounded-xl p-4 space-y-2">
            <p className="text-[#34D399] font-bold text-sm">✓ Eligible for Refund</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>
                The challenge was purchased but <strong className="text-[#EEEFF3]">no trades have been placed</strong> yet
                — i.e., you purchased the challenge but have not begun trading
              </li>
              <li>
                A verified platform-side technical error prevented normal evaluation
                (e.g., confirmed data feed failure, system outage affecting your account)
              </li>
            </ul>
            <p className="text-[#F5B450] text-xs font-medium mt-2">
              [PLACEHOLDER — CONFIRM WITH FOUNDER] Refund timeframe window (e.g., within 48 hours of
              purchase? within 7 days?) and refund percentage (100%? Less processing fees?) to be
              specified here.
            </p>
          </div>

          <div className="bg-[#F87171]/10 border border-[#F87171]/20 rounded-xl p-4 space-y-2">
            <p className="text-[#F87171] font-bold text-sm">✗ Not Eligible for Refund</p>
            <ul className="list-disc list-inside space-y-1.5">
              <li>
                The evaluation has already been started (at least one trade placed), regardless of outcome
              </li>
              <li>
                The challenge was failed due to breaching risk limits (daily loss limit or max drawdown)
              </li>
              <li>
                The trader simply changed their mind after beginning the evaluation
              </li>
              <li>
                The trader&apos;s account was suspended for violation of Terms & Conditions
              </li>
            </ul>
          </div>
        </section>

        {/* Process */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">3. How to Request a Refund</h2>
          <p>
            To request a refund, contact our support team with the following information:
          </p>
          <ul className="list-disc list-inside space-y-1.5">
            <li>Your registered email address</li>
            <li>The challenge ID or order reference number</li>
            <li>Reason for the refund request</li>
          </ul>
          <p className="text-[#F5B450] text-xs font-medium">
            [PLACEHOLDER — CONFIRM WITH FOUNDER] Support contact method (email address? In-app form?),
            expected response time, and refund processing timeline (e.g., 5-7 business days) to be
            specified here.
          </p>
        </section>

        {/* Processing */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">4. Refund Processing</h2>
          <p>
            Approved refunds will be credited back to the original payment method used at the time
            of purchase. Processing times may vary depending on your payment provider.
          </p>
          <p className="text-[#F5B450] text-xs font-medium">
            [PLACEHOLDER — CONFIRM WITH FOUNDER] Whether processing fees are deducted from refunds,
            and whether wallet credits are offered as an alternative to payment reversal, to be
            specified here.
          </p>
        </section>

        {/* Exceptions */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#EEEFF3]">5. Promotional Purchases & Exceptions</h2>
          <p>
            Challenges purchased with promotional discounts or coupon codes are subject to the same
            refund policy. If approved, the refund amount will be the actual amount paid (after discount),
            not the original price.
          </p>
          <p className="text-[#F5B450] text-xs font-medium">
            [PLACEHOLDER — CONFIRM WITH FOUNDER] Whether any challenge tiers or promotional offers are
            explicitly non-refundable to be specified here.
          </p>
        </section>
      </div>
    </>
  );
}
