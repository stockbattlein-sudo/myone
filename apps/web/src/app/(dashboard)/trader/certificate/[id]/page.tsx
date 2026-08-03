'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/loading-spinner';
import Link from 'next/link';
import { ArrowLeft, Printer, ShieldCheck, Award } from 'lucide-react';

interface CertificatePayload {
  certificateId: string;
  challengeId: string;
  traderName: string;
  traderEmail: string;
  tierName: string;
  tierType: string;
  accountSizeInPaise: number;
  virtualBalanceInPaise: number;
  netProfitInPaise: number;
  passedAt: string;
  hmacSignature: string;
  verificationUrl: string;
}

export default function CertificatePage() {
  const params = useParams();
  const challengeId = params.id as string;

  const [cert, setCert] = useState<CertificatePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchCert = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/api/trading/certificate/challenge/${challengeId}`);
        setCert(data.certificate);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Certificate not available or evaluation not passed yet');
      } finally {
        setLoading(false);
      }
    };
    if (challengeId) fetchCert();
  }, [challengeId]);

  // Call the public verification endpoint to confirm HMAC authenticity
  useEffect(() => {
    if (!challengeId || !cert) return;
    const verifyCert = async () => {
      try {
        const { data } = await api.get(`/api/trading/certificate/verify/${challengeId}`);
        setVerified(data.valid === true);
      } catch {
        setVerified(false);
      }
    };
    verifyCert();
  }, [challengeId, cert]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header controls */}
      <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-4 flex items-center justify-between shadow-lg print:hidden">
        <Link
          href="/trader"
          className="text-xs text-[#9787FF] hover:underline flex items-center gap-1 font-semibold"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-[#F5B450] hover:bg-[#d99b38] text-black font-bold rounded-xl text-xs transition-colors flex items-center gap-2"
        >
          <Printer size={15} /> Save / Print PDF Certificate
        </button>
      </div>

      {error && (
        <div className="p-6 rounded-2xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-center font-medium text-xs">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner size="lg" />
        </div>
      ) : cert ? (
        /* Printable Gold Certificate Template */
        <div className="relative bg-[#1B1D24] text-[#EEEFF3] p-10 md:p-14 rounded-3xl border-4 border-[#F5B450]/40 shadow-2xl overflow-hidden font-sans print:border-8 print:p-8 print:shadow-none">
          {/* Inner Frame */}
          <div className="absolute inset-3 border-2 border-[#F5B450]/20 rounded-2xl pointer-events-none" />

          {/* Certificate Header */}
          <div className="text-center space-y-3 relative z-10">
            <div className="flex justify-center items-center gap-2">
              <Award size={28} className="text-[#F5B450]" />
              <span className="text-sm font-extrabold uppercase tracking-widest text-[#34D399]">
                StockBattle Trading Evaluation Platform
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-[#F5B450] tracking-wide uppercase mt-2">
              Certificate of Completion
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#686D7D] font-mono">
              Cryptographic ID • {cert.certificateId}
            </p>
          </div>

          {/* Body */}
          <div className="my-10 text-center space-y-6 relative z-10">
            <p className="text-xs text-[#9A9FAE] italic">This certificate is awarded to</p>

            <h2 className="text-4xl md:text-5xl font-extrabold text-[#EEEFF3] tracking-wide border-b-2 border-[#F5B450]/30 pb-3 inline-block px-8">
              {cert.traderName}
            </h2>

            <p className="text-xs md:text-sm text-[#9A9FAE] max-w-2xl mx-auto leading-relaxed">
              for demonstrating discipline, compliance with risk parameters, and passing the{' '}
              <strong className="text-[#F5B450] font-bold">
                {cert.tierType.replace('_', ' ')} — {cert.tierName}
              </strong>{' '}
              evaluation stage.
            </p>

            {/* Achievement Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto my-6 p-4 rounded-2xl bg-[#21232C] border border-[#F5B450]/20 font-mono text-center">
              <div>
                <span className="text-[10px] text-[#686D7D] uppercase font-semibold block">Account Capital</span>
                <span className="text-sm font-bold text-[#F5B450]">
                  ₹{(cert.accountSizeInPaise / 100).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#686D7D] uppercase font-semibold block">Net Profit</span>
                <span className="text-sm font-bold text-[#34D399]">
                  +₹{(cert.netProfitInPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="text-[10px] text-[#686D7D] uppercase font-semibold block">Date Issued</span>
                <span className="text-sm font-bold text-[#EEEFF3]">
                  {new Date(cert.passedAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="pt-8 border-t border-[#F5B450]/20 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 text-xs font-mono text-[#686D7D]">
            <div>
              <span className="block text-[#9A9FAE] font-bold">HMAC-SHA256 Cryptographic Signature:</span>
              <span className="block break-all text-[10px] text-[#F5B450] max-w-md mt-0.5">
                {cert.hmacSignature}
              </span>
            </div>
            <div className={`flex items-center gap-1.5 font-bold ${verified === true ? 'text-[#34D399]' : verified === false ? 'text-[#F87171]' : 'text-[#686D7D]'}`}>
              <ShieldCheck size={18} />
              {verified === null ? 'Verifying…' : verified ? 'Verified Authenticity' : 'Verification Failed'}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
