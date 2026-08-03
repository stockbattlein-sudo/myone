import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Legal pages layout — centered, readable, publicly accessible (no auth required).
 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#14151A] text-[#EEEFF3] font-sans">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        {/* Back nav */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#9787FF] hover:underline font-semibold"
          >
            <ArrowLeft size={14} />
            Back to StockBattle
          </Link>
        </div>

        {/* Content */}
        <article className="prose-invert space-y-6">
          {children}
        </article>

        {/* Legal footer nav */}
        <div className="mt-16 pt-6 border-t border-[#212330]">
          <div className="flex flex-wrap gap-4 text-xs text-[#686D7D]">
            <Link href="/legal/terms" className="hover:text-[#9787FF] transition-colors">Terms & Conditions</Link>
            <Link href="/legal/risk-disclosure" className="hover:text-[#9787FF] transition-colors">Risk Disclosure</Link>
            <Link href="/legal/refund-policy" className="hover:text-[#9787FF] transition-colors">Refund Policy</Link>
            <Link href="/legal/how-it-works" className="hover:text-[#9787FF] transition-colors">How It Works</Link>
          </div>
          <p className="text-xs text-[#686D7D] mt-3 opacity-60">
            © {new Date().getFullYear()} StockBattle. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
