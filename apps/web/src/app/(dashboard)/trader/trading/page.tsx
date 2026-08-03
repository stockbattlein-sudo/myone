'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { createChart, CandlestickSeries, ISeriesApi, CandlestickData } from 'lightweight-charts';
import {
  ChallengeStatus,
  UserChallengeDto,
  UserPositionDto,
  UserOrderDto,
  OrderSide,
  OrderType,
} from '@stockbattle/shared';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Circle,
  Zap,
  ShieldAlert,
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
  success: '#34D399',
  danger: '#F87171',
  warning: '#F5B450',
};

const AVAILABLE_SYMBOLS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'];

export default function TradingTerminal() {
  const [challenges, setChallenges] = useState<UserChallengeDto[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  
  const [positions, setPositions] = useState<UserPositionDto[]>([]);
  const [orders, setOrders] = useState<UserOrderDto[]>([]);
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [chartReady, setChartReady] = useState(false);

  const [side, setSide] = useState<OrderSide>(OrderSide.BUY);
  const [type, setType] = useState<OrderType>(OrderType.MARKET);
  const [quantity, setQuantity] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<string>('');

  // Confirmation modal state for large orders
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'>>(null);
  const chartRef = useRef<any>(null);
  const lastCandleRef = useRef<CandlestickData & { time: number }>(null);
  const socketRef = useRef<Socket>(null);

  // Symbol Persistence
  useEffect(() => {
    const savedSymbol = localStorage.getItem('stockbattle_selected_symbol');
    if (savedSymbol && AVAILABLE_SYMBOLS.includes(savedSymbol)) {
      setSelectedSymbol(savedSymbol);
    }
  }, []);

  const handleSymbolSelect = (sym: string) => {
    setSelectedSymbol(sym);
    localStorage.setItem('stockbattle_selected_symbol', sym);
  };

  useEffect(() => {
    async function loadChallenges() {
      try {
        const { data } = await api.get('/api/challenges/user');
        const valid = (data.challenges || []).filter(
          (c: UserChallengeDto) => c.status !== ChallengeStatus.PENDING_PAYMENT
        );
        setChallenges(valid);
        if (valid.length > 0) {
          setSelectedChallengeId(valid[0].id);
        }
      } catch (err) {
        console.error('Failed loading challenges:', err);
        setError('Failed loading active challenges. Purchase one first!');
      } finally {
        setLoading(false);
      }
    }
    document.title = 'Trading Sim Terminal | StockBattle';
    loadChallenges();
  }, []);

  const fetchChallengeData = async () => {
    if (!selectedChallengeId) return;
    try {
      const [posRes, ordRes] = await Promise.all([
        api.get(`/api/trading/positions?challengeId=${selectedChallengeId}`),
        api.get(`/api/trading/history?challengeId=${selectedChallengeId}&limit=50`),
      ]);
      setPositions(posRes.data.positions || []);
      setOrders(ordRes.data.orders || []);
    } catch (err) {
      console.error('Error fetching challenge data:', err);
    }
  };

  useEffect(() => {
    if (!selectedChallengeId) return;
    fetchChallengeData();
    const interval = setInterval(fetchChallengeData, 5000);
    return () => clearInterval(interval);
  }, [selectedChallengeId]);

  useEffect(() => {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    const socket = io(`${wsBase}/ticks`, {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('price-tick', (tick: { symbol: string; priceInPaise: number; timestamp: number }) => {
      const priceInInr = tick.priceInPaise / 100;
      setCurrentPrices((prev) => ({
        ...prev,
        [tick.symbol]: priceInInr,
      }));

      if (tick.symbol === selectedSymbol && candleSeriesRef.current && lastCandleRef.current) {
        const timeInSeconds = Math.floor(tick.timestamp / 1000);
        let lastCandle = lastCandleRef.current;
        const currentMinute = Math.floor(timeInSeconds / 60) * 60;

        try {
          if (!lastCandle || lastCandle.time !== currentMinute) {
            const newCandle: CandlestickData = {
              time: currentMinute as any,
              open: priceInInr,
              high: priceInInr,
              low: priceInInr,
              close: priceInInr,
            };
            candleSeriesRef.current.update(newCandle);
            lastCandleRef.current = newCandle as any;
          } else {
            const updatedCandle: CandlestickData = {
              time: currentMinute as any,
              open: lastCandle.open,
              high: Math.max(lastCandle.high, priceInInr),
              low: Math.min(lastCandle.low, priceInInr),
              close: priceInInr,
            };
            candleSeriesRef.current.update(updatedCandle);
            lastCandleRef.current = updatedCandle as any;
          }
        } catch (e) {
          console.warn('[TradingTerminal] WebSocket candle update skipped:', e);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedSymbol]);

  // Guaranteed Cold Load Chart Setup
  useEffect(() => {
    if (!chartContainerRef.current) return;
    setChartReady(false);

    let isSubscribed = true;

    const getWidth = () => {
      if (!chartContainerRef.current) return 780;
      const clientW = chartContainerRef.current.clientWidth;
      const rectW = chartContainerRef.current.getBoundingClientRect().width;
      const parentW = chartContainerRef.current.parentElement?.clientWidth;
      const candidate = Math.max(clientW, rectW, parentW ? parentW - 40 : 0);
      return candidate > 0 ? candidate : 780;
    };

    const initChart = (width: number) => {
      if (!chartContainerRef.current || !isSubscribed) return;

      console.log(`[TradingTerminal] Cold load chart init. Symbol: ${selectedSymbol}, Width: ${width}px`);
      chartContainerRef.current.innerHTML = '';

      try {
        const chart = createChart(chartContainerRef.current, {
          width: width,
          height: 380,
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
        });
        chartRef.current = chart;

        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#34D399',
          downColor: '#F87171',
          borderUpColor: '#34D399',
          borderDownColor: '#F87171',
          wickUpColor: '#34D399',
          wickDownColor: '#F87171',
        });

        const data: CandlestickData[] = [];
        const basePrice =
          selectedSymbol === 'RELIANCE'
            ? 2450
            : selectedSymbol === 'TCS'
            ? 3420
            : selectedSymbol === 'HDFCBANK'
            ? 1600
            : selectedSymbol === 'INFY'
            ? 1270
            : 960;
        const now = Math.floor(Date.now() / 1000);

        for (let i = 60; i >= 0; i--) {
          const time = (Math.floor(now / 60) - i) * 60;
          const change = (Math.random() - 0.5) * 10;
          const open = basePrice + change;
          const close = open + (Math.random() - 0.5) * 5;
          data.push({
            time: time as any,
            open,
            high: Math.max(open, close) + Math.random() * 3,
            low: Math.min(open, close) - Math.random() * 3,
            close,
          });
        }

        // Set historical data FIRST before exposing candleSeriesRef to websocket updates
        candleSeries.setData(data);
        lastCandleRef.current = data[data.length - 1] as any;
        candleSeriesRef.current = candleSeries as any;
      } catch (err) {
        console.error('[TradingTerminal] Error during chart initialization:', err);
      } finally {
        setChartReady(true);
      }
    };

    // 1. Immediate cold load initialization
    const initialWidth = getWidth();
    initChart(initialWidth);

    // 2. ResizeObserver for responsive width updates
    const resizeObserver = new ResizeObserver((entries) => {
      if (!isSubscribed) return;
      const observedWidth = entries[0]?.contentRect?.width || getWidth();
      if (observedWidth > 0) {
        if (!chartRef.current) {
          initChart(observedWidth);
        } else {
          chartRef.current.applyOptions({ width: observedWidth });
        }
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    // 3. Safety fallback timer
    const fallbackTimer = setTimeout(() => {
      if (isSubscribed && !chartRef.current && chartContainerRef.current) {
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
      candleSeriesRef.current = null;
    };
  }, [selectedSymbol, loading]);

  const executeOrder = async () => {
    if (!selectedChallengeId) return;
    setError('');
    setSuccessMsg('');
    setActionLoading(true);

    try {
      const payload = {
        challengeId: selectedChallengeId,
        symbol: selectedSymbol,
        side,
        type,
        quantity,
        limitPriceInPaise:
          type === OrderType.LIMIT && limitPrice ? Math.round(parseFloat(limitPrice) * 100) : undefined,
      };

      const { data } = await api.post('/api/trading/order', payload);
      setSuccessMsg(`Order #${data.order.id.slice(-6)} placed successfully (${side} ${quantity} ${selectedSymbol})`);
      fetchChallengeData();
    } catch (err: any) {
      console.error('Order placement failed:', err);
      setError(err.response?.data?.message || 'Failed to execute order');
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallengeId) {
      setError('Please select an active challenge');
      return;
    }

    const price = currentPrice;
    const positionValue = (type === OrderType.LIMIT && limitPrice ? parseFloat(limitPrice) : price) * quantity;

    // Relative confirmation threshold: order value > 50% of account capital OR quantity > 50% of max qty
    const isLargeOrder = positionValue > (ruleAccountSizeInInr * 0.5) || (maxPossibleQty > 0 && quantity > Math.max(50, Math.floor(maxPossibleQty * 0.5)));

    if (isLargeOrder) {
      setShowConfirmModal(true);
      return;
    }

    await executeOrder();
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.post(`/api/trading/order/${orderId}/cancel`);
      setSuccessMsg('Limit order cancelled successfully');
      fetchChallengeData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleClosePosition = async (symbolToClose: string) => {
    try {
      await api.post('/api/trading/position/close', {
        challengeId: selectedChallengeId,
        symbol: symbolToClose,
      });
      setSuccessMsg(`Closed all open positions for ${symbolToClose}`);
      fetchChallengeData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to square off position');
    }
  };

  const selectedChallenge = challenges.find((c) => c.id === selectedChallengeId);
  const currentPrice = currentPrices[selectedSymbol] || (selectedSymbol === 'RELIANCE' ? 2274.57 : 1000);
  const openOrders = orders.filter((o) => o.status === 'PENDING');

  const virtualBalanceInInr = selectedChallenge ? selectedChallenge.virtualBalanceInPaise / 100 : 100000;
  const ruleAccountSizeInInr = selectedChallenge ? (selectedChallenge.rulesSnapshot as any).accountSize || virtualBalanceInInr : 100000;

  // Exposure-Aware Buying Power Calculation
  const currentGrossExposureInInr = positions.reduce((sum, pos) => {
    const cp = currentPrices[pos.symbol] || pos.averagePriceInPaise / 100;
    return sum + Math.abs(pos.quantity) * cp;
  }, 0);

  const totalBuyingPowerInInr = virtualBalanceInInr * 10;
  const availableBuyingPowerInInr = Math.max(0, totalBuyingPowerInInr - currentGrossExposureInInr);
  const maxPossibleQty = currentPrice > 0 ? Math.floor(availableBuyingPowerInInr / currentPrice) : 1;

  const handleQuickQty = (pct: number) => {
    const calc = Math.max(1, Math.floor(maxPossibleQty * pct));
    setQuantity(calc);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fade-in font-sans">
      {/* Top Header */}
      <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#7C6AEF]/15 text-[#9787FF]">
            <ArrowLeftRight size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#EEEFF3] tracking-tight">StockBattle Simulated Terminal</h1>
            <p className="text-xs text-[#9A9FAE]">Sub-millisecond position execution engine</p>
          </div>
        </div>

        {challenges.length > 0 && (
          <select
            value={selectedChallengeId}
            onChange={(e) => setSelectedChallengeId(e.target.value)}
            className="bg-[#21232C] border border-[#2B2E39] text-[#EEEFF3] text-xs font-mono font-semibold rounded-xl px-3 py-2 outline-none focus:border-[#7C6AEF]"
          >
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.tier?.name || 'Challenge'} (ID: {c.id.slice(-6)}) — ₹
                {(c.virtualBalanceInPaise / 100).toLocaleString('en-IN')}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Floating Unmissable Bottom-Right Toast Stack */}
      {(error || successMsg) && (
        <div className="fixed bottom-6 right-6 z-50 space-y-2.5 max-w-md w-full animate-fade-in pointer-events-auto">
          {error && (
            <div className="p-4 rounded-2xl bg-[#1B1D24] border border-[#F87171]/40 text-[#F87171] text-xs font-semibold shadow-2xl flex items-center justify-between gap-3">
              <span>⚠️ {error}</span>
              <button onClick={() => setError('')} className="text-[#F87171] hover:bg-[#F87171]/20 w-6 h-6 rounded-lg flex items-center justify-center">×</button>
            </div>
          )}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-[#1B1D24] border border-[#34D399]/40 text-[#34D399] text-xs font-semibold shadow-2xl flex items-center justify-between gap-3">
              <span>✅ {successMsg}</span>
              <button onClick={() => setSuccessMsg('')} className="text-[#34D399] hover:bg-[#34D399]/20 w-6 h-6 rounded-lg flex items-center justify-center">×</button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-xs font-medium flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-[#F87171] font-bold">×</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] text-xs font-medium flex items-center justify-between">
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-[#34D399] font-bold">×</button>
        </div>
      )}

      {/* Breached / Failed Challenge Alert Banner */}
      {selectedChallenge && selectedChallenge.status === ChallengeStatus.FAILED && (
        <div className="p-4 rounded-2xl bg-[#F87171]/15 border border-[#F87171]/40 text-[#F87171] flex items-center justify-between gap-4 animate-fade-in shadow-xl">
          <div className="flex items-center gap-3">
            <AlertTriangle size={22} className="shrink-0 text-[#F87171]" />
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide flex items-center gap-2">
                <span>Trading Disabled: Account Failed & Breached</span>
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
            Buy New Challenge
          </Link>
        </div>
      )}

      {/* Main Grid: Chart + Ticker Bar Left, Order Execution Panel Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Ticker Bar + Chart */}
        <div className="lg:col-span-8 space-y-4">
          {/* Symbol Ticker Bar with Inline Open Position P&L */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {AVAILABLE_SYMBOLS.map((sym) => {
              const price = currentPrices[sym] || (sym === 'RELIANCE' ? 2274.57 : 1000);
              const isSelected = selectedSymbol === sym;
              
              // Open position in this symbol
              const pos = positions.find((p) => p.symbol === sym);
              const hasPos = !!pos;
              const posAvgP = pos ? pos.averagePriceInPaise / 100 : 0;
              const isLong = pos ? pos.quantity > 0 : true;
              const posPnl = pos
                ? isLong
                  ? (price - posAvgP) * pos.quantity
                  : (posAvgP - price) * Math.abs(pos.quantity)
                : 0;

              return (
                <button
                  key={sym}
                  onClick={() => handleSymbolSelect(sym)}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#7C6AEF] border-[#9787FF] text-white shadow-lg shadow-[#7C6AEF]/20 scale-[1.02]'
                      : 'bg-[#1B1D24] border-[#212330] text-[#9A9FAE] hover:border-[#2B2E39] hover:text-[#EEEFF3]'
                  }`}
                >
                  <span>{sym}</span>
                  <span className={isSelected ? 'text-white' : 'text-[#EEEFF3]'}>₹{price.toFixed(2)}</span>
                  {hasPos && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        posPnl >= 0 ? 'bg-[#34D399]/20 text-[#34D399]' : 'bg-[#F87171]/20 text-[#F87171]'
                      }`}
                    >
                      {posPnl >= 0 ? '+' : ''}₹{posPnl.toFixed(0)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Chart Container with Guaranteed Cold Load Loading Skeleton */}
          <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 shadow-lg space-y-3 relative">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#EEEFF3] font-mono tracking-wide">{selectedSymbol} 1M Candlestick</span>
              <span className="text-[#34D399] font-mono font-bold">
                Live: ₹{(currentPrices[selectedSymbol] || (selectedSymbol === 'RELIANCE' ? 2274.57 : 1000)).toFixed(2)}
              </span>
            </div>

            {/* Skeleton Overlay while Chart measures dimensions */}
            {!chartReady && (
              <div className="absolute inset-x-5 top-12 bottom-5 rounded-xl bg-[#21232C] animate-pulse flex flex-col items-center justify-center space-y-3 z-10">
                <div className="w-8 h-8 rounded-full border-2 border-[#7C6AEF] border-t-transparent animate-spin" />
                <p className="text-xs font-mono text-[#9A9FAE]">Rendering TradingView Candlesticks...</p>
              </div>
            )}

            <div ref={chartContainerRef} className="w-full h-[380px]" />
          </div>
        </div>

        {/* Right Column: Order Execution Panel */}
        <div className="lg:col-span-4">
          <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 shadow-lg space-y-4 sticky top-6">
            <h2 className="text-sm font-bold text-[#EEEFF3]">Order Execution</h2>

            <form onSubmit={handleOrderSubmit} className="space-y-4 text-xs">
              {/* Buy / Sell Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#21232C] rounded-xl border border-[#2B2E39]">
                <button
                  type="button"
                  onClick={() => setSide(OrderSide.BUY)}
                  className={`py-2 rounded-lg font-extrabold transition-all ${
                    side === OrderSide.BUY
                      ? 'bg-[#34D399] text-black shadow-md'
                      : 'text-[#9A9FAE] hover:text-[#EEEFF3]'
                  }`}
                >
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => setSide(OrderSide.SELL)}
                  className={`py-2 rounded-lg font-extrabold transition-all ${
                    side === OrderSide.SELL
                      ? 'bg-[#F87171] text-black shadow-md'
                      : 'text-[#9A9FAE] hover:text-[#EEEFF3]'
                  }`}
                >
                  SELL / SHORT
                </button>
              </div>

              {/* Order Type Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#21232C] rounded-xl border border-[#2B2E39]">
                <button
                  type="button"
                  onClick={() => setType(OrderType.MARKET)}
                  className={`py-1.5 rounded-lg font-bold transition-all ${
                    type === OrderType.MARKET
                      ? 'bg-[#7C6AEF] text-white'
                      : 'text-[#9A9FAE] hover:text-[#EEEFF3]'
                  }`}
                >
                  MARKET
                </button>
                <button
                  type="button"
                  onClick={() => setType(OrderType.LIMIT)}
                  className={`py-1.5 rounded-lg font-bold transition-all ${
                    type === OrderType.LIMIT
                      ? 'bg-[#7C6AEF] text-white'
                      : 'text-[#9A9FAE] hover:text-[#EEEFF3]'
                  }`}
                >
                  LIMIT
                </button>
              </div>

              {/* Quantity Field + Quick Select Percentage Buttons */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[#9A9FAE]">
                  <label>Quantity (Shares)</label>
                  <span className="text-[10px] font-mono">Max: {maxPossibleQty}</span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-[#21232C] border border-[#2B2E39] text-[#EEEFF3] font-mono font-bold rounded-xl px-3 py-2 outline-none focus:border-[#7C6AEF]"
                />
                
                {/* Quick Selection Buttons */}
                <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleQuickQty(0.25)}
                    className="py-1 rounded bg-[#21232C] border border-[#2B2E39] text-[#9A9FAE] hover:text-[#EEEFF3] hover:border-[#7C6AEF]"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickQty(0.5)}
                    className="py-1 rounded bg-[#21232C] border border-[#2B2E39] text-[#9A9FAE] hover:text-[#EEEFF3] hover:border-[#7C6AEF]"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickQty(0.75)}
                    className="py-1 rounded bg-[#21232C] border border-[#2B2E39] text-[#9A9FAE] hover:text-[#EEEFF3] hover:border-[#7C6AEF]"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickQty(1.0)}
                    className="py-1 rounded bg-[#21232C] border border-[#2B2E39] text-[#9787FF] font-bold hover:border-[#7C6AEF]"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Limit Price Input */}
              {type === OrderType.LIMIT && (
                <div className="space-y-1">
                  <label className="text-[#9A9FAE] block">Limit Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder={currentPrice ? currentPrice.toString() : '0.00'}
                    className="w-full bg-[#21232C] border border-[#2B2E39] text-[#EEEFF3] font-mono font-bold rounded-xl px-3 py-2 outline-none focus:border-[#7C6AEF]"
                  />
                </div>
              )}

              {/* Dynamic Trade Cost & Required Margin Display */}
              {quantity > 0 && (
                <div className="bg-[#21232C] border border-[#2B2E39] rounded-xl p-3.5 space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-center text-[#9A9FAE]">
                    <span>Position Value:</span>
                    <span className="font-bold text-[#EEEFF3]">
                      ₹{((type === OrderType.LIMIT && limitPrice ? parseFloat(limitPrice) : currentPrice) * quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#9A9FAE] pt-1.5 border-t border-[#2B2E39]">
                    <span>Required Margin (10x):</span>
                    <span className="font-bold text-[#34D399]">
                      ₹{(((type === OrderType.LIMIT && limitPrice ? parseFloat(limitPrice) : currentPrice) * quantity) / 10).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Dynamic Color-Coded Submit Button */}
              <button
                type="submit"
                disabled={actionLoading || !selectedChallengeId || selectedChallenge?.status === ChallengeStatus.FAILED}
                className={`w-full py-3 rounded-xl font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg ${
                  selectedChallenge?.status === ChallengeStatus.FAILED
                    ? 'bg-[#2B2E39] text-[#686D7D] cursor-not-allowed shadow-none'
                    : side === OrderSide.BUY
                    ? 'bg-[#34D399] hover:bg-[#22c55e] text-black shadow-[#34D399]/20'
                    : 'bg-[#F87171] hover:bg-[#ef4444] text-black shadow-[#F87171]/20'
                }`}
              >
                {actionLoading ? (
                  <LoadingSpinner size="sm" />
                ) : selectedChallenge?.status === ChallengeStatus.FAILED ? (
                  <>🔒 Account Breached — Trading Disabled</>
                ) : (
                  <>
                    <Zap size={16} /> Place {side} Order ({selectedSymbol})
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Large Order Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1B1D24] border border-[#F5B450]/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 text-[#F5B450]">
              <ShieldAlert size={28} />
              <h3 className="text-base font-bold text-[#EEEFF3]">Confirm Large Order</h3>
            </div>

            <p className="text-xs text-[#9A9FAE]">
              You are about to submit a high-exposure order. Please confirm order details before proceeding:
            </p>

            <div className="bg-[#21232C] border border-[#2B2E39] rounded-xl p-3.5 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-[#9A9FAE]">
                <span>Symbol / Action:</span>
                <span className="font-bold text-[#EEEFF3]">{selectedSymbol} ({side})</span>
              </div>
              <div className="flex justify-between text-[#9A9FAE]">
                <span>Quantity:</span>
                <span className="font-bold text-[#EEEFF3]">{quantity} shares</span>
              </div>
              <div className="flex justify-between text-[#9A9FAE]">
                <span>Position Value:</span>
                <span className="font-bold text-[#34D399]">
                  ₹{((type === OrderType.LIMIT && limitPrice ? parseFloat(limitPrice) : currentPrice) * quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#2B2E39] text-[#9A9FAE] font-bold text-xs hover:bg-[#21232C]"
              >
                Cancel
              </button>
              <button
                onClick={executeOrder}
                className="flex-1 py-2.5 rounded-xl bg-[#7C6AEF] hover:bg-[#6853e6] text-white font-bold text-xs shadow-lg shadow-[#7C6AEF]/20"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Positions & Orders Tabs */}
      <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex gap-3 border-b border-[#212330] pb-3">
          <button
            onClick={() => setActiveTab('positions')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'positions'
                ? 'bg-[#7C6AEF]/15 text-[#9787FF]'
                : 'text-[#686D7D] hover:text-[#EEEFF3]'
            }`}
          >
            Open Positions ({positions.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'orders'
                ? 'bg-[#7C6AEF]/15 text-[#9787FF]'
                : 'text-[#686D7D] hover:text-[#EEEFF3]'
            }`}
          >
            Pending Orders ({openOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-[#7C6AEF]/15 text-[#9787FF]'
                : 'text-[#686D7D] hover:text-[#EEEFF3]'
            }`}
          >
            Order History ({orders.length})
          </button>
        </div>

        {/* Tab 1: Positions */}
        {activeTab === 'positions' && (
          <div className="overflow-x-auto">
            {positions.length === 0 ? (
              <div className="p-8 text-center text-[#9A9FAE] text-xs space-y-1">
                <p className="font-semibold text-[#EEEFF3]">No open positions</p>
                <p className="text-[11px] text-[#686D7D]">
                  Place a BUY or SELL order using the execution panel above to start trading.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#212330] text-[#686D7D] font-bold uppercase text-[10px]">
                    <th className="p-3">Symbol</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Avg Price</th>
                    <th className="p-3">Current Price</th>
                    <th className="p-3">Unrealized P&L</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212330] text-[#9A9FAE]">
                  {positions.map((pos) => {
                    const cp = currentPrices[pos.symbol] || pos.averagePriceInPaise / 100;
                    const avgP = pos.averagePriceInPaise / 100;
                    const isLong = pos.quantity > 0;
                    const pnlInInr = isLong ? (cp - avgP) * pos.quantity : (avgP - cp) * Math.abs(pos.quantity);

                    return (
                      <tr key={pos.id} className="hover:bg-[#21232C]">
                        <td className="p-3 font-mono font-bold text-[#EEEFF3]">{pos.symbol}</td>
                        <td className="p-3 font-mono">{pos.quantity}</td>
                        <td className="p-3 font-mono">₹{avgP.toFixed(2)}</td>
                        <td className="p-3 font-mono">₹{cp.toFixed(2)}</td>
                        <td className={`p-3 font-mono font-bold ${pnlInInr >= 0 ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                          {pnlInInr >= 0 ? '+' : ''}₹{pnlInInr.toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleClosePosition(pos.symbol)}
                            className="px-3 py-1 bg-[#F87171]/10 text-[#F87171] hover:bg-[#F87171]/20 font-bold rounded-lg text-xs"
                          >
                            Square Off
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Orders */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            {openOrders.length === 0 ? (
              <div className="p-8 text-center text-[#9A9FAE] text-xs space-y-1">
                <p className="font-semibold text-[#EEEFF3]">No pending limit orders</p>
                <p className="text-[11px] text-[#686D7D]">
                  Limit orders waiting for target price triggers will be listed here.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#212330] text-[#686D7D] font-bold uppercase text-[10px]">
                    <th className="p-3">ID</th>
                    <th className="p-3">Symbol</th>
                    <th className="p-3">Side</th>
                    <th className="p-3">Limit Price</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212330] text-[#9A9FAE]">
                  {openOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#21232C]">
                      <td className="p-3 font-mono text-[11px] text-[#686D7D]">#{ord.id.slice(-8)}</td>
                      <td className="p-3 font-mono font-bold text-[#EEEFF3]">{ord.symbol}</td>
                      <td className="p-3 font-bold">{ord.side}</td>
                      <td className="p-3 font-mono">₹{(((ord as any).priceInPaise || (ord as any).limitPriceInPaise || 0) / 100).toFixed(2)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleCancelOrder(ord.id)}
                          className="px-3 py-1 bg-[#282A35] text-[#9A9FAE] hover:text-[#EEEFF3] font-semibold rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 3: Order History */}
        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-[#9A9FAE] text-xs space-y-1">
                <p className="font-semibold text-[#EEEFF3]">No order history recorded</p>
                <p className="text-[11px] text-[#686D7D]">
                  Executed market and limit orders for this challenge account will be archived here.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#212330] text-[#686D7D] font-bold uppercase text-[10px]">
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Symbol</th>
                    <th className="p-3">Side</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Realized P&L</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Executed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212330] text-[#9A9FAE]">
                  {orders.map((ord) => {
                    const o = ord as any;
                    const priceInInr = (o.priceInPaise || o.limitPriceInPaise || 0) / 100;
                    const pnlInInr = (o.realizedPnLInPaise || 0) / 100;
                    const hasPnl = o.realizedPnLInPaise !== null && o.realizedPnLInPaise !== undefined;

                    return (
                      <tr key={ord.id} className="hover:bg-[#21232C]">
                        <td className="p-3 font-mono text-[11px] text-[#686D7D]">#{ord.id.slice(-8)}</td>
                        <td className="p-3 font-mono font-bold text-[#EEEFF3]">{ord.symbol}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.side === OrderSide.BUY
                                ? 'bg-[#34D399]/10 text-[#34D399]'
                                : 'bg-[#F87171]/10 text-[#F87171]'
                            }`}
                          >
                            {ord.side}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px]">{ord.type}</td>
                        <td className="p-3 font-mono text-[#EEEFF3]">{ord.quantity}</td>
                        <td className="p-3 font-mono">₹{priceInInr.toFixed(2)}</td>
                        <td className="p-3 font-mono font-bold">
                          {hasPnl ? (
                            <span className={pnlInInr >= 0 ? 'text-[#34D399]' : 'text-[#F87171]'}>
                              {pnlInInr >= 0 ? '+' : ''}₹{pnlInInr.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-[#686D7D]">—</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.status === 'FILLED'
                                ? 'bg-[#34D399]/10 text-[#34D399]'
                                : ord.status === 'CANCELLED'
                                ? 'bg-[#F87171]/10 text-[#F87171]'
                                : 'bg-[#F5B450]/10 text-[#F5B450]'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td className="p-3 text-right text-[#686D7D] font-mono">
                          {new Date((ord as any).executedAt || ord.createdAt).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
