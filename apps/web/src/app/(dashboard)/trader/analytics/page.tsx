'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorState } from '@/components/error-state';
import Link from 'next/link';
import { createChart, AreaSeries, LineStyle, UTCTimestamp } from 'lightweight-charts';
import { BarChart3, ArrowLeft, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';

interface ChallengeAnalyticsData {
  challenge: {
    id: string;
    status: string;
    currentPhase: number;
    tierName: string;
    tierType: string;
    accountSizeInPaise: number;
    virtualBalanceInPaise: number;
    netProfitInPaise: number;
    dailyStartingBalanceInPaise: number;
    failureReason?: string;
    rulesSnapshot: any;
  };
  stats: {
    totalOrdersExecuted: number;
    totalClosedTrades: number;
    winningTradesCount: number;
    losingTradesCount: number;
    winRate: number;
    profitFactor: number | null;
    grossProfitsInPaise: number;
    grossLossesInPaise: number;
    avgWinInPaise: number;
    avgLossInPaise: number;
  };
  equityCurve: Array<{
    timestamp: string;
    date: string;
    closingBalanceInPaise: number;
    realizedPnLInPaise: number;
    symbol?: string;
    side?: string;
    quantity?: number;
    priceInPaise?: number;
  }>;
  recentClosedTrades: Array<{
    id: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    type: string;
    quantity: number;
    priceInPaise: number;
    realizedPnLInPaise: number;
    executedAt: string;
  }>;
}

export default function TraderAnalyticsPage() {
  const searchParams = useSearchParams();
  const initialChallengeId = searchParams.get('challengeId');

  const [userChallenges, setUserChallenges] = useState<any[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(initialChallengeId || '');
  const [data, setData] = useState<ChallengeAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartReady, setChartReady] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);

  const equityContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    document.title = 'Trader Analytics | StockBattle';
    const loadChallenges = async () => {
      try {
        const { data: res } = await api.get('/api/challenges/user');
        const challengesList = res.challenges || [];
        setUserChallenges(challengesList);
        if (!selectedChallengeId && challengesList.length > 0) {
          setSelectedChallengeId(challengesList[0].id);
        }
      } catch (err) {
        console.error('Failed to load challenges:', err);
      }
    };
    loadChallenges();
  }, []);

  useEffect(() => {
    if (!selectedChallengeId) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: res } = await api.get(`/api/trading/challenge/${selectedChallengeId}/analytics`);
        setData(res);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedChallengeId]);

  // TradingView Lightweight-Charts Equity Curve Setup
  useEffect(() => {
    if (!data || !equityContainerRef.current) return;
    setChartReady(false);

    let isSubscribed = true;
    const container = equityContainerRef.current;

    const startingCapital = data.challenge.accountSizeInPaise / 100;
    const currentBalance = data.challenge.virtualBalanceInPaise / 100;
    const netProfit = currentBalance - startingCapital;
    const isOverallProfitable = netProfit >= 0;

    const targetProfitPct = (data.challenge.rulesSnapshot as any)?.targetPhase1 || 10;
    const targetProfitBalance = startingCapital * (1 + targetProfitPct / 100);

    const initChart = (width: number) => {
      if (!container || !isSubscribed) return;
      container.innerHTML = '';

      const chart = createChart(container, {
        width: width,
        height: 340,
        layout: {
          background: { color: '#1B1D24' },
          textColor: '#9A9FAE',
        },
        grid: {
          vertLines: { color: '#212330' },
          horzLines: { color: '#212330' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      });
      chartRef.current = chart;

      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: isOverallProfitable ? 'rgba(52, 211, 153, 0.35)' : 'rgba(248, 113, 113, 0.35)',
        bottomColor: isOverallProfitable ? 'rgba(52, 211, 153, 0.0)' : 'rgba(248, 113, 113, 0.0)',
        lineColor: isOverallProfitable ? '#34D399' : '#F87171',
        lineWidth: 2,
      });

      // Prepare ascending timestamped data points
      const rawCurve = data.equityCurve || [];
      const points: Array<{ time: UTCTimestamp; value: number; raw: any }> = [];
      let lastTime = 0;

      for (let i = 0; i < rawCurve.length; i++) {
        const pt = rawCurve[i];
        let unixSec = Math.floor(new Date(pt.timestamp).getTime() / 1000);

        // Ensure strictly ascending unique timestamps for Lightweight Charts
        if (unixSec <= lastTime) {
          unixSec = lastTime + 1;
        }
        lastTime = unixSec;

        points.push({
          time: unixSec as UTCTimestamp,
          value: pt.closingBalanceInPaise / 100,
          raw: pt,
        });
      }

      areaSeries.setData(points.map((p) => ({ time: p.time, value: p.value })));

      // Add Price Reference Lines
      areaSeries.createPriceLine({
        price: startingCapital,
        color: '#686D7D',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `Baseline ₹${startingCapital.toLocaleString('en-IN')}`,
      });

      areaSeries.createPriceLine({
        price: targetProfitBalance,
        color: '#34D399',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `Target (${targetProfitPct}%) ₹${targetProfitBalance.toLocaleString('en-IN')}`,
      });

      // Hover Crosshair Event Handler
      chart.subscribeCrosshairMove((param) => {
        if (!param.time || param.point === undefined || param.point.x < 0 || param.point.y < 0) {
          setHoveredPoint(null);
          return;
        }

        const match = points.find((p) => p.time === param.time);
        if (match) {
          setHoveredPoint(match.raw);
        }
      });

      chart.timeScale().fitContent();
      setChartReady(true);
    };

    const getWidth = () => {
      if (!container) return 780;
      const clientW = container.clientWidth;
      const rectW = container.getBoundingClientRect().width;
      const parentW = container.parentElement?.clientWidth;
      const candidate = Math.max(clientW, rectW, parentW ? parentW - 40 : 0);
      return candidate > 0 ? candidate : 780;
    };

    // 1. Immediate cold load initialization
    const initialWidth = getWidth();
    initChart(initialWidth);

    // 2. ResizeObserver for responsive width updates
    const resizeObserver = new ResizeObserver((entries) => {
      if (!isSubscribed) return;
      const width = entries[0]?.contentRect?.width || getWidth();
      if (width > 0) {
        if (!chartRef.current) {
          initChart(width);
        } else {
          chartRef.current.applyOptions({ width });
        }
      }
    });

    resizeObserver.observe(container);

    // 3. Safety fallback timer
    const fallbackTimer = setTimeout(() => {
      if (isSubscribed && !chartRef.current && container) {
        initChart(getWidth());
      }
    }, 50);

    return () => {
      isSubscribed = false;
      clearTimeout(fallbackTimer);
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <ErrorState
        title="Failed to load analytics"
        message={error}
        onRetry={() => {
          if (selectedChallengeId) {
            setLoading(true);
            setError('');
            api.get(`/api/trading/challenge/${selectedChallengeId}/analytics`)
              .then(res => setData(res.data))
              .catch(err => setError(err.response?.data?.message || 'Failed to load analytics data'))
              .finally(() => setLoading(false));
          }
        }}
        fullPage
      />
    );
  }

  const startingCapital = data ? data.challenge.accountSizeInPaise / 100 : 100000;
  const currentBalance = data ? data.challenge.virtualBalanceInPaise / 100 : 100000;
  const netProfit = currentBalance - startingCapital;
  const isOverallProfitable = netProfit >= 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <Link
            href="/trader"
            className="text-xs text-[#9787FF] hover:underline flex items-center gap-1 font-semibold mb-1"
          >
            <ArrowLeft size={13} /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-[#EEEFF3] tracking-tight flex items-center gap-2">
            <BarChart3 size={24} className="text-[#9787FF]" /> Trader Analytics Cockpit
          </h1>
          <p className="text-xs text-[#9A9FAE] mt-0.5">
            TradingView interactive equity tracking, profit factors, win-rate edge, and closed position logs
          </p>
        </div>

        {userChallenges.length > 0 && (
          <select
            value={selectedChallengeId}
            onChange={(e) => setSelectedChallengeId(e.target.value)}
            className="bg-[#21232C] border border-[#2B2E39] text-[#EEEFF3] text-xs font-mono font-semibold rounded-xl px-3 py-2 outline-none focus:border-[#7C6AEF]"
          >
            {userChallenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.tier?.name || 'Challenge'} (ID: {c.id.slice(-6)})
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {data && (
        <>
          {/* Performance Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-4 shadow-lg">
              <span className="text-[10px] font-bold text-[#686D7D] uppercase tracking-wider block">WIN RATE</span>
              <div className="font-mono text-2xl font-bold text-[#34D399] mt-1">{data.stats.winRate}%</div>
              <span className="text-[11px] text-[#9A9FAE]">
                {data.stats.winningTradesCount} W / {data.stats.losingTradesCount} L
              </span>
            </div>

            <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-4 shadow-lg">
              <span className="text-[10px] font-bold text-[#686D7D] uppercase tracking-wider block">PROFIT FACTOR</span>
              <div className="font-mono text-2xl font-bold text-[#9787FF] mt-1">
                {data.stats.profitFactor !== null ? data.stats.profitFactor.toFixed(2) : 'N/A'}
              </div>
              <span className="text-[11px] text-[#9A9FAE]">Symmetric edge metric</span>
            </div>

            <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-4 shadow-lg">
              <span className="text-[10px] font-bold text-[#686D7D] uppercase tracking-wider block">AVERAGE WIN</span>
              <div className="font-mono text-2xl font-bold text-[#34D399] mt-1">
                ₹{(data.stats.avgWinInPaise / 100).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-4 shadow-lg">
              <span className="text-[10px] font-bold text-[#686D7D] uppercase tracking-wider block">AVERAGE LOSS</span>
              <div className="font-mono text-2xl font-bold text-[#F87171] mt-1">
                -₹{(data.stats.avgLossInPaise / 100).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Interactive TradingView Equity Chart */}
          <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 shadow-lg space-y-4 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#EEEFF3]">
                  TradingView Interactive Equity Curve (Per-Trade Snapshots)
                </h2>
                <p className="text-[11px] text-[#686D7D]">
                  Scroll/pinch to zoom, click & drag to pan. Real-time dynamic Y-axis auto-fitting.
                </p>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="flex items-center gap-1 text-[#9A9FAE]">
                  Start: <strong className="text-[#EEEFF3]">₹{startingCapital.toLocaleString('en-IN')}</strong>
                </span>
                <span className="flex items-center gap-1">
                  Net:{' '}
                  <strong className={isOverallProfitable ? 'text-[#34D399]' : 'text-[#F87171]'}>
                    {isOverallProfitable ? '+' : ''}₹{netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </span>
              </div>
            </div>

            {/* Hover Tooltip Card */}
            {hoveredPoint && (
              <div className="p-3 bg-[#282A35] border border-[#2B2E39] rounded-xl text-xs font-mono flex flex-wrap items-center justify-between gap-4 shadow-xl">
                <div>
                  <span className="text-[#686D7D]">Date: </span>
                  <span className="font-bold text-[#EEEFF3]">{hoveredPoint.date}</span>
                </div>
                <div>
                  <span className="text-[#686D7D]">Equity: </span>
                  <span className="font-bold text-[#EEEFF3]">
                    ₹{(hoveredPoint.closingBalanceInPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {hoveredPoint.symbol && hoveredPoint.symbol !== 'INIT' && (
                  <>
                    <div>
                      <span className="text-[#686D7D]">Trade: </span>
                      <span className="font-bold text-[#9787FF]">
                        {hoveredPoint.symbol} {hoveredPoint.side} ({hoveredPoint.quantity})
                      </span>
                    </div>
                    <div>
                      <span className="text-[#686D7D]">P&L: </span>
                      <span
                        className={`font-bold ${
                          hoveredPoint.realizedPnLInPaise >= 0 ? 'text-[#34D399]' : 'text-[#F87171]'
                        }`}
                      >
                        {hoveredPoint.realizedPnLInPaise >= 0 ? '+' : ''}₹
                        {(hoveredPoint.realizedPnLInPaise / 100).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Skeleton Loading Overlay */}
            {!chartReady && (
              <div className="absolute inset-x-5 top-14 bottom-5 rounded-xl bg-[#21232C] animate-pulse flex flex-col items-center justify-center space-y-3 z-10">
                <div className="w-8 h-8 rounded-full border-2 border-[#7C6AEF] border-t-transparent animate-spin" />
                <p className="text-xs font-mono text-[#9A9FAE]">Initializing TradingView Equity Engine...</p>
              </div>
            )}

            <div ref={equityContainerRef} className="w-full h-[340px]" />
          </div>

          {/* Closed Trades History */}
          <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-[#EEEFF3]">Recent Closed Positions Audit Log</h2>

            {data.recentClosedTrades.length === 0 ? (
              <div className="p-8 text-center text-[#9A9FAE] text-xs">No closed trades recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#212330] text-[#686D7D] font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3">Symbol</th>
                      <th className="p-3">Side</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3 text-right">Realized P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#212330] text-[#9A9FAE]">
                    {data.recentClosedTrades.map((t) => {
                      const pnlInInr = t.realizedPnLInPaise / 100;
                      const isWin = pnlInInr >= 0;

                      return (
                        <tr key={t.id} className="hover:bg-[#21232C]">
                          <td className="p-3 font-mono font-bold text-[#EEEFF3]">{t.symbol}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.side === 'BUY'
                                  ? 'bg-[#34D399]/10 text-[#34D399]'
                                  : 'bg-[#F87171]/10 text-[#F87171]'
                              }`}
                            >
                              {t.side}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[#EEEFF3]">{t.quantity}</td>
                          <td className="p-3 font-mono">₹{(t.priceInPaise / 100).toFixed(2)}</td>
                          <td className="p-3 text-[#686D7D]">
                            {new Date(t.executedAt).toLocaleString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td
                            className={`p-3 font-mono font-bold text-right ${
                              isWin ? 'text-[#34D399]' : 'text-[#F87171]'
                            }`}
                          >
                            {isWin ? '+' : ''}₹{pnlInInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
