'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ChallengeTierDto, ChallengeType } from '@stockbattle/shared';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  Zap,
  Sparkles,
  CheckCircle2,
  Lock,
  CreditCard,
  ShieldCheck,
  Check,
  Info,
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
  warning: '#F5B450',
};

export default function ChallengesPage() {
  const [tiers, setTiers] = useState<ChallengeTierDto[]>([]);
  const [selectedType, setSelectedType] = useState<ChallengeType>(ChallengeType.TWO_STEP);
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Additional options matching stockbattle-dashboard configurator
  const [modelType, setModelType] = useState('Flex');

  const [promoCode, setPromoCode] = useState('SAVE20');
  const [discountApplied, setDiscountApplied] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{
    orderId: string;
    challengeId: string;
    amount: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    async function fetchTiers() {
      try {
        const { data } = await api.get('/api/challenges/tiers');
        const loadedTiers: ChallengeTierDto[] = data.tiers || [];
        setTiers(loadedTiers);
        if (loadedTiers.length > 0) {
          const twoStep = loadedTiers.find((t) => t.type === ChallengeType.TWO_STEP);
          setSelectedTierId(twoStep ? twoStep.id : loadedTiers[0].id);
        }
      } catch (err: any) {
        setError('Failed to load challenge tiers');
      } finally {
        setLoading(false);
      }
    }
    document.title = 'Evaluation Challenges | StockBattle';
    fetchTiers();
  }, []);

  const filteredTiers = tiers.filter((t) => t.type === selectedType);
  const selectedTier = tiers.find((t) => t.id === selectedTierId) || filteredTiers[0];

  const basePriceInInr = selectedTier ? selectedTier.priceInPaise / 100 : 0;
  const discountInInr = discountApplied ? basePriceInInr * 0.2 : 0;
  const totalPriceInInr = (basePriceInInr - discountInInr).toFixed(2);

  const handlePurchase = async () => {
    if (!selectedTier || !acceptedTerms) return;
    setError('');
    setPurchaseLoading(selectedTier.id);
    try {
      const { data } = await api.post('/api/challenges/purchase', { tierId: selectedTier.id });
      setPendingOrder({
        orderId: data.orderId,
        challengeId: data.challengeId,
        amount: Number(totalPriceInInr),
        name: `${selectedTier.type.replace('_', ' ')} - ${selectedTier.name}`,
      });
      setShowPaymentModal(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate purchase');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!pendingOrder) return;
    setShowPaymentModal(false);
    setSuccessModal(true);
    try {
      await api.post('/api/payments/razorpay/client-verify', {
        orderId: pendingOrder.orderId,
        paymentId: `pay_mock_${Math.random().toString(36).substring(7)}`,
        signature: `mock_sig_pay_mock_${pendingOrder.orderId}`,
      });

      await api.post('/api/payments/razorpay/mock-webhook-trigger', {
        orderId: pendingOrder.orderId,
        paymentId: `pay_mock_${Math.random().toString(36).substring(7)}`,
      });

      setTimeout(() => {
        window.location.href = '/trader';
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment confirmation failed');
      setSuccessModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Banner */}
      <div className="bg-[#7C6AEF]/15 border border-[#7C6AEF]/35 rounded-2xl p-3.5 px-5 flex items-center gap-3 text-xs font-semibold text-[#EEEFF3]">
        <Sparkles size={16} className="text-[#F5B450] shrink-0" />
        <span>
          <strong>SPECIAL OFFER: 20% OFF</strong> evaluation purchase | Use code{' '}
          <strong className="text-[#9787FF]">SAVE20</strong> at checkout
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-extrabold text-[#EEEFF3] tracking-tight">Buy Challenge Tier</h1>
          <p className="text-xs text-[#9A9FAE]">Customize evaluation parameters & account sizing</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Configurator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Options Column */}
        <div className="lg:col-span-8 space-y-5">
          {/* Challenge Type */}
          <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-[#EEEFF3]">1. Assessment Stage</h2>
            <p className="text-xs text-[#686D7D]">Select evaluation model tier</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { type: ChallengeType.TWO_STEP, label: '2 Step Evaluation' },
                { type: ChallengeType.ONE_STEP, label: '1 Step Flex' },
                { type: ChallengeType.INSTANT, label: 'Instant Funded' },
              ].map((t) => (
                <button
                  key={t.type}
                  onClick={() => {
                    setSelectedType(t.type);
                    const match = tiers.find((x) => x.type === t.type);
                    if (match) setSelectedTierId(match.id);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    selectedType === t.type
                      ? 'bg-[#7C6AEF]/15 border border-[#7C6AEF]/40 text-[#9787FF]'
                      : 'bg-[#21232C] border border-[#2B2E39] text-[#9A9FAE] hover:text-[#EEEFF3]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model Type */}
          <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-[#EEEFF3]">2. Trading Model</h2>
            <div className="flex gap-2">
              {['Standard', 'Pro', 'Flex'].map((m) => (
                <button
                  key={m}
                  onClick={() => setModelType(m)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    modelType === m
                      ? 'bg-[#7C6AEF]/15 border border-[#7C6AEF]/40 text-[#9787FF]'
                      : 'bg-[#21232C] border border-[#2B2E39] text-[#9A9FAE] hover:text-[#EEEFF3]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Account Capital Size Cards */}
          <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-[#EEEFF3]">3. Account Capital Size</h2>
            <p className="text-xs text-[#686D7D]">Select initial simulated trading capital</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredTiers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTierId(t.id)}
                  className={`p-4 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedTierId === t.id
                      ? 'bg-[#7C6AEF]/15 border-2 border-[#7C6AEF] text-[#9787FF]'
                      : 'bg-[#21232C] border border-[#2B2E39] text-[#9A9FAE] hover:border-[#7C6AEF]/30'
                  }`}
                >
                  <span className="font-mono text-base font-bold text-[#EEEFF3]">
                    ₹{(t.accountSize).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-[#686D7D]">Capital</span>
                </button>
              ))}
            </div>
          </div>

          {/* Per-Tier Rules & Parameters — PRD 1.2 */}
          {selectedTier && (
            <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#EEEFF3]">Rules & Parameters</h2>
                <span className="text-[10px] text-[#686D7D] font-mono">
                  {selectedTier.name} — ₹{selectedTier.accountSize.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-xs text-[#686D7D]">
                These are the exact evaluation rules for the selected tier. Breaching any limit results in immediate challenge failure.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* Daily Loss Limit */}
                <div className="bg-[#21232C] rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#686D7D] font-medium">
                    <Info size={10} />
                    Daily Loss Limit
                  </div>
                  <p className="font-mono text-base font-bold text-[#F87171]">
                    {selectedTier.dailyLossLimit}%
                  </p>
                  <p className="text-[10px] text-[#686D7D]">
                    Max intraday loss before failure
                  </p>
                </div>

                {/* Max Drawdown */}
                <div className="bg-[#21232C] rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#686D7D] font-medium">
                    <Info size={10} />
                    Max Drawdown
                  </div>
                  <p className="font-mono text-base font-bold text-[#F87171]">
                    {selectedTier.maxLoss}%
                  </p>
                  <p className="text-[10px] text-[#686D7D]">
                    Peak-to-trough limit
                  </p>
                </div>

                {/* Profit Target Phase 1 */}
                <div className="bg-[#21232C] rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#686D7D] font-medium">
                    <Info size={10} />
                    Phase 1 Target
                  </div>
                  <p className="font-mono text-base font-bold text-[#34D399]">
                    {selectedTier.targetPhase1}%
                  </p>
                  <p className="text-[10px] text-[#686D7D]">
                    Profit target to clear Phase 1
                  </p>
                </div>

                {/* Profit Target Phase 2 */}
                <div className="bg-[#21232C] rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#686D7D] font-medium">
                    <Info size={10} />
                    Phase 2 Target
                  </div>
                  <p className="font-mono text-base font-bold text-[#34D399]">
                    {selectedTier.targetPhase2 !== null ? `${selectedTier.targetPhase2}%` : 'N/A'}
                  </p>
                  <p className="text-[10px] text-[#686D7D]">
                    {selectedTier.targetPhase2 !== null ? 'Profit target to clear Phase 2' : 'Single-phase evaluation'}
                  </p>
                </div>

                {/* Min Trading Days */}
                <div className="bg-[#21232C] rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#686D7D] font-medium">
                    <Info size={10} />
                    Min Trading Days
                  </div>
                  <p className="font-mono text-base font-bold text-[#EEEFF3]">
                    {selectedTier.minTradingDays}
                  </p>
                  <p className="text-[10px] text-[#686D7D]">
                    Days you must trade before passing
                  </p>
                </div>

                {/* Profit Split */}
                <div className="bg-[#21232C] rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#686D7D] font-medium">
                    <Info size={10} />
                    Profit Split
                  </div>
                  <p className="font-mono text-base font-bold text-[#9787FF]">
                    {selectedTier.profitShare}%
                  </p>
                  <p className="text-[10px] text-[#686D7D]">
                    Your share of net simulated profits
                  </p>
                </div>
              </div>

              {/* Consistency Rule */}
              {selectedTier.consistencyRule !== null && (
                <div className="bg-[#F5B450]/10 border border-[#F5B450]/20 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <Info size={14} className="text-[#F5B450] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-[#F5B450]">
                        Consistency Rule — {selectedTier.consistencyRule}%
                      </p>
                      <p className="text-[10px] text-[#9A9FAE] mt-1">
                        No single day&apos;s profit may account for more than {selectedTier.consistencyRule}% of
                        your total profit at payout time. This ensures payouts reward consistent,
                        disciplined trading rather than concentrated risk-taking.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Method — Razorpay only */}
          <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-[#EEEFF3]">4. Payment Method</h2>
            <div className="w-full p-3.5 rounded-xl border bg-[#7C6AEF]/15 border-[#7C6AEF]/40 flex items-center justify-between text-xs font-semibold text-[#9787FF]">
              <div className="flex items-center gap-2.5">
                <CreditCard size={16} />
                <span>Razorpay (Card / UPI / NetBanking)</span>
              </div>
              <CheckCircle2 size={16} className="text-[#9787FF]" />
            </div>
          </div>

          {/* Terms Agreement Checkbox */}
          <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-4">
            <label className="flex items-start gap-3 cursor-pointer text-xs text-[#9A9FAE] leading-relaxed">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 accent-[#7C6AEF]"
              />
              <span>
                I have read and agree to the{' '}
                <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-[#9787FF] hover:underline">
                  Terms & Conditions
                </a>
                ,{' '}
                <a href="/legal/risk-disclosure" target="_blank" rel="noopener noreferrer" className="text-[#9787FF] hover:underline">
                  Risk Disclosure
                </a>
                , and{' '}
                <a href="/legal/refund-policy" target="_blank" rel="noopener noreferrer" className="text-[#9787FF] hover:underline">
                  Refund Policy
                </a>
                . I confirm that all submitted details match my official identification.
              </span>
            </label>
          </div>
        </div>

        {/* Side Checkout Summary Panel */}
        <div className="lg:col-span-4">
          <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl p-5 space-y-4 sticky top-6 shadow-xl">
            <h2 className="text-sm font-bold text-[#EEEFF3]">Order Summary</h2>

            {selectedTier && (
              <div className="space-y-2.5 text-xs text-[#9A9FAE]">
                <div className="flex justify-between">
                  <span>
                    ₹{selectedTier.accountSize.toLocaleString('en-IN')} {selectedTier.name}
                  </span>
                  <span className="font-mono text-[#EEEFF3]">₹{basePriceInInr.toLocaleString('en-IN')}</span>
                </div>

                {discountApplied && (
                  <div className="flex justify-between text-[#34D399]">
                    <span>Promo Code (SAVE20)</span>
                    <span className="font-mono">-₹{discountInInr.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="bg-[#21232C] border border-[#2B2E39] rounded-xl px-3 py-2 text-xs text-[#EEEFF3] outline-none flex-1 font-mono uppercase"
              />
              <button
                onClick={() => {
                  if (promoCode.toUpperCase() === 'SAVE20') setDiscountApplied(true);
                }}
                className="bg-[#282A35] hover:bg-[#21232C] border border-[#2B2E39] px-3.5 py-2 text-xs font-semibold text-[#EEEFF3] rounded-xl transition-colors"
              >
                Apply
              </button>
            </div>

            <div className="pt-3 border-t border-[#212330] flex justify-between items-center">
              <span className="text-xs font-bold text-[#EEEFF3]">Total due</span>
              <span className="font-mono text-xl font-extrabold text-[#9787FF]">
                ₹{Number(totalPriceInInr).toLocaleString('en-IN')}
              </span>
            </div>

            <button
              onClick={handlePurchase}
              disabled={!acceptedTerms || !selectedTier || purchaseLoading !== null}
              className="w-full py-3 bg-[#7C6AEF] hover:bg-[#9787FF] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#7C6AEF]/30"
            >
              {purchaseLoading ? <LoadingSpinner size="sm" /> : <ShieldCheck size={16} />}
              Continue to Encrypted Checkout
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#686D7D]">
              <Lock size={12} /> 256-Bit SSL Encrypted Razorpay Checkout
            </div>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {showPaymentModal && pendingOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1B1D24] border border-[#212330] rounded-2xl max-w-md w-full p-6 space-y-5 animate-fade-in shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#7C6AEF]/20 text-[#9787FF] mx-auto flex items-center justify-center">
                <CreditCard size={24} />
              </div>
              <h2 className="text-lg font-bold text-[#EEEFF3]">Complete Razorpay Sandbox Payment</h2>
              <p className="text-xs text-[#9A9FAE]">Order Reference: {pendingOrder.orderId}</p>
            </div>

            <div className="bg-[#21232C] p-4 rounded-xl space-y-2 text-xs font-mono text-[#EEEFF3]">
              <div className="flex justify-between">
                <span>Tier:</span>
                <span>{pendingOrder.name}</span>
              </div>
              <div className="flex justify-between border-t border-[#2B2E39] pt-2">
                <span>Total Amount:</span>
                <span className="font-bold text-[#34D399]">
                  ₹{pendingOrder.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 bg-[#282A35] hover:bg-[#21232C] border border-[#2B2E39] text-[#9A9FAE] text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSuccess}
                className="flex-1 py-2.5 bg-[#34D399] hover:bg-[#059669] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <Check size={15} /> Simulate Success Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Activation Overlay */}
      {successModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1B1D24] border border-[#34D399]/40 rounded-2xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#34D399]/15 border border-[#34D399]/40 text-[#34D399] flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#EEEFF3]">Payment Confirmed!</h3>
              <p className="text-xs text-[#9A9FAE] mt-1">
                Your simulated evaluation account has been activated. Launching health cockpit...
              </p>
            </div>
            <div className="pt-2">
              <div className="w-6 h-6 border-2 border-[#34D399] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
