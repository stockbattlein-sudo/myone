'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { UserChallengeDto, ChallengeStatus } from '@stockbattle/shared';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorState } from '@/components/error-state';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Zap,
  ChevronRight,
  Check,
  AlertTriangle,
  Circle,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  DollarSign,
  ShieldAlert,
  Award,
} from 'lucide-react';

const T = {
  bg: '#14151A',
  bgElevated: '#1B1D24',
  bgElevated2: '#21232C',
  bgElevated3: '#282A35',
  border: '#2B2E39',
  borderSubtle: '#212330',
  textPrimary: '#EEEFF3',
  textSecondary: '#9A9FAE',
  textTertiary: '#686D7D',
  accent: '#7C6AEF',
  accentStrong: '#9787FF',
  accentSoft: 'rgba(124,106,239,0.14)',
  accentBorder: 'rgba(124,106,239,0.35)',
  success: '#34D399',
  danger: '#F87171',
  warning: '#F5B450',
};

// SVG Score Gauge Component
function ScoreGauge({ value = 82, size = 140 }) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const dash = c * pct;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#282A35" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="url(#scoreGradWeb)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 6px ${T.accent}66)`, transition: 'stroke-dasharray 0.6s ease' }}
      />
      <defs>
        <linearGradient id="scoreGradWeb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={T.accentStrong} />
          <stop offset="100%" stopColor={T.accent} />
        </linearGradient>
      </defs>
      <text
        x="50%"
        y="47%"
        textAnchor="middle"
        fontFamily="'IBM Plex Mono', monospace"
        fontSize="30"
        fontWeight="600"
        fill={T.textPrimary}
      >
        {value}
      </text>
      <text
        x="50%"
        y="64%"
        textAnchor="middle"
        fontFamily="'Plus Jakarta Sans', sans-serif"
        fontSize="10"
        fill={T.textTertiary}
        letterSpacing="0.5"
      >
        / 100
      </text>
    </svg>
  );
}

export default function TraderDashboard() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<UserChallengeDto[]>([]);
  const [summaryStats, setSummaryStats] = useState<{ globalWinRate: number | null }>({ globalWinRate: null });
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [challengeAnalytics, setChallengeAnalytics] = useState<any>(null);
  
  // Credentials card state
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scoreExpanded, setScoreExpanded] = useState(false);

  const fetchChallenges = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/challenges/user');
      const loaded = data.challenges || [];
      setChallenges(loaded);
      if (loaded.length > 0 && !selectedChallengeId) {
        setSelectedChallengeId(loaded[0].id);
      }
      
      const { data: summaryData } = await api.get('/api/trading/user/summary');
      if (summaryData && summaryData.success) {
        setSummaryStats({ globalWinRate: summaryData.globalWinRate });
      }
    } catch (err: any) {
      console.error('Failed to load user challenges:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Trader Health Cockpit | StockBattle';
    fetchChallenges();
  }, []);

  useEffect(() => {
    if (!selectedChallengeId) return;
    const fetchAnalytics = async () => {
      try {
        const { data: res } = await api.get(`/api/trading/challenge/${selectedChallengeId}/analytics`);
        setChallengeAnalytics(res);
      } catch (err) {
        console.error('Failed to load challenge analytics for dashboard:', err);
      }
    };
    fetchAnalytics();
  }, [selectedChallengeId]);

  const activeChallenges = useMemo(
    () => challenges.filter((c) => c.status === ChallengeStatus.ACTIVE),
    [challenges]
  );

  const selectedChallenge = useMemo(
    () => challenges.find((c) => c.id === selectedChallengeId) || challenges[0],
    [challenges, selectedChallengeId]
  );

  const handleCopyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handlePayoutRequest = async (challengeId: string) => {
    setActionLoading((prev) => ({ ...prev, [challengeId]: true }));
    setError('');
    setMsg('');
    try {
      const { data } = await api.post(`/api/trading/challenge/${challengeId}/payout`);
      setMsg(
        `Payout of ₹${data.payoutAmount.toLocaleString(
          'en-IN'
        )} approved! Profit share credited to your wallet balance.`
      );
      await fetchChallenges();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payout request failed');
    } finally {
      setActionLoading((prev) => ({ ...prev, [challengeId]: false }));
    }
  };

  // Calculate selected challenge metrics
  const rules = selectedChallenge ? (selectedChallenge.rulesSnapshot as any) : {};
  const ruleAccountSize = selectedChallenge
    ? rules.accountSize || selectedChallenge.virtualBalanceInPaise / 100
    : 100000;
  const currentBalance = selectedChallenge ? selectedChallenge.virtualBalanceInPaise / 100 : 100000;
  const currentPL = currentBalance - ruleAccountSize;
  const dailyStarting = selectedChallenge ? selectedChallenge.dailyStartingBalanceInPaise / 100 : currentBalance;
  const peakDailyEquity = selectedChallenge
    ? Math.max(
        (selectedChallenge.peakDailyEquityInPaise || selectedChallenge.dailyStartingBalanceInPaise) / 100,
        currentBalance
      )
    : currentBalance;
  const dailyLoss = peakDailyEquity - currentBalance;
  const dailyLossLimitInInr = ruleAccountSize * ((rules.dailyLossLimit || 3.0) / 100);
  const dailyUsagePct = Math.min(100, Math.max(0, (dailyLoss / dailyLossLimitInInr) * 100));
  
  const totalLoss = ruleAccountSize - currentBalance;
  const maxLossLimitInInr = ruleAccountSize * ((rules.maxLoss || 10.0) / 100);
  const maxLossUsagePct = Math.min(100, Math.max(0, (totalLoss / maxLossLimitInInr) * 100));

  // Real Per-Trade Equity Curve Points
  const equityData = useMemo(() => {
    if (!challengeAnalytics || !challengeAnalytics.equityCurve || challengeAnalytics.equityCurve.length === 0) {
      return [
        { d: 'Start', v: ruleAccountSize },
        { d: 'Today', v: currentBalance },
      ];
    }
    return challengeAnalytics.equityCurve.map((pt: any) => ({
      d: pt.date,
      v: pt.closingBalanceInPaise / 100,
      pnl: (pt.realizedPnLInPaise || 0) / 100,
      symbol: pt.symbol,
    }));
  }, [challengeAnalytics, ruleAccountSize, currentBalance]);

  const dashBalances = equityData.map((pt: any) => pt.v);
  const dashMin = Math.min(...dashBalances, ruleAccountSize);
  const dashMax = Math.max(...dashBalances, ruleAccountSize);
  const dashPadding = Math.max((dashMax - dashMin) * 0.15, 2000);
  const dashYMin = Math.floor((dashMin - dashPadding) / 1000) * 1000;
  const dashYMax = Math.ceil((dashMax + dashPadding) / 1000) * 1000;

  const calculatedScore = Math.min(
    100,
    Math.max(40, 75 + (summaryStats.globalWinRate || 10) * 0.3 - (maxLossUsagePct > 50 ? 15 : 0))
  );

  if (error && challenges.length === 0) {
    return <ErrorState title="Failed to load dashboard" message={error} onRetry={fetchChallenges} fullPage />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in font-sans">
      {/* 1. Global Announcement Banner */}
      <div className="bg-[#7C6AEF]/15 border border-[#7C6AEF]/35 rounded-2xl p-3.5 px-5 flex items-center justify-between gap-4 text-xs font-semibold text-[#EEEFF3]">
        <div className="flex items-center gap-2.5">
          <Sparkles size={16} className="text-[#F5B450] shrink-0" />
          <span>
            <strong>SPECIAL PROMO: 20% OFF</strong> your next challenge purchase | Use code{' '}
            <strong className="text-[#9787FF]">SAVE20</strong> at checkout
          </span>
        </div>
        <Link
          href="/trader/challenges"
          className="inline-flex items-center gap-1 bg-[#7C6AEF] hover:bg-[#9787FF] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0"
        >
          Buy Challenge <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Breached / Failed Challenge Alert Banner */}
      {selectedChallenge && selectedChallenge.status === ChallengeStatus.FAILED && (
        <div className="p-4 rounded-2xl bg-[#F87171]/15 border border-[#F87171]/40 text-[#F87171] flex items-center justify-between gap-4 animate-fade-in shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle size={22} className="shrink-0 text-[#F87171]" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-2">
                <span>Account Status: FAILED & BREACHED</span>
                <span className="px-2 py-0.5 rounded-md bg-[#F87171]/20 text-[#F87171] text-[10px]">
                  {selectedChallenge.id.slice(-6)}
                </span>
              </p>
              <p className="text-xs text-[#F87171]/90 mt-0.5 font-mono">
                Reason: {selectedChallenge.failureReason || 'Risk Limit Breached'}
              </p>
            </div>
          </div>
          <Link
            href="/trader/challenges"
            className="px-3.5 py-2 bg-[#F87171] hover:bg-[#EF4444] text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-md"
          >
            Reset / Buy New Challenge
          </Link>
        </div>
      )}

      {/* 2. Welcome Header & Account Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#EEEFF3] tracking-tight">
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-[#9A9FAE] mt-0.5">
            Your simulated prop trading health cockpit & evaluation dashboard
          </p>
        </div>

        {challenges.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[#686D7D] hidden sm:inline">Active Account:</span>
            <select
              value={selectedChallengeId}
              onChange={(e) => setSelectedChallengeId(e.target.value)}
              className="bg-[#1B1D24] border border-[#2B2E39] text-[#EEEFF3] text-xs font-mono font-semibold rounded-xl px-3 py-2 outline-none focus:border-[#7C6AEF]"
            >
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tier?.name || 'Evaluation'} — ₹{(c.virtualBalanceInPaise / 100).toLocaleString('en-IN')} [{c.status}]
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3. First-Time Trader Onboarding Checklist (PRD Section 3) */}
      {(challenges.length === 0 || (challengeAnalytics && (challengeAnalytics.stats?.totalOrdersExecuted || 0) === 0)) && (
        <div className="bg-[#1B1D24] border border-[#7C6AEF]/30 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#7C6AEF]/20 text-[#9787FF] flex items-center justify-center font-bold text-xs">
                🚀
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#EEEFF3]">Getting Started with StockBattle</h2>
                <p className="text-xs text-[#9A9FAE]">Complete these 3 steps to launch your prop trading evaluation</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-[#7C6AEF]/15 text-[#9787FF] px-2.5 py-1 rounded-full border border-[#7C6AEF]/30">
              {challenges.length > 0 ? '1 / 3 Completed' : '0 / 3 Completed'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* Step 1: Buy Challenge */}
            <Link
              href="/trader/challenges"
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                challenges.length > 0
                  ? 'bg-[#34D399]/10 border-[#34D399]/30 text-[#34D399]'
                  : 'bg-[#21232C] border-[#7C6AEF]/40 text-[#EEEFF3] hover:border-[#7C6AEF]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Step 1</span>
                {challenges.length > 0 ? (
                  <Check size={16} className="text-[#34D399]" />
                ) : (
                  <Zap size={16} className="text-[#9787FF]" />
                )}
              </div>
              <p className="text-xs font-bold mb-1">Buy Your First Challenge</p>
              <p className="text-[10px] opacity-80">Select capital tier & evaluation model</p>
            </Link>

            {/* Step 2: Place First Trade */}
            {challenges.length > 0 ? (
              <Link
                href="/trader/trading"
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  (challengeAnalytics?.stats?.totalOrdersExecuted || 0) > 0
                    ? 'bg-[#34D399]/10 border-[#34D399]/30 text-[#34D399]'
                    : 'bg-[#21232C] border-[#7C6AEF]/40 text-[#EEEFF3] hover:border-[#7C6AEF]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Step 2</span>
                  {(challengeAnalytics?.stats?.totalOrdersExecuted || 0) > 0 ? (
                    <Check size={16} className="text-[#34D399]" />
                  ) : (
                    <TrendingUp size={16} className="text-[#9787FF]" />
                  )}
                </div>
                <p className="text-xs font-bold mb-1">Place Your First Trade</p>
                <p className="text-[10px] opacity-80">Simulated NIFTY 50 trading terminal</p>
              </Link>
            ) : (
              <div className="p-4 rounded-xl bg-[#1B1D24] border border-[#2B2E39] text-[#686D7D] flex flex-col justify-between opacity-60 cursor-not-allowed">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Step 2</span>
                  <span className="text-xs">🔒</span>
                </div>
                <p className="text-xs font-bold mb-1">Place Your First Trade</p>
                <p className="text-[10px]">Locked — Buy a challenge first</p>
              </div>
            )}

            {/* Step 3: Track Analytics */}
            {(challengeAnalytics?.stats?.totalOrdersExecuted || 0) > 0 ? (
              <Link
                href="/trader/analytics"
                className="p-4 rounded-xl border bg-[#34D399]/10 border-[#34D399]/30 text-[#34D399] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Step 3</span>
                  <Check size={16} className="text-[#34D399]" />
                </div>
                <p className="text-xs font-bold mb-1">Track Progress in Analytics</p>
                <p className="text-[10px] opacity-80">Interactive equity curve & win rate</p>
              </Link>
            ) : (
              <div className="p-4 rounded-xl bg-[#1B1D24] border border-[#2B2E39] text-[#686D7D] flex flex-col justify-between opacity-60 cursor-not-allowed">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Step 3</span>
                  <span className="text-xs">🔒</span>
                </div>
                <p className="text-xs font-bold mb-1">Track Progress in Analytics</p>
                <p className="text-[10px]">Locked — Place a trade first</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error & Success Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-xs font-medium flex items-center gap-2">
          <AlertTriangle size={15} /> {error}
        </div>
      )}
      {msg && (
        <div className="p-4 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] text-xs font-semibold flex items-center gap-2">
          <Check size={15} /> {msg}
        </div>
      )}

      {/* 3. Top Grid: Score Gauge & Payout Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Trader Score Gauge Card */}
        <div className="lg:col-span-5 bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#EEEFF3]">Trader Score</h2>
              <p className="text-xs text-[#686D7D] mt-0.5">Evaluation performance rating</p>
            </div>
            <button
              onClick={() => setScoreExpanded(!scoreExpanded)}
              className="text-xs text-[#9787FF] font-semibold flex items-center gap-1 hover:underline"
            >
              {scoreExpanded ? 'Hide' : 'Details'} <ChevronRight size={13} className={scoreExpanded ? 'rotate-90' : ''} />
            </button>
          </div>

          <div className="flex items-center gap-5 my-4">
            <ScoreGauge value={Math.round(calculatedScore)} />
            <div className="text-xs text-[#9A9FAE] leading-relaxed flex-1">
              <p className="font-bold text-[#34D399] text-sm mb-1">Strong Standing</p>
              Top <strong className="text-[#EEEFF3]">18%</strong> of active funded traders this evaluation cycle.
            </div>
          </div>

          {scoreExpanded && (
            <div className="space-y-2 pt-3 border-t border-[#212330] text-xs">
              <div className="flex justify-between text-[#9A9FAE]">
                <span>Risk Discipline</span>
                <span className="font-mono text-[#34D399]">92 / 100</span>
              </div>
              <div className="flex justify-between text-[#9A9FAE]">
                <span>Win Rate Consistency</span>
                <span className="font-mono text-[#9787FF]">{summaryStats.globalWinRate ?? 55}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Next Payout Card */}
        <div className="lg:col-span-7 bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#EEEFF3]">Next Eligible Reward Payout</h2>
              <p className="text-xs text-[#686D7D] mt-0.5">Simulated profit share disbursement</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#7C6AEF]/15 text-[#9787FF]">
              Biweekly 85% Split
            </span>
          </div>

          <div className="my-3">
            <div className="font-mono text-2xl font-bold text-[#EEEFF3]">
              ₹{currentPL > 0 ? (currentPL * 0.85).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <p className="text-xs text-[#686D7D] mt-1">
              {currentPL > 0 ? 'Eligible for instant withdrawal to wallet' : 'Reach profit target to unlock reward cycle'}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[#9A9FAE]">
              <span>Evaluation Cycle Progress</span>
              <span className="font-mono text-[#EEEFF3]">68%</span>
            </div>
            <div className="w-full bg-[#282A35] h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#7C6AEF] to-[#9787FF] h-full w-[68%]" />
            </div>
          </div>

          {selectedChallenge && selectedChallenge.status === ChallengeStatus.ACTIVE && currentPL > 0 && (
            <button
              onClick={() => handlePayoutRequest(selectedChallenge.id)}
              disabled={actionLoading[selectedChallenge.id]}
              className="mt-4 w-full py-2.5 bg-[#34D399] hover:bg-[#059669] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {actionLoading[selectedChallenge.id] ? <LoadingSpinner size="sm" /> : '💰 Request Early Reward Payout'}
            </button>
          )}
        </div>
      </div>

      {/* 4. Equity Curve Card */}
      <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#EEEFF3]">Simulated Equity Trajectory</h2>
            <p className="text-xs text-[#686D7D]">Account balance & unrealized performance curve</p>
          </div>
          <div className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${currentPL >= 0 ? 'bg-[#34D399]/10 text-[#34D399]' : 'bg-[#F87171]/10 text-[#F87171]'}`}>
            P&L: {currentPL >= 0 ? '+' : ''}₹{currentPL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="webEquityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={currentPL >= 0 ? '#34D399' : '#F87171'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={currentPL >= 0 ? '#34D399' : '#F87171'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#212330" strokeDasharray="3 3" />
              <XAxis dataKey="d" tick={{ fill: T.textTertiary, fontSize: 11 }} axisLine={{ stroke: T.border }} tickLine={false} />
              <YAxis
                domain={[dashYMin, dashYMax]}
                tick={{ fill: T.textTertiary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                width={55}
                tickCount={5}
              />
              <ReferenceLine y={ruleAccountSize} stroke="#686D7D" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{ background: '#282A35', border: '1px solid #2B2E39', borderRadius: 10, fontSize: 12 }}
                formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Equity']}
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke={currentPL >= 0 ? '#34D399' : '#F87171'}
                strokeWidth={2.25}
                fill="url(#webEquityFill)"
                dot={{ r: 3, fill: currentPL >= 0 ? '#34D399' : '#F87171' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Bottom Grid: Rule Compliance & Credentials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Rule Compliance Card */}
        <div className="lg:col-span-7 bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-[#EEEFF3]">Rule Adherence & Compliance</h2>
          
          <div className="space-y-3.5 text-xs">
            {/* Daily Loss Rule */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#EEEFF3] font-medium flex items-center gap-1.5">
                  {dailyUsagePct >= 100 || selectedChallenge?.status === ChallengeStatus.FAILED ? (
                    <AlertTriangle size={14} className="text-[#F87171]" />
                  ) : (
                    <Check size={14} className="text-[#34D399]" />
                  )}
                  Trailing Daily Loss Limit ({rules.dailyLossLimit || 3}%)
                </span>
                <span className={`font-mono ${dailyUsagePct >= 100 ? 'text-[#F87171] font-bold' : 'text-[#9A9FAE]'}`}>
                  ₹{Math.max(0, dailyLoss).toFixed(2)} / ₹{dailyLossLimitInInr.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-[#282A35] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${dailyUsagePct >= 100 ? 'bg-[#F87171]' : 'bg-[#34D399]'}`}
                  style={{ width: `${dailyUsagePct}%` }}
                />
              </div>
            </div>

            {/* Max Drawdown Rule */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#EEEFF3] font-medium flex items-center gap-1.5">
                  {maxLossUsagePct >= 100 ? (
                    <AlertTriangle size={14} className="text-[#F87171]" />
                  ) : (
                    <Check size={14} className="text-[#34D399]" />
                  )}
                  Max Drawdown ({rules.maxLoss || 10}%)
                </span>
                <span className={`font-mono ${maxLossUsagePct >= 100 ? 'text-[#F87171] font-bold' : 'text-[#9A9FAE]'}`}>
                  ₹{Math.max(0, totalLoss).toFixed(2)} / ₹{maxLossLimitInInr.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-[#282A35] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${maxLossUsagePct > 80 ? 'bg-[#F87171]' : 'bg-[#34D399]'}`}
                  style={{ width: `${maxLossUsagePct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Platform Credentials Card */}
        <div className="lg:col-span-5 bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#EEEFF3]">Terminal Credentials</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34D399]/10 text-[#34D399] flex items-center gap-1">
              <Circle size={5} fill="#34D399" color="#34D399" /> Connected
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-[#212330]">
              <span className="text-[#686D7D]">Login ID</span>
              <span className="font-mono font-bold text-[#EEEFF3]">
                {selectedChallenge ? selectedChallenge.id.slice(0, 8).toUpperCase() : '8842019'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-[#212330]">
              <span className="text-[#686D7D]">Server</span>
              <span className="font-mono font-bold text-[#EEEFF3]">StockBattle-SimLive03</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-[#686D7D]">Trading Password</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-[#EEEFF3]">
                  {showPassword ? 'Sb-SimTrade-99x' : '••••••••••'}
                </span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#686D7D] hover:text-[#EEEFF3]"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button
                  onClick={() => handleCopyPassword('Sb-SimTrade-99x')}
                  className="text-[#686D7D] hover:text-[#EEEFF3]"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          </div>

          {copied && <p className="text-[11px] text-[#34D399] font-medium">Copied to clipboard!</p>}

          <Link
            href="/trader/trading"
            className="w-full py-2.5 bg-[#282A35] hover:bg-[#21232C] border border-[#2B2E39] text-[#EEEFF3] text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <KeyRound size={14} /> Open Trading Terminal
          </Link>
        </div>
      </div>

      {/* 6. Active Challenges Cards List */}
      {challenges.length > 0 ? (
        <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-6 shadow-lg space-y-4">
          <h2 className="text-sm font-bold text-[#EEEFF3] flex items-center gap-2">
            <Award size={18} className="text-[#9787FF]" /> Your Challenge Tiers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((c) => {
              const currentB = c.virtualBalanceInPaise / 100;
              const origB = (c.rulesSnapshot as any).accountSize || currentB;
              const pl = currentB - origB;

              return (
                <div
                  key={c.id}
                  className="bg-[#21232C] border border-[#2B2E39] hover:border-[#7C6AEF]/40 rounded-xl p-4 transition-all space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#7C6AEF]/15 text-[#9787FF]">
                        {c.tier?.type || 'STANDARD'}
                      </span>
                      <h3 className="font-bold text-sm text-[#EEEFF3] mt-1">{c.tier?.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-[#686D7D] block">Balance</span>
                      <span className="font-mono font-bold text-sm text-[#EEEFF3]">
                        ₹{currentB.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-[#2B2E39] text-xs">
                    <span className="font-mono text-[#686D7D]">ID: {c.id.slice(0, 12)}...</span>
                    <span className={`font-mono font-bold ${pl >= 0 ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                      {pl >= 0 ? '+' : ''}₹{pl.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-8 text-center space-y-3">
          <div className="text-3xl">🚀</div>
          <h2 className="text-base font-bold text-[#EEEFF3]">Your Trading Journey Starts Here</h2>
          <p className="text-xs text-[#9A9FAE] max-w-md mx-auto">
            Purchase an evaluation challenge tier to trade with simulated capital, prove your edge, and earn performance payouts.
          </p>
          <Link
            href="/trader/challenges"
            className="inline-block px-5 py-2.5 bg-[#7C6AEF] hover:bg-[#9787FF] text-white text-xs font-bold rounded-xl transition-colors mt-2"
          >
            Browse Evaluation Challenges
          </Link>
        </div>
      )}

      {/* 7. Regulatory & Simulation Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-[#F5B450]/10 border border-[#F5B450]/20 text-xs text-[#F5B450] flex items-center gap-2.5">
        <ShieldAlert size={16} className="shrink-0" />
        <span>
          <strong>Simulated Trading Notice:</strong> All evaluation trading activities on StockBattle are conducted in a simulated market environment. Rewards and payouts are internal program stipends, not investment returns.
        </span>
      </div>
    </div>
  );
}
