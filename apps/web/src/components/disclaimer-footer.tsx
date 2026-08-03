import Link from 'next/link';
import { LEGAL_DISCLAIMER } from '@stockbattle/shared';

/**
 * Legal disclaimer footer — required on every public page.
 * Text is sourced from the shared constants package.
 * Includes links to all legal/policy pages.
 */
export function DisclaimerFooter() {
  return (
    <footer className="w-full border-t border-border-default py-6 px-4">
      <div className="mx-auto max-w-4xl text-center">
        <div className="flex flex-wrap justify-center gap-4 mb-4 text-xs">
          <Link href="/legal/terms" className="text-text-muted hover:text-text-primary transition-colors underline-offset-2 hover:underline">
            Terms & Conditions
          </Link>
          <Link href="/legal/risk-disclosure" className="text-text-muted hover:text-text-primary transition-colors underline-offset-2 hover:underline">
            Risk Disclosure
          </Link>
          <Link href="/legal/refund-policy" className="text-text-muted hover:text-text-primary transition-colors underline-offset-2 hover:underline">
            Refund Policy
          </Link>
          <Link href="/legal/how-it-works" className="text-text-muted hover:text-text-primary transition-colors underline-offset-2 hover:underline">
            How It Works
          </Link>
        </div>
        <p className="text-text-muted text-xs leading-relaxed">
          {LEGAL_DISCLAIMER}
        </p>
        <p className="text-text-muted text-xs mt-2 opacity-60">
          © {new Date().getFullYear()} StockBattle. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
