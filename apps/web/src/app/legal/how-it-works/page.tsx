import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Banknote, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works — StockBattle',
  description: 'Learn how StockBattle certificate verification and payouts work.',
};

export default function HowItWorksPage() {
  return (
    <>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-[#686D7D] font-mono">Platform</p>
        <h1 className="text-3xl font-extrabold text-[#EEEFF3] tracking-tight">
          How It Works
        </h1>
        <p className="text-xs text-[#9A9FAE]">
          Understand how StockBattle ensures trustworthy certificates and reliable payouts.
        </p>
      </div>

      <div className="space-y-10 text-sm text-[#9A9FAE] leading-relaxed">
        {/* Certificate Verification */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7C6AEF]/15 border border-[#7C6AEF]/30 flex items-center justify-center">
              <ShieldCheck size={20} className="text-[#9787FF]" />
            </div>
            <h2 className="text-xl font-bold text-[#EEEFF3]">How Certificates Are Verified</h2>
          </div>

          <p>
            Every StockBattle certificate carries a <strong className="text-[#EEEFF3]">cryptographic
            signature</strong> that is unique to the trader, the challenge, and the exact
            evaluation results achieved.
          </p>

          <div className="bg-[#1B1D24] border border-[#212330] rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#EEEFF3]">What this means for you:</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#34D399] mt-0.5">✓</span>
                <span><strong className="text-[#EEEFF3]">Tamper-evident:</strong> Any alteration to the certificate data (name, results, dates) will cause verification to fail immediately.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#34D399] mt-0.5">✓</span>
                <span><strong className="text-[#EEEFF3]">Independently verifiable:</strong> Anyone — employers, trading firms, other traders — can verify the authenticity of a StockBattle certificate using our public verification page.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#34D399] mt-0.5">✓</span>
                <span><strong className="text-[#EEEFF3]">Impossible to forge:</strong> Certificates cannot be created or reproduced outside of the StockBattle platform. Each one is cryptographically bound to the original evaluation record.</span>
              </li>
            </ul>
          </div>

          <p>
            To verify a certificate, visit the unique verification link printed on the certificate
            or use the{' '}
            <Link href="/trader/certificate" className="text-[#9787FF] hover:underline inline-flex items-center gap-1">
              certificate verification page <ExternalLink size={12} />
            </Link>.
          </p>
        </section>

        {/* Payouts */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#34D399]/15 border border-[#34D399]/30 flex items-center justify-center">
              <Banknote size={20} className="text-[#34D399]" />
            </div>
            <h2 className="text-xl font-bold text-[#EEEFF3]">How Payouts Work</h2>
          </div>

          <p>
            When you pass your evaluation, you become eligible to receive a share of your
            simulated profits as a payout. Here&apos;s how the process works:
          </p>

          <div className="bg-[#1B1D24] border border-[#212330] rounded-xl p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#7C6AEF]/20 text-[#9787FF] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-bold text-[#EEEFF3] text-sm">Pass Your Evaluation</p>
                  <p className="text-xs text-[#9A9FAE]">Meet the profit target while staying within all risk limits and minimum trading day requirements.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#7C6AEF]/20 text-[#9787FF] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-bold text-[#EEEFF3] text-sm">Consistency Check</p>
                  <p className="text-xs text-[#9A9FAE]">Your trading history is checked against the consistency rule: no single day&apos;s profit may account for more than the specified threshold (e.g., 15%) of your total net profits. This ensures payouts reward disciplined, repeatable trading — not one lucky windfall.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#7C6AEF]/20 text-[#9787FF] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-bold text-[#EEEFF3] text-sm">Profit Split</p>
                  <p className="text-xs text-[#9A9FAE]">You receive the profit-sharing percentage specified for your challenge tier, applied to your net simulated profits. The exact split is shown on the challenge purchase page.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#34D399]/20 text-[#34D399] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                <div>
                  <p className="font-bold text-[#EEEFF3] text-sm">Reliable Processing</p>
                  <p className="text-xs text-[#9A9FAE]">Payout requests are processed reliably and safely, ensuring your payout is either fully completed or not processed at all — no partial or inconsistent states.</p>
                </div>
              </div>
            </div>
          </div>

          <p>
            For the full terms governing payouts, see our{' '}
            <Link href="/legal/terms" className="text-[#9787FF] hover:underline">Terms & Conditions</Link>{' '}
            and{' '}
            <Link href="/legal/risk-disclosure" className="text-[#9787FF] hover:underline">Risk Disclosure</Link>.
          </p>
        </section>
      </div>
    </>
  );
}
