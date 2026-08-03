'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Award, Trophy, Search, Filter, ArrowUpRight, ShieldCheck } from 'lucide-react';

import { ErrorState } from '@/components/error-state';

interface LeaderboardEntry {
  rank: number;
  challengeId: string;
  traderName: string;
  tierName: string;
  tierType: string;
  status: string;
  currentPhase: number;
  accountSizeInPaise: number;
  netProfitInPaise: number;
  returnPercentage: number;
  winRate: number;
  closedTradesCount: number;
  passedAt?: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const query = tierFilter !== 'ALL' ? `?tierType=${tierFilter}` : '';
      const { data } = await api.get(`/api/trading/leaderboard${query}`);
      setLeaderboard(data.leaderboard || []);
    } catch (err: any) {
      console.error('Failed to load leaderboard:', err);
      setError(err.response?.data?.message || 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Evaluation Leaderboard | StockBattle';
    fetchLeaderboard();
  }, [tierFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && leaderboard.length === 0) {
    return <ErrorState title="Failed to load leaderboard" message={error} onRetry={fetchLeaderboard} fullPage />;
  }

  const filteredEntries = leaderboard.filter(
    (entry) =>
      entry.traderName.toLowerCase().includes(search.toLowerCase()) ||
      entry.tierName.toLowerCase().includes(search.toLowerCase())
  );

  const topThree = filteredEntries.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F5B450]/15 text-[#F5B450] border border-[#F5B450]/20 inline-block mb-1">
            Deterministic Evaluation Ranking
          </span>
          <h1 className="text-2xl font-extrabold text-[#EEEFF3] tracking-tight flex items-center gap-2">
            <Trophy size={24} className="text-[#F5B450]" /> Global Trader Hall of Fame
          </h1>
          <p className="text-xs text-[#9A9FAE] mt-1">
            4-tier tiebreaker: Net Return % → Net Profit → Win Rate % → Closed Trades
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-[#686D7D]" />
            <input
              type="text"
              placeholder="Search trader..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#21232C] border border-[#2B2E39] text-[#EEEFF3] text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-[#7C6AEF]"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-[#21232C] border border-[#2B2E39] text-[#EEEFF3] text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-[#7C6AEF]"
          >
            <option value="ALL">All Tiers</option>
            <option value="TWO_STEP">Two-Step</option>
            <option value="ONE_STEP">One-Step</option>
            <option value="INSTANT">Instant</option>
          </select>
        </div>
      </div>



      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {topThree.map((trader, idx) => {
                const borderTone =
                  idx === 0
                    ? 'border-[#F5B450]/40 bg-gradient-to-b from-[#F5B450]/10 to-transparent'
                    : idx === 1
                    ? 'border-slate-400/30 bg-gradient-to-b from-slate-400/10 to-transparent'
                    : 'border-amber-700/30 bg-gradient-to-b from-amber-700/10 to-transparent';

                const badge = idx === 0 ? '🥇 1st Place' : idx === 1 ? '🥈 2nd Place' : '🥉 3rd Place';

                return (
                  <div
                    key={trader.challengeId}
                    className={`bg-[#1B1D24] border ${borderTone} rounded-2xl p-5 flex flex-col justify-between shadow-xl`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-[#F5B450]">{badge}</span>
                        <span className="text-[10px] font-mono text-[#686D7D] uppercase">
                          {trader.tierType}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#EEEFF3]">{trader.traderName}</h3>
                      <p className="text-xs text-[#9A9FAE] font-mono">{trader.tierName}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#212330] space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#686D7D]">Net Return</span>
                        <span className="font-bold text-[#34D399]">+{trader.returnPercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#686D7D]">Net Profit</span>
                        <span className="font-bold text-[#EEEFF3]">
                          ₹{(trader.netProfitInPaise / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-[#686D7D]">
                        <span>Win Rate</span>
                        <span>{trader.winRate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 shadow-lg overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#212330] text-[#686D7D] font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Trader</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Net Profit</th>
                  <th className="p-3">Return %</th>
                  <th className="p-3">Win Rate</th>
                  <th className="p-3">Trades</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#212330] text-[#9A9FAE]">
                {filteredEntries.map((row) => (
                  <tr key={row.challengeId} className="hover:bg-[#21232C] transition-colors">
                    <td className="p-3 font-mono font-bold text-[#9787FF]">#{row.rank}</td>
                    <td className="p-3 font-bold text-[#EEEFF3]">{row.traderName}</td>
                    <td className="p-3 font-mono text-[#686D7D]">{row.tierName}</td>
                    <td className="p-3 font-mono font-bold text-[#34D399]">
                      ₹{(row.netProfitInPaise / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 font-mono font-bold text-[#EEEFF3]">+{row.returnPercentage}%</td>
                    <td className="p-3 font-mono">{row.winRate}%</td>
                    <td className="p-3 font-mono">{row.closedTradesCount}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#34D399]/10 text-[#34D399]">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
