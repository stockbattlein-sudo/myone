'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/loading-spinner';
import Link from 'next/link';
import { ShieldCheck, Award, ArrowUpRight, Lock } from 'lucide-react';

import { ErrorState } from '@/components/error-state';

export default function CertificatesListPage() {
  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchChallenges = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/challenges/user');
      setUserChallenges(data.challenges || []);
    } catch (err: any) {
      console.error('Failed to load challenges:', err);
      setError(err.response?.data?.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Evaluation Certificates | StockBattle';
    fetchChallenges();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && userChallenges.length === 0) {
    return <ErrorState title="Failed to load certificates" message={error} onRetry={fetchChallenges} fullPage />;
  }

  const passedChallenges = userChallenges.filter((c) => c.status === 'PASSED');
  const activeOrOther = userChallenges.filter((c) => c.status !== 'PASSED');

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-6 shadow-lg">
        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F5B450]/15 text-[#F5B450] border border-[#F5B450]/20 inline-block mb-1">
          Cryptographic Achievements
        </span>
        <h1 className="text-2xl font-extrabold text-[#EEEFF3] tracking-tight flex items-center gap-2">
          <Award size={24} className="text-[#F5B450]" /> Evaluation Certificates & Badges
        </h1>
        <p className="text-xs text-[#9A9FAE] mt-1">
          Official HMAC-SHA256 verified certificates issued upon successfully passing evaluation phases
        </p>
      </div>

      {/* Passed Certificates Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[#EEEFF3] flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#34D399]" /> Earned Certificates ({passedChallenges.length})
        </h2>

        {passedChallenges.length === 0 ? (
          <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-8 text-center text-xs text-[#9A9FAE] space-y-2">
            <p className="font-semibold text-[#EEEFF3]">No earned certificates yet</p>
            <p className="max-w-md mx-auto">
              Complete profit targets and meet all risk criteria on your active evaluation accounts to unlock official cryptographic certificates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {passedChallenges.map((c) => {
              const initialSize = (c.rulesSnapshot as any).accountSize || c.virtualBalanceInPaise / 100;
              return (
                <div
                  key={c.id}
                  className="bg-[#1B1D24] border border-[#F5B450]/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-[#F5B450] uppercase font-bold tracking-wider">
                        {c.tier?.type} — PASSED
                      </span>
                      <h3 className="text-lg font-extrabold text-[#EEEFF3] mt-0.5">{c.tier?.name}</h3>
                      <p className="text-xs text-[#686D7D] font-mono">ID: {c.id}</p>
                    </div>
                    <Award size={32} className="text-[#F5B450]" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#21232C] font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-[#686D7D] block">ACCOUNT CAPITAL</span>
                      <span className="font-bold text-[#EEEFF3]">₹{initialSize.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#686D7D] block">PASSED DATE</span>
                      <span className="font-bold text-[#34D399]">
                        {new Date(c.updatedAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/trader/certificate/${c.id}`}
                    className="w-full py-2.5 bg-[#F5B450] hover:bg-[#d99b38] text-black font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#F5B450]/10"
                  >
                    View & Print Certificate <ArrowUpRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active / Ongoing Accounts Section */}
      {activeOrOther.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[#212330]">
          <h2 className="text-sm font-bold text-[#686D7D] flex items-center gap-2">
            <Lock size={16} /> Evaluation Accounts in Progress ({activeOrOther.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeOrOther.map((c) => (
              <div key={c.id} className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-4 opacity-75 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-[#9A9FAE] font-bold">{c.tier?.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.status === 'ACTIVE'
                        ? 'bg-[#7C6AEF]/15 text-[#9787FF]'
                        : 'bg-[#F87171]/10 text-[#F87171]'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#686D7D]">Certificate locked until evaluation completion.</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
