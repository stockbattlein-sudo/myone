import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  LayoutGrid, Wallet, ArrowLeftRight, BarChart3, Banknote, Settings,
  ChevronDown, ChevronRight, Check, AlertTriangle, KeyRound, Copy,
  Eye, EyeOff, Menu, Circle, ShieldCheck, Trophy, Award, Calendar,
  Wrench, Users, Search, Filter, ExternalLink, Download, Clock,
  Globe, DollarSign, Percent, ShieldAlert, Sparkles, CheckCircle2,
  XCircle, Zap, RefreshCw, Layers, CreditCard, Lock, Share2
} from "lucide-react";

// ---------------------------------------------------------------------------
// Design System Tokens (High-Craft Dark Aesthetics)
// ---------------------------------------------------------------------------
const T = {
  bg: "#14151A",
  bgElevated: "#1B1D24",
  bgElevated2: "#21232C",
  bgElevated3: "#282A35",
  border: "#2B2E39",
  borderSubtle: "#212330",
  textPrimary: "#EEEFF3",
  textSecondary: "#9A9FAE",
  textTertiary: "#686D7D",
  accent: "#7C6AEF",
  accentStrong: "#9787FF",
  accentSoft: "rgba(124,106,239,0.14)",
  accentBorder: "rgba(124,106,239,0.35)",
  success: "#34D399",
  successSoft: "rgba(52,211,153,0.13)",
  danger: "#F87171",
  dangerSoft: "rgba(248,113,113,0.13)",
  warning: "#F5B450",
  warningSoft: "rgba(245,180,80,0.13)",
};

// ---------------------------------------------------------------------------
// Mock Data Sets
// ---------------------------------------------------------------------------
const ACCOUNTS = [
  { id: "acc-1", category: "Funded", label: "Funded — $100K", size: "$100,000", status: "Active", balance: "$104,820", statusColor: "success" },
  { id: "acc-2", category: "Evaluation", label: "Evaluation — $50K, Phase 2", size: "$50,000", status: "In progress", balance: "$52,140", statusColor: "accent" },
  { id: "acc-3", category: "Competition", label: "Spring Championship", size: "$25,000", status: "Day 6 of 14", balance: "$26,910", statusColor: "warning" },
];

const EQUITY_DATA = [
  { d: "Jul 1", v: 100000 }, { d: "Jul 2", v: 100420 }, { d: "Jul 3", v: 100180 },
  { d: "Jul 4", v: 101050 }, { d: "Jul 5", v: 101800 }, { d: "Jul 6", v: 101540 },
  { d: "Jul 7", v: 102230 }, { d: "Jul 8", v: 102960 }, { d: "Jul 9", v: 102710 },
  { d: "Jul 10", v: 103400 }, { d: "Jul 11", v: 103120 }, { d: "Jul 12", v: 103890 },
  { d: "Jul 13", v: 104250 }, { d: "Jul 14", v: 103980 }, { d: "Jul 15", v: 104610 },
  { d: "Jul 16", v: 104340 }, { d: "Jul 17", v: 104970 }, { d: "Jul 18", v: 105320 },
  { d: "Jul 19", v: 105080 }, { d: "Jul 20", v: 105640 }, { d: "Jul 21", v: 104820 },
];

const AFFILIATE_DATA = [
  { d: "Jul 15", v: 120 }, { d: "Jul 16", v: 190 }, { d: "Jul 17", v: 240 },
  { d: "Jul 18", v: 310 }, { d: "Jul 19", v: 450 }, { d: "Jul 20", v: 380 },
  { d: "Jul 21", v: 520 }, { d: "Jul 22", v: 610 },
];

const RULES = [
  { label: "Max daily loss", used: 1.8, limit: 5, unit: "%", status: "ok" },
  { label: "Max drawdown", used: 4.1, limit: 10, unit: "%", status: "ok" },
  { label: "Minimum trading days", used: 14, limit: 10, unit: " days", status: "ok", metRule: true },
  { label: "Consistency rule", used: 38, limit: 35, unit: "% of profit", status: "watch" },
];

const SCORE = {
  total: 82,
  breakdown: [
    { label: "Consistency", value: 76, color: T.accent },
    { label: "Risk discipline", value: 91, color: T.success },
    { label: "Rule adherence", value: 79, color: T.accentStrong },
  ],
};

const LEADERBOARD_DATA = [
  { rank: 1, trader: "MOHAMED D", country: "🇺🇸 US", profit: "$117,566.91", profitPct: "+39.19%", winRatio: "32.3%", pair: "XAUUSD", avgWin: "$6,529.74", avgLoss: "-$1,988.45", duration: "4h 12m", trades: 124, streak: "5 Wins" },
  { rank: 2, trader: "VALENTINO V", country: "🇮🇹 IT", profit: "$94,320.50", profitPct: "+31.44%", winRatio: "68.4%", pair: "EURUSD", avgWin: "$3,410.20", avgLoss: "-$1,210.00", duration: "1h 45m", trades: 88, streak: "8 Wins" },
  { rank: 3, trader: "CHAUHAN H", country: "🇮🇳 IN", profit: "$88,140.00", profitPct: "+29.38%", winRatio: "54.1%", pair: "GBPUSD", avgWin: "$4,120.00", avgLoss: "-$1,850.50", duration: "6h 30m", trades: 152, streak: "3 Wins" },
  { rank: 4, trader: "JAGROOP D", country: "🇨🇦 CA", profit: "$76,900.25", profitPct: "+25.63%", winRatio: "61.2%", pair: "XAUUSD", avgWin: "$5,100.00", avgLoss: "-$2,100.00", duration: "2h 10m", trades: 64, streak: "4 Wins" },
  { rank: 5, trader: "ZHENAR I", country: "🇩🇪 DE", profit: "$71,450.80", profitPct: "+23.81%", winRatio: "49.8%", pair: "USDJPY", avgWin: "$2,890.00", avgLoss: "-$1,430.00", duration: "3h 05m", trades: 210, streak: "2 Loss" },
];

const ECONOMIC_EVENTS = [
  { id: "e1", time: "13:30", currency: "USD", event: "Core CPI (MoM)", impact: "High", prev: "0.2%", forecast: "0.3%", restricted: true },
  { id: "e2", time: "14:15", currency: "EUR", event: "ECB Press Conference", impact: "High", prev: "3.75%", forecast: "3.50%", restricted: true },
  { id: "e3", time: "15:00", currency: "GBP", event: "BOE Gov Bailey Speaks", impact: "Medium", prev: "-", forecast: "-", restricted: false },
  { id: "e4", time: "17:30", currency: "USD", event: "Crude Oil Inventories", impact: "Low", prev: "-2.5M", forecast: "+1.1M", restricted: false },
];

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "new-challenge", label: "Buy Challenge", icon: Zap, badge: "20% OFF" },
  { key: "accounts", label: "Accounts", icon: Wallet },
  { key: "trading", label: "Trading", icon: ArrowLeftRight },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "payouts", label: "Payouts", icon: Banknote },
  { key: "competitions", label: "Competitions", icon: Trophy },
  { key: "leaderboards", label: "Leaderboards", icon: Award },
  { key: "certificates", label: "Certificates", icon: ShieldCheck },
  { key: "calendar", label: "Economic Calendar", icon: Calendar },
  { key: "tools", label: "Trading Tools", icon: Wrench },
  { key: "affiliate", label: "Affiliate", icon: Users },
  { key: "predictions", label: "World Cup Predictions", icon: Sparkles },
  { key: "settings", label: "Settings", icon: Settings },
];

// ---------------------------------------------------------------------------
// Primitive UI Components
// ---------------------------------------------------------------------------
function StatusDot({ tone }) {
  const color = tone === "success" ? T.success : tone === "warning" ? T.warning : T.accent;
  return <span className="sb-dot" style={{ background: color, boxShadow: `0 0 0 3px ${color}22` }} />;
}

function Card({ children, className = "", style = {} }) {
  return <div className={`sb-card ${className}`} style={style}>{children}</div>;
}

function ScoreGauge({ value, size = 148 }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const dash = c * pct;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.bgElevated3} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#scoreGrad)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 8px ${T.accent}66)`, transition: "stroke-dasharray 0.6s ease" }}
      />
      <defs>
        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={T.accentStrong} />
          <stop offset="100%" stopColor={T.accent} />
        </linearGradient>
      </defs>
      <text x="50%" y="47%" textAnchor="middle" fontFamily="'IBM Plex Mono', monospace" fontSize="34" fontWeight="600" fill={T.textPrimary}>{value}</text>
      <text x="50%" y="64%" textAnchor="middle" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="11" fill={T.textTertiary} letterSpacing="0.5">/ 100</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Navigation Sidebar
// ---------------------------------------------------------------------------
function Sidebar({ collapsed, setCollapsed, active, setActive }) {
  return (
    <aside className="sb-sidebar" style={{ width: collapsed ? 76 : 240 }}>
      <div className="sb-sidebar-top">
        <div className="sb-logo">
          <div className="sb-logo-mark">SB</div>
          {!collapsed && <span className="sb-logo-text">StockBattle</span>}
        </div>
        <button className="sb-icon-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
          <Menu size={17} />
        </button>
      </div>

      <nav className="sb-nav">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              className={`sb-nav-item ${isActive ? "is-active" : ""}`}
              onClick={() => setActive(item.key)}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} strokeWidth={2} />
              {!collapsed && <span className="sb-nav-text">{item.label}</span>}
              {!collapsed && item.badge && <span className="sb-nav-tag">{item.badge}</span>}
              {isActive && !collapsed && <span className="sb-nav-active-bar" />}
            </button>
          );
        })}
      </nav>

      <div className="sb-sidebar-foot">
        {!collapsed ? (
          <div className="sb-plan-badge">
            <ShieldCheck size={14} color={T.accentStrong} />
            <span>Rule guard active</span>
          </div>
        ) : (
          <ShieldCheck size={16} color={T.accentStrong} />
        )}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Account Switcher Dropdown
// ---------------------------------------------------------------------------
function AccountSwitcher({ accounts, selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = accounts.find((a) => a.id === selectedId) || accounts[0];

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const grouped = useMemo(() => {
    const groups = {};
    accounts.forEach((a) => {
      groups[a.category] = groups[a.category] || [];
      groups[a.category].push(a);
    });
    return groups;
  }, [accounts]);

  return (
    <div className="sb-switcher" ref={ref}>
      <button className="sb-switcher-trigger" onClick={() => setOpen(!open)}>
        <StatusDot tone={selected.statusColor} />
        <div className="sb-switcher-trigger-text">
          <span className="sb-switcher-label">{selected.label}</span>
          <span className="sb-switcher-sub">{selected.balance} balance</span>
        </div>
        <ChevronDown size={16} color={T.textTertiary} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {open && (
        <div className="sb-switcher-panel">
          {Object.entries(grouped).map(([cat, accs]) => (
            <div key={cat} className="sb-switcher-group">
              <div className="sb-switcher-group-label">{cat}</div>
              {accs.map((a) => (
                <button
                  key={a.id}
                  className={`sb-switcher-row ${a.id === selectedId ? "is-selected" : ""}`}
                  onClick={() => { onSelect(a.id); setOpen(false); }}
                >
                  <StatusDot tone={a.statusColor} />
                  <div className="sb-switcher-row-text">
                    <span className="sb-switcher-row-title">{a.size} account</span>
                    <span className="sb-switcher-row-sub">{a.status}</span>
                  </div>
                  <span className="sb-switcher-row-balance">{a.balance}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// VIEW 1: Dashboard View
// ---------------------------------------------------------------------------
function DashboardView({ setActiveNav }) {
  const [expanded, setExpanded] = useState(false);
  const first = EQUITY_DATA[0].v;
  const last = EQUITY_DATA[EQUITY_DATA.length - 1].v;
  const todayPnl = 780;
  const todayPnlPct = ((todayPnl / last) * 100).toFixed(2);
  const totalPnl = last - first;
  const totalPct = ((totalPnl / first) * 100).toFixed(1);

  return (
    <div className="sb-view-container">
      <div className="sb-grid-top">
        <Card className="sb-score-card">
          <div className="sb-card-header">
            <div>
              <div className="sb-card-title">Trader Score</div>
              <div className="sb-card-subtitle">How you're doing, in one number</div>
            </div>
            <button className="sb-link-btn" onClick={() => setExpanded(!expanded)}>
              {expanded ? "Hide breakdown" : "See breakdown"}
              <ChevronRight size={14} style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
            </button>
          </div>

          <div className="sb-score-body">
            <ScoreGauge value={SCORE.total} />
            <div className="sb-score-caption">
              <span className="sb-score-caption-strong">Strong</span> — top 18% of funded traders this month
            </div>
          </div>

          {expanded && (
            <div className="sb-score-breakdown">
              {SCORE.breakdown.map((b) => (
                <div key={b.label} className="sb-score-bar-row">
                  <div className="sb-score-bar-labels">
                    <span>{b.label}</span>
                    <span className="sb-mono">{b.value}</span>
                  </div>
                  <div className="sb-score-bar-track">
                    <div className="sb-score-bar-fill" style={{ width: `${b.value}%`, background: b.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="sb-payout-card">
          <div className="sb-card-header">
            <div>
              <div className="sb-card-title">Next payout</div>
              <div className="sb-card-subtitle">Funded — $100K account</div>
            </div>
            <span className="sb-badge sb-badge-accent">On track</span>
          </div>

          <div className="sb-payout-date">Aug 4, 2026</div>
          <div className="sb-payout-sub">Eligible in 13 days, based on your current payout cycle</div>

          <div className="sb-progress-track">
            <div className="sb-progress-fill" style={{ width: "68%" }} />
          </div>
          <div className="sb-progress-labels">
            <span>68% of cycle complete</span>
            <span className="sb-mono">$4,820 est. payout</span>
          </div>

          <button className="sb-btn-primary sb-payout-btn" onClick={() => setActiveNav("payouts")}>Request early review</button>
        </Card>
      </div>

      <Card className="sb-equity-card">
        <div className="sb-card-header">
          <div>
            <div className="sb-card-title">Equity curve</div>
            <div className="sb-card-subtitle">Last 21 trading days</div>
          </div>
          <div className="sb-pnl-pill sb-pnl-pill-up">
            <span>Today</span>
            <span className="sb-mono">+${todayPnl.toLocaleString()} ({todayPnlPct}%)</span>
          </div>
        </div>

        <div className="sb-chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={EQUITY_DATA} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.accent} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={T.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={T.borderSubtle} />
              <XAxis dataKey="d" tick={{ fill: T.textTertiary, fontSize: 11 }} axisLine={{ stroke: T.border }} tickLine={false} interval={4} />
              <YAxis domain={["dataMin - 500", "dataMax + 500"]} tick={{ fill: T.textTertiary, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={44} />
              <ReferenceLine y={first} stroke={T.border} strokeDasharray="3 3" />
              <Tooltip contentStyle={{ background: T.bgElevated3, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 12 }} labelStyle={{ color: T.textSecondary }} formatter={(v) => [`$${v.toLocaleString()}`, "Equity"]} />
              <Area type="monotone" dataKey="v" stroke={T.accent} strokeWidth={2.25} fill="url(#equityFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="sb-equity-footer">
          <div>
            <span className="sb-equity-footer-label">Total gain</span>
            <span className="sb-mono sb-equity-footer-value" style={{ color: T.success }}>+${totalPnl.toLocaleString()} ({totalPct}%)</span>
          </div>
          <div>
            <span className="sb-equity-footer-label">Starting balance</span>
            <span className="sb-mono sb-equity-footer-value">${first.toLocaleString()}</span>
          </div>
          <div>
            <span className="sb-equity-footer-label">Current balance</span>
            <span className="sb-mono sb-equity-footer-value">${last.toLocaleString()}</span>
          </div>
        </div>
      </Card>

      <div className="sb-grid-bottom">
        <Card className="sb-rules-card">
          <div className="sb-card-header">
            <div>
              <div className="sb-card-title">Rule compliance</div>
              <div className="sb-card-subtitle">Everything that could end your account, at a glance</div>
            </div>
          </div>
          <div className="sb-rules-list">
            {RULES.map((r) => {
              const pct = Math.min(100, (r.used / r.limit) * 100);
              const tone = r.status === "watch" ? "warning" : "success";
              return (
                <div key={r.label} className="sb-rule-row">
                  <div className="sb-rule-row-top">
                    <div className="sb-rule-row-label">
                      {tone === "success" ? <Check size={14} color={T.success} /> : <AlertTriangle size={14} color={T.warning} />}
                      <span>{r.label}</span>
                    </div>
                    <span className="sb-mono sb-rule-row-value">
                      {r.metRule ? `${r.used}${r.unit} met` : `${r.used}${r.unit} of ${r.limit}${r.unit}`}
                    </span>
                  </div>
                  <div className="sb-rule-track">
                    <div className="sb-rule-fill" style={{ width: `${pct}%`, background: tone === "success" ? T.success : T.warning }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="sb-creds-card">
          <div className="sb-card-header">
            <div>
              <div className="sb-card-title">Platform login</div>
              <div className="sb-card-subtitle">Connect your trading terminal</div>
            </div>
            <div className="sb-badge sb-badge-success">
              <Circle size={7} fill={T.success} color={T.success} /> Connected
            </div>
          </div>
          <div className="sb-creds-field">
            <span className="sb-creds-field-label">Login ID</span>
            <span className="sb-mono sb-creds-field-value">8842019</span>
          </div>
          <div className="sb-creds-field">
            <span className="sb-creds-field-label">Server</span>
            <span className="sb-mono sb-creds-field-value">StockBattle-Live03</span>
          </div>
          <div className="sb-creds-field">
            <span className="sb-creds-field-label">Password</span>
            <span className="sb-mono sb-creds-field-value">Sb-Trade-88q2</span>
          </div>
          <button className="sb-btn-secondary sb-creds-btn" onClick={() => setActiveNav("trading")}>
            <KeyRound size={14} /> Open in trading terminal
          </button>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VIEW 2: Buy Challenge Configurator (`new-challenge`)
// ---------------------------------------------------------------------------
function BuyChallengeView() {
  const [challengeType, setChallengeType] = useState("2 Step");
  const [modelType, setModelType] = useState("Flex");
  const [swapFree, setSwapFree] = useState("No");
  const [rewardCycle, setRewardCycle] = useState("Biweekly - 85%");
  const [currency, setCurrency] = useState("USD");
  const [accountSize, setAccountSize] = useState("$100k");
  const [platform, setPlatform] = useState("MetaTrader 5");
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const basePrice = accountSize === "$100k" ? 555 : accountSize === "$50k" ? 315 : accountSize === "$25k" ? 185 : 99;
  const swapFee = swapFree === "Yes" ? 55.50 : 0;
  const platformFee = platform === "cTrader" ? 20 : 0;
  const discount = discountApplied ? basePrice * 0.2 : 0;
  const totalPrice = (basePrice + swapFee + platformFee - discount).toFixed(2);

  return (
    <div className="sb-view-container">
      <div className="sb-banner">
        <Sparkles size={16} color={T.warning} />
        <span><strong>HELLO: 20% OFF</strong> first purchase | Use code <strong>SAVE20</strong> at checkout</span>
      </div>

      <div className="sb-configurator-grid">
        <div className="sb-config-main">
          {/* Challenge Type */}
          <Card className="sb-config-section">
            <div className="sb-card-title">Challenge Type</div>
            <div className="sb-card-subtitle">Adjust your challenge parameters to match your trading style</div>
            <div className="sb-button-group">
              {["Zero", "1 Step Flex", "2 Step"].map((t) => (
                <button key={t} className={`sb-btn-toggle ${challengeType === t ? "is-selected" : ""}`} onClick={() => setChallengeType(t)}>
                  {t} {t === "1 Step Flex" && <span className="sb-pill-badge">New</span>}
                </button>
              ))}
            </div>
          </Card>

          {/* Model Type */}
          <Card className="sb-config-section">
            <div className="sb-card-title">Model Type</div>
            <div className="sb-button-group">
              {["Standard", "Pro", "Flex"].map((m) => (
                <button key={m} className={`sb-btn-toggle ${modelType === m ? "is-selected" : ""}`} onClick={() => setModelType(m)}>
                  {m}
                </button>
              ))}
            </div>
          </Card>

          {/* Account Size & Currency */}
          <Card className="sb-config-section">
            <div className="sb-flex-header">
              <div>
                <div className="sb-card-title">Account Size</div>
                <div className="sb-card-subtitle">Select simulated capital allocation</div>
              </div>
              <div className="sb-currency-pills">
                {["USD", "EUR", "GBP", "INR"].map((c) => (
                  <button key={c} className={`sb-pill-btn ${currency === c ? "is-selected" : ""}`} onClick={() => setCurrency(c)}>{c}</button>
                ))}
              </div>
            </div>
            <div className="sb-size-grid">
              {["$5k", "$10k", "$25k", "$50k", "$100k"].map((s) => (
                <button key={s} className={`sb-size-card ${accountSize === s ? "is-selected" : ""}`} onClick={() => setAccountSize(s)}>
                  <span className="sb-size-val">{s}</span>
                  <span className="sb-size-sub">Capital</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Trading Platform */}
          <Card className="sb-config-section">
            <div className="sb-card-title">Trading Platform</div>
            <div className="sb-button-group">
              {["MetaTrader 5", "MatchTrader", "cTrader"].map((p) => (
                <button key={p} className={`sb-btn-toggle ${platform === p ? "is-selected" : ""}`} onClick={() => setPlatform(p)}>
                  {p} {p === "cTrader" && <span className="sb-mono-sub">+$20.00</span>}
                </button>
              ))}
            </div>
          </Card>

          {/* Payment Method */}
          <Card className="sb-config-section">
            <div className="sb-card-title">Payment Method</div>
            <div className="sb-payment-list">
              {[
                { id: "Card", label: "Credit / Debit Card", icon: CreditCard },
                { id: "Crypto", label: "Cryptocurrency (USDT / BTC / ETH)", icon: DollarSign },
                { id: "PayPal", label: "PayPal Express Checkout", icon: Lock },
              ].map((pm) => {
                const Icon = pm.icon;
                return (
                  <button key={pm.id} className={`sb-payment-row ${paymentMethod === pm.id ? "is-selected" : ""}`} onClick={() => setPaymentMethod(pm.id)}>
                    <Icon size={18} color={paymentMethod === pm.id ? T.accentStrong : T.textSecondary} />
                    <span>{pm.label}</span>
                    {paymentMethod === pm.id && <CheckCircle2 size={16} color={T.accentStrong} style={{ marginLeft: "auto" }} />}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Terms Agreement */}
          <div className="sb-terms-checkbox">
            <label className="sb-checkbox-label">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
              <span>I have read and agreed to the Trading Objectives and Terms & Conditions. All information provided is correct and matches government-issued ID. I confirm that I am not a U.S. citizen or resident.</span>
            </label>
          </div>
        </div>

        {/* Right Checkout Panel */}
        <div className="sb-config-side">
          <Card className="sb-summary-card">
            <div className="sb-card-title">Order Summary</div>
            <div className="sb-summary-rows">
              <div className="sb-summary-row">
                <span>{accountSize} {challengeType} ({modelType})</span>
                <span className="sb-mono">${basePrice}.00</span>
              </div>
              {swapFee > 0 && (
                <div className="sb-summary-row">
                  <span>Swap Free Addon</span>
                  <span className="sb-mono">+${swapFee.toFixed(2)}</span>
                </div>
              )}
              {platformFee > 0 && (
                <div className="sb-summary-row">
                  <span>cTrader Addon</span>
                  <span className="sb-mono">+${platformFee.toFixed(2)}</span>
                </div>
              )}
              {discountApplied && (
                <div className="sb-summary-row sb-text-success">
                  <span>Promo Discount (SAVE20)</span>
                  <span className="sb-mono">-${discount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="sb-promo-box">
              <input type="text" placeholder="Promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="sb-input" />
              <button className="sb-btn-secondary" onClick={() => { if (promoCode.toUpperCase() === "SAVE20") setDiscountApplied(true); }}>Apply</button>
            </div>

            <div className="sb-summary-total">
              <span>Total due</span>
              <span className="sb-mono sb-total-val">${totalPrice}</span>
            </div>

            <button className="sb-btn-primary sb-checkout-btn" disabled={!acceptedTerms}>
              <ShieldCheck size={16} /> Continue to Encrypted Checkout
            </button>
            <div className="sb-security-badge">
              <Lock size={12} /> 256-Bit Encrypted PCI-DSS Checkout
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VIEW 3: Accounts Overview (`accounts`)
// ---------------------------------------------------------------------------
function AccountsView({ setActiveNav }) {
  return (
    <div className="sb-view-container">
      <div className="sb-page-header">
        <div>
          <h2 className="sb-page-title">Hey, KUNAL</h2>
          <p className="sb-page-subtitle">Your FundingPips account overview and active evaluation stages</p>
        </div>
        <button className="sb-btn-primary" onClick={() => setActiveNav("new-challenge")}>+ Buy New Challenge</button>
      </div>

      <div className="sb-kpi-grid">
        <Card className="sb-kpi-card">
          <span className="sb-kpi-label">TRADER RANK</span>
          <span className="sb-kpi-value">Bronze Tier 🥉</span>
        </Card>
        <Card className="sb-kpi-card">
          <span className="sb-kpi-label">REWARD COUNT</span>
          <span className="sb-mono sb-kpi-value">0 Rewards</span>
        </Card>
        <Card className="sb-kpi-card">
          <span className="sb-kpi-label">TOTAL REWARDS DISBURSED</span>
          <span className="sb-mono sb-kpi-value" style={{ color: T.success }}>$0.00</span>
        </Card>
      </div>

      <div className="sb-accounts-grid">
        {ACCOUNTS.map((a) => (
          <Card key={a.id} className="sb-account-card">
            <div className="sb-card-header">
              <div className="sb-flex-gap">
                <StatusDot tone={a.statusColor} />
                <div>
                  <div className="sb-card-title">{a.label}</div>
                  <div className="sb-card-subtitle">{a.category} Stage</div>
                </div>
              </div>
              <span className="sb-mono sb-acc-balance">{a.balance}</span>
            </div>
            <div className="sb-acc-stats">
              <div><span>Target</span><span className="sb-mono">$110,000</span></div>
              <div><span>Max Drawdown</span><span className="sb-mono">10.0%</span></div>
              <div><span>Status</span><span className="sb-badge sb-badge-accent">{a.status}</span></div>
            </div>
            <button className="sb-btn-secondary sb-full-btn" onClick={() => setActiveNav("trading")}>Launch Trading Platform</button>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VIEW 4: Economic Calendar (`calendar`)
// ---------------------------------------------------------------------------
function CalendarView() {
  const [day, setDay] = useState("Wed");
  const [impactFilter, setImpactFilter] = useState("All");

  const filtered = ECONOMIC_EVENTS.filter((e) => impactFilter === "All" || e.impact === impactFilter);

  return (
    <div className="sb-view-container">
      <div className="sb-page-header">
        <div>
          <h2 className="sb-page-title">Economic Calendar</h2>
          <p className="sb-page-subtitle">Track high-impact news releases and automated trading blackout windows</p>
        </div>
      </div>

      <Card className="sb-calendar-card">
        <div className="sb-calendar-toolbar">
          <div className="sb-day-selector">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
              <button key={d} className={`sb-pill-btn ${day === d ? "is-selected" : ""}`} onClick={() => setDay(d)}>{d}</button>
            ))}
          </div>

          <div className="sb-impact-selector">
            {["All", "High", "Medium", "Low"].map((imp) => (
              <button key={imp} className={`sb-pill-btn ${impactFilter === imp ? "is-selected" : ""}`} onClick={() => setImpactFilter(imp)}>{imp} Impact</button>
            ))}
          </div>
        </div>

        <div className="sb-table-wrap">
          <table className="sb-table">
            <thead>
              <tr>
                <th>TIME</th>
                <th>CURRENCY</th>
                <th>EVENT TYPE</th>
                <th>IMPACT</th>
                <th>PREVIOUS</th>
                <th>FORECAST</th>
                <th>RESTRICTION</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="sb-mono">{e.time}</td>
                  <td><span className="sb-currency-badge">{e.currency}</span></td>
                  <td className="sb-font-medium">{e.event}</td>
                  <td>
                    <span className={`sb-badge ${e.impact === "High" ? "sb-badge-danger" : "sb-badge-warning"}`}>
                      {e.impact}
                    </span>
                  </td>
                  <td className="sb-mono">{e.prev}</td>
                  <td className="sb-mono">{e.forecast}</td>
                  <td>
                    {e.restricted ? (
                      <span className="sb-badge sb-badge-danger"><ShieldAlert size={12} /> News Blackout</span>
                    ) : (
                      <span className="sb-badge sb-badge-success">Allowed</span>
                    )}
                  </td>
                  <td>
                    <button className="sb-icon-btn"><Calendar size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VIEW 5: Leaderboards (`leaderboards`)
// ---------------------------------------------------------------------------
function LeaderboardView() {
  return (
    <div className="sb-view-container">
      <div className="sb-page-header">
        <div>
          <h2 className="sb-page-title">Global Leaderboard</h2>
          <p className="sb-page-subtitle">Hall of Fame — Top performing funded traders across all evaluation tiers</p>
        </div>
      </div>

      <div className="sb-kpi-grid">
        <Card className="sb-records-card">
          <div className="sb-record-title">Highest Total Rewards</div>
          <div className="sb-mono sb-record-val" style={{ color: T.success }}>$319,755.43</div>
          <div className="sb-record-sub">Valentino V. 🇮🇹</div>
        </Card>
        <Card className="sb-records-card">
          <div className="sb-record-title">Longest Account Duration</div>
          <div className="sb-mono sb-record-val">968 Days</div>
          <div className="sb-record-sub">Chauhan H. 🇮🇳</div>
        </Card>
        <Card className="sb-records-card">
          <div className="sb-record-title">Highest Single Payout</div>
          <div className="sb-mono sb-record-val" style={{ color: T.accentStrong }}>$140,354.40</div>
          <div className="sb-record-sub">Jagroop D. 🇨🇦</div>
        </Card>
      </div>

      <Card className="sb-table-card">
        <div className="sb-table-wrap">
          <table className="sb-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>TRADER</th>
                <th>NET PROFIT</th>
                <th>RETURN %</th>
                <th>WIN RATIO</th>
                <th>PRIMARY PAIR</th>
                <th>AVG WIN</th>
                <th>AVG LOSS</th>
                <th>TRADES</th>
                <th>STREAK</th>
              </tr>
            </thead>
            <tbody>
              {LEADERBOARD_DATA.map((row) => (
                <tr key={row.rank}>
                  <td className="sb-mono sb-rank-cell">#{row.rank}</td>
                  <td className="sb-font-medium">{row.trader} <span className="sb-flag">{row.country}</span></td>
                  <td className="sb-mono sb-text-success">{row.profit}</td>
                  <td className="sb-mono">{row.profitPct}</td>
                  <td className="sb-mono">{row.winRatio}</td>
                  <td><span className="sb-mono-tag">{row.pair}</span></td>
                  <td className="sb-mono sb-text-success">{row.avgWin}</td>
                  <td className="sb-mono sb-text-danger">{row.avgLoss}</td>
                  <td className="sb-mono">{row.trades}</td>
                  <td><span className="sb-badge sb-badge-accent">{row.streak}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VIEW 6: Position Risk Calculator (`tools`)
// ---------------------------------------------------------------------------
function ToolsView() {
  const [balance, setBalance] = useState(100000);
  const [riskPct, setRiskPct] = useState(1.0);
  const [stopLossPips, setStopLossPips] = useState(20);

  const riskAmount = (balance * (riskPct / 100)).toFixed(2);
  const lotSize = (riskAmount / (stopLossPips * 10)).toFixed(2);

  return (
    <div className="sb-view-container">
      <div className="sb-page-header">
        <div>
          <h2 className="sb-page-title">Trading Tools</h2>
          <p className="sb-page-subtitle">Professional risk engines and position sizing calculators</p>
        </div>
      </div>

      <div className="sb-grid-top">
        <Card className="sb-calc-card">
          <div className="sb-card-title">Beta Position Risk Calculator</div>
          <div className="sb-card-subtitle">Calculate exact lot sizing based on account drawdown tolerance</div>

          <div className="sb-calc-form">
            <div className="sb-field-group">
              <label>Account Balance ($)</label>
              <input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} className="sb-input" />
            </div>

            <div className="sb-field-group">
              <label>Risk Tolerance (% of Balance)</label>
              <input type="number" step="0.1" value={riskPct} onChange={(e) => setRiskPct(Number(e.target.value))} className="sb-input" />
            </div>

            <div className="sb-field-group">
              <label>Stop Loss Distance (Pips)</label>
              <input type="number" value={stopLossPips} onChange={(e) => setStopLossPips(Number(e.target.value))} className="sb-input" />
            </div>
          </div>

          <div className="sb-calc-results">
            <div>
              <span className="sb-calc-res-label">Max Risk Amount</span>
              <span className="sb-mono sb-calc-res-val" style={{ color: T.danger }}>${riskAmount}</span>
            </div>
            <div>
              <span className="sb-calc-res-label">Recommended Lot Size</span>
              <span className="sb-mono sb-calc-res-val" style={{ color: T.accentStrong }}>{lotSize} Lots</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VIEW 7: Affiliate Dashboard (`affiliate`)
// ---------------------------------------------------------------------------
function AffiliateView() {
  const [copied, setCopied] = useState(false);
  const refLink = "https://app.stockbattle.in/register?referral_code=E79878BE";

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="sb-view-container">
      <div className="sb-page-header">
        <div>
          <h2 className="sb-page-title">Affiliate Portal</h2>
          <p className="sb-page-subtitle">Earn up to 15% commission on every evaluation purchase</p>
        </div>
      </div>

      <Card className="sb-affiliate-banner">
        <div className="sb-card-title">Your Referral Link</div>
        <div className="sb-copy-row">
          <input type="text" readOnly value={refLink} className="sb-input" />
          <button className="sb-btn-primary" onClick={handleCopy}>
            <Copy size={14} /> Copy Link
          </button>
        </div>
        {copied && <div className="sb-copied-toast">Referral link copied to clipboard!</div>}
      </Card>

      <div className="sb-kpi-grid">
        <Card className="sb-kpi-card">
          <span className="sb-kpi-label">TOTAL REFERRALS</span>
          <span className="sb-mono sb-kpi-value">12 Traders</span>
        </Card>
        <Card className="sb-kpi-card">
          <span className="sb-kpi-label">TOTAL PAID OUT</span>
          <span className="sb-mono sb-kpi-value" style={{ color: T.success }}>$1,450.00</span>
        </Card>
        <Card className="sb-kpi-card">
          <span className="sb-kpi-label">AVAILABLE COMMISSIONS</span>
          <span className="sb-mono sb-kpi-value" style={{ color: T.accentStrong }}>$320.00</span>
        </Card>
      </div>

      <Card className="sb-equity-card">
        <div className="sb-card-header">
          <div className="sb-card-title">Commission Earnings Growth</div>
        </div>
        <div className="sb-chart-wrap">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={AFFILIATE_DATA}>
              <CartesianGrid vertical={false} stroke={T.borderSubtle} />
              <XAxis dataKey="d" tick={{ fill: T.textTertiary, fontSize: 11 }} />
              <YAxis tick={{ fill: T.textTertiary, fontSize: 11 }} />
              <Bar dataKey="v" fill={T.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VIEW 8: Profile Settings (`settings`)
// ---------------------------------------------------------------------------
function SettingsView() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="sb-view-container">
      <div className="sb-page-header">
        <div>
          <h2 className="sb-page-title">Profile Settings</h2>
          <p className="sb-page-subtitle">Manage personal information and residential address verification</p>
        </div>
      </div>

      <Card className="sb-settings-card">
        <div className="sb-form-grid">
          <div className="sb-field-group">
            <label>Title</label>
            <select className="sb-input"><option>Mr.</option><option>Mrs.</option><option>Ms.</option></select>
          </div>
          <div className="sb-field-group">
            <label>First Name</label>
            <input type="text" defaultValue="KUNAL" className="sb-input" />
          </div>
          <div className="sb-field-group">
            <label>Last Name</label>
            <input type="text" defaultValue="GHANCHI" className="sb-input" />
          </div>
          <div className="sb-field-group">
            <label>Email Address</label>
            <input type="email" defaultValue="stockbattle.in@gmail.com" className="sb-input" />
          </div>
          <div className="sb-field-group">
            <label>Date of Birth</label>
            <input type="date" defaultValue="2005-03-18" className="sb-input" />
          </div>
          <div className="sb-field-group">
            <label>Country</label>
            <input type="text" defaultValue="India" className="sb-input" />
          </div>
        </div>

        <button className="sb-btn-primary" style={{ marginTop: 20 }} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1600); }}>
          Save Profile Changes
        </button>
        {saved && <span className="sb-copied-toast" style={{ marginLeft: 12 }}>Profile updated successfully!</span>}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Layout Shell
// ---------------------------------------------------------------------------
export default function StockBattleEnterpriseDashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedAccount, setSelectedAccount] = useState(ACCOUNTS[0].id);

  return (
    <div className="sb-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .sb-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: ${T.bg};
          color: ${T.textPrimary};
          display: flex;
          min-height: 100vh;
          width: 100%;
          border-radius: 0px;
          overflow: hidden;
        }
        .sb-mono { font-family: 'IBM Plex Mono', monospace; }
        .sb-font-medium { font-weight: 500; }

        /* Banner */
        .sb-banner {
          background: ${T.accentSoft};
          border: 1px solid ${T.accentBorder};
          border-radius: 12px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: ${T.textPrimary};
          margin-bottom: 22px;
        }

        /* Sidebar */
        .sb-sidebar {
          background: ${T.bgElevated};
          border-right: 1px solid ${T.borderSubtle};
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          transition: width .18s ease;
          padding: 18px 14px;
        }
        .sb-sidebar-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; padding: 0 4px; }
        .sb-logo { display: flex; align-items: center; gap: 10px; overflow: hidden; }
        .sb-logo-mark {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          background: linear-gradient(135deg, ${T.accentStrong}, ${T.accent});
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; letter-spacing: 0.3px; color: white;
        }
        .sb-logo-text { font-weight: 700; font-size: 15px; white-space: nowrap; }
        .sb-icon-btn {
          background: transparent; border: none; color: ${T.textTertiary};
          width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: background .12s, color .12s;
        }
        .sb-icon-btn:hover { background: ${T.bgElevated3}; color: ${T.textPrimary}; }

        .sb-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; overflow-y: auto; }
        .sb-nav-item {
          position: relative;
          display: flex; align-items: center; gap: 11px;
          background: transparent; border: none; cursor: pointer;
          color: ${T.textSecondary}; padding: 9px 11px; border-radius: 9px;
          font-family: inherit; font-size: 13.5px; font-weight: 500;
          transition: background .12s, color .12s;
          white-space: nowrap; overflow: hidden; text-align: left;
        }
        .sb-nav-item:hover { background: ${T.bgElevated2}; color: ${T.textPrimary}; }
        .sb-nav-item.is-active { background: ${T.accentSoft}; color: ${T.accentStrong}; }
        .sb-nav-active-bar { position: absolute; right: 8px; width: 5px; height: 5px; border-radius: 50%; background: ${T.accentStrong}; }
        .sb-nav-tag { font-size: 10px; font-weight: 700; background: ${T.warningSoft}; color: ${T.warning}; padding: 2px 6px; border-radius: 4px; marginLeft: auto; }

        .sb-sidebar-foot { margin-top: 14px; }
        .sb-plan-badge {
          display: flex; align-items: center; gap: 8px;
          background: ${T.accentSoft}; border: 1px solid ${T.accentBorder};
          border-radius: 10px; padding: 9px 11px; font-size: 12px; color: ${T.textSecondary};
        }

        /* Main Shell */
        .sb-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .sb-topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 28px; border-bottom: 1px solid ${T.borderSubtle};
          flex-shrink: 0; background: ${T.bgElevated};
        }
        .sb-topbar-right { display: flex; align-items: center; gap: 12px; }
        .sb-avatar {
          width: 34px; height: 34px; border-radius: 50%; background: ${T.accentSoft};
          border: 1px solid ${T.accentBorder}; display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: ${T.accentStrong};
        }

        .sb-content { padding: 26px 28px 34px; overflow-y: auto; flex: 1; }
        .sb-view-container { display: flex; flex-direction: column; gap: 20px; }

        /* Grids & Cards */
        .sb-grid-top { display: grid; grid-template-columns: 1fr 1.3fr; gap: 18px; }
        .sb-grid-bottom { display: grid; grid-template-columns: 1.4fr 1fr; gap: 18px; }
        .sb-kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .sb-accounts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; }

        .sb-card {
          background: ${T.bgElevated};
          border: 1px solid ${T.borderSubtle};
          border-radius: 16px;
          padding: 20px 22px;
          box-shadow: 0 1px 0 rgba(0,0,0,0.2), 0 8px 24px -18px rgba(0,0,0,0.5);
        }
        .sb-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .sb-card-title { font-size: 15px; font-weight: 700; letter-spacing: -0.1px; }
        .sb-card-subtitle { font-size: 12.5px; color: ${T.textTertiary}; margin-top: 2px; }

        .sb-page-header { display: flex; justify-content: space-between; align-items: center; }
        .sb-page-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .sb-page-subtitle { font-size: 13px; color: ${T.textTertiary}; margin-top: 2px; }

        /* Buttons & Controls */
        .sb-btn-primary {
          background: ${T.accent}; color: white; border: none; border-radius: 10px;
          font-family: inherit; font-size: 13px; font-weight: 600; padding: 10px 16px;
          cursor: pointer; transition: background .12s; display: inline-flex; align-items: center; gap: 8px; justify-content: center;
        }
        .sb-btn-primary:hover { background: ${T.accentStrong}; }
        .sb-btn-secondary {
          background: ${T.bgElevated3}; color: ${T.textPrimary}; border: 1px solid ${T.border};
          border-radius: 10px; font-family: inherit; font-size: 13px; font-weight: 600;
          padding: 10px 16px; cursor: pointer; transition: border-color .12s; display: inline-flex; align-items: center; gap: 8px; justify-content: center;
        }
        .sb-btn-secondary:hover { border-color: ${T.accentBorder}; color: ${T.accentStrong}; }
        .sb-full-btn { width: 100%; margin-top: 14px; }

        .sb-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 600; padding: 5px 10px; border-radius: 100px; white-space: nowrap;
        }
        .sb-badge-accent { background: ${T.accentSoft}; color: ${T.accentStrong}; }
        .sb-badge-success { background: ${T.successSoft}; color: ${T.success}; }
        .sb-badge-danger { background: ${T.dangerSoft}; color: ${T.danger}; }
        .sb-badge-warning { background: ${T.warningSoft}; color: ${T.warning}; }

        .sb-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* Account Switcher */
        .sb-switcher { position: relative; }
        .sb-switcher-trigger {
          display: flex; align-items: center; gap: 10px;
          background: ${T.bgElevated}; border: 1px solid ${T.border};
          border-radius: 12px; padding: 8px 12px; cursor: pointer;
          font-family: inherit; color: ${T.textPrimary}; min-width: 240px; text-align: left;
        }
        .sb-switcher-trigger-text { display: flex; flex-direction: column; flex: 1; }
        .sb-switcher-label { font-size: 13px; font-weight: 600; }
        .sb-switcher-sub { font-size: 11.5px; color: ${T.textTertiary}; }
        .sb-switcher-panel {
          position: absolute; top: calc(100% + 8px); left: 0; z-index: 50;
          width: 320px; background: ${T.bgElevated2}; border: 1px solid ${T.border};
          border-radius: 14px; padding: 10px; box-shadow: 0 20px 40px -12px rgba(0,0,0,0.6);
        }
        .sb-switcher-group-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: ${T.textTertiary}; padding: 8px 10px 4px; }
        .sb-switcher-row {
          width: 100%; display: flex; align-items: center; gap: 10px;
          background: transparent; border: none; border-radius: 9px; padding: 8px 10px;
          cursor: pointer; text-align: left; font-family: inherit;
        }
        .sb-switcher-row:hover { background: ${T.bgElevated3}; }
        .sb-switcher-row.is-selected { background: ${T.accentSoft}; }
        .sb-switcher-row-title { font-size: 12.5px; font-weight: 600; color: ${T.textPrimary}; }
        .sb-switcher-row-sub { font-size: 11px; color: ${T.textTertiary}; }
        .sb-switcher-row-balance { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: ${T.textSecondary}; margin-left: auto; }

        /* Score Card */
        .sb-score-body { display: flex; align-items: center; gap: 20px; }
        .sb-score-caption { font-size: 13px; color: ${T.textSecondary}; line-height: 1.5; }
        .sb-score-caption-strong { color: ${T.success}; font-weight: 700; }
        .sb-score-breakdown { margin-top: 18px; padding-top: 16px; border-top: 1px solid ${T.borderSubtle}; display: flex; flex-direction: column; gap: 12px; }
        .sb-score-bar-row { display: flex; flex-direction: column; gap: 5px; }
        .sb-score-bar-labels { display: flex; justify-content: space-between; font-size: 12px; color: ${T.textSecondary}; }
        .sb-score-bar-track { height: 6px; border-radius: 4px; background: ${T.bgElevated3}; overflow: hidden; }
        .sb-score-bar-fill { height: 100%; border-radius: 4px; transition: width .5s ease; }

        /* Payout & Progress */
        .sb-payout-date { font-family: 'IBM Plex Mono', monospace; font-size: 26px; font-weight: 600; margin-top: 4px; }
        .sb-payout-sub { font-size: 12.5px; color: ${T.textTertiary}; margin-top: 4px; margin-bottom: 16px; }
        .sb-progress-track { height: 8px; border-radius: 4px; background: ${T.bgElevated3}; overflow: hidden; }
        .sb-progress-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, ${T.accent}, ${T.accentStrong}); }
        .sb-progress-labels { display: flex; justify-content: space-between; font-size: 11.5px; color: ${T.textTertiary}; margin-top: 7px; }
        .sb-payout-btn { width: 100%; margin-top: 16px; }

        /* Equity Card */
        .sb-pnl-pill-up span:last-child { color: ${T.success}; font-size: 14px; font-weight: 600; }
        .sb-chart-wrap { margin: 4px -6px 0; }
        .sb-equity-footer { display: flex; gap: 28px; margin-top: 14px; padding-top: 14px; border-top: 1px solid ${T.borderSubtle}; }
        .sb-equity-footer > div { display: flex; flex-direction: column; gap: 2px; }
        .sb-equity-footer-label { font-size: 11px; color: ${T.textTertiary}; }
        .sb-equity-footer-value { font-size: 13.5px; font-weight: 600; color: ${T.textPrimary}; }

        /* Rules Card */
        .sb-rules-list { display: flex; flex-direction: column; gap: 14px; }
        .sb-rule-row { display: flex; flex-direction: column; gap: 6px; }
        .sb-rule-row-top { display: flex; align-items: center; justify-content: space-between; }
        .sb-rule-row-label { display: flex; align-items: center; gap: 7px; font-size: 13px; color: ${T.textPrimary}; }
        .sb-rule-row-value { font-size: 11.5px; color: ${T.textTertiary}; }
        .sb-rule-track { height: 5px; border-radius: 3px; background: ${T.bgElevated3}; overflow: hidden; }
        .sb-rule-fill { height: 100%; border-radius: 3px; }

        /* Configurator Components */
        .sb-configurator-grid { display: grid; grid-template-columns: 1fr 340px; gap: 20px; }
        .sb-config-main { display: flex; flex-direction: column; gap: 18px; }
        .sb-button-group { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
        .sb-btn-toggle {
          background: ${T.bgElevated2}; border: 1px solid ${T.border}; color: ${T.textSecondary};
          padding: 10px 16px; border-radius: 10px; font-family: inherit; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all .12s ease; display: inline-flex; align-items: center; gap: 8px;
        }
        .sb-btn-toggle.is-selected { background: ${T.accentSoft}; border-color: ${T.accentBorder}; color: ${T.accentStrong}; }
        .sb-pill-badge { font-size: 10px; font-weight: 700; background: ${T.warningSoft}; color: ${T.warning}; padding: 2px 6px; border-radius: 4px; }
        .sb-mono-sub { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: ${T.textTertiary}; }

        .sb-flex-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .sb-currency-pills { display: flex; gap: 6px; }
        .sb-pill-btn {
          background: ${T.bgElevated3}; border: 1px solid ${T.border}; color: ${T.textTertiary};
          padding: 5px 10px; border-radius: 7px; font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
        }
        .sb-pill-btn.is-selected { background: ${T.accent}; color: white; border-color: ${T.accent}; }

        .sb-size-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 12px; }
        .sb-size-card {
          background: ${T.bgElevated2}; border: 1px solid ${T.border}; border-radius: 12px;
          padding: 14px 10px; text-align: center; cursor: pointer; transition: all .12s; display: flex; flex-direction: column; gap: 4px;
        }
        .sb-size-card.is-selected { background: ${T.accentSoft}; border-color: ${T.accentBorder}; }
        .sb-size-val { font-family: 'IBM Plex Mono', monospace; font-size: 15px; font-weight: 700; color: ${T.textPrimary}; }
        .sb-size-card.is-selected .sb-size-val { color: ${T.accentStrong}; }
        .sb-size-sub { font-size: 11px; color: ${T.textTertiary}; }

        .sb-payment-list { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
        .sb-payment-row {
          background: ${T.bgElevated2}; border: 1px solid ${T.border}; border-radius: 10px;
          padding: 12px 14px; display: flex; align-items: center; gap: 12px; cursor: pointer;
          color: ${T.textPrimary}; font-family: inherit; font-size: 13px; font-weight: 500; text-align: left;
        }
        .sb-payment-row.is-selected { border-color: ${T.accentBorder}; background: ${T.accentSoft}; }

        .sb-terms-checkbox { background: ${T.bgElevated2}; border: 1px solid ${T.borderSubtle}; border-radius: 12px; padding: 14px 16px; }
        .sb-checkbox-label { display: flex; gap: 12px; font-size: 12px; color: ${T.textSecondary}; line-height: 1.5; cursor: pointer; }
        .sb-checkbox-label input { margin-top: 2px; accent-color: ${T.accent}; }

        .sb-summary-card { position: sticky; top: 20px; }
        .sb-summary-rows { display: flex; flex-direction: column; gap: 10px; margin: 16px 0; }
        .sb-summary-row { display: flex; justify-content: space-between; font-size: 12.5px; color: ${T.textSecondary}; }
        .sb-promo-box { display: flex; gap: 8px; margin-bottom: 16px; }
        .sb-input {
          background: ${T.bgElevated2}; border: 1px solid ${T.border}; border-radius: 8px;
          padding: 9px 12px; color: ${T.textPrimary}; font-family: inherit; font-size: 13px; width: 100%; outline: none;
        }
        .sb-input:focus { border-color: ${T.accentBorder}; }

        .sb-summary-total {
          display: flex; justify-content: space-between; align-items: center;
          padding-top: 14px; border-top: 1px solid ${T.borderSubtle}; margin-bottom: 16px; font-size: 14px; font-weight: 700;
        }
        .sb-total-val { font-size: 22px; color: ${T.accentStrong}; }
        .sb-checkout-btn { width: 100%; padding: 12px; font-size: 14px; }
        .sb-security-badge { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 11px; color: ${T.textTertiary}; margin-top: 12px; }

        /* KPI Cards */
        .sb-kpi-card { display: flex; flex-direction: column; gap: 6px; }
        .sb-kpi-label { font-size: 10.5px; font-weight: 700; color: ${T.textTertiary}; letter-spacing: 0.5px; }
        .sb-kpi-value { font-size: 20px; font-weight: 700; color: ${T.textPrimary}; }

        /* Tables */
        .sb-table-wrap { overflow-x: auto; margin-top: 12px; }
        .sb-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 12.5px; }
        .sb-table th { padding: 10px 14px; font-size: 10.5px; font-weight: 700; color: ${T.textTertiary}; border-bottom: 1px solid ${T.borderSubtle}; text-transform: uppercase; }
        .sb-table td { padding: 12px 14px; border-bottom: 1px solid ${T.borderSubtle}; color: ${T.textSecondary}; }
        .sb-rank-cell { font-weight: 700; color: ${T.accentStrong}; }
        .sb-text-success { color: ${T.success}; }
        .sb-text-danger { color: ${T.danger}; }
        .sb-mono-tag { font-family: 'IBM Plex Mono', monospace; background: ${T.bgElevated3}; padding: 3px 6px; border-radius: 5px; font-size: 11px; }

        /* Form Grid */
        .sb-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 14px; }
        .sb-field-group { display: flex; flex-direction: column; gap: 6px; }
        .sb-field-group label { font-size: 12px; font-weight: 600; color: ${T.textSecondary}; }

        /* Calculator Results */
        .sb-calc-card { width: 100%; max-width: 480px; }
        .sb-calc-form { display: flex; flex-direction: column; gap: 14px; margin-top: 16px; }
        .sb-calc-results {
          background: ${T.bgElevated2}; border: 1px solid ${T.borderSubtle}; border-radius: 12px;
          padding: 16px; display: flex; justify-content: space-between; margin-top: 18px;
        }
        .sb-calc-res-label { font-size: 11px; color: ${T.textTertiary}; }
        .sb-calc-res-val { font-size: 20px; font-weight: 700; margin-top: 2px; display: block; }

        .sb-copy-row { display: flex; gap: 10px; margin-top: 12px; }
        .sb-copied-toast { font-size: 11.5px; color: ${T.success}; margin-top: 6px; }
        .sb-currency-badge { font-weight: 700; background: ${T.bgElevated3}; padding: 3px 7px; border-radius: 5px; font-size: 11px; color: ${T.textPrimary}; }
        .sb-calendar-toolbar { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }

        @media (max-width: 900px) {
          .sb-grid-top, .sb-grid-bottom, .sb-configurator-grid { grid-template-columns: 1fr; }
          .sb-kpi-grid, .sb-size-grid { grid-template-columns: repeat(2, 1fr); }
          .sb-topbar { flex-wrap: wrap; gap: 12px; }
        }
      `}</style>

      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} active={activeNav} setActive={setActiveNav} />

      {/* Main App Container */}
      <div className="sb-main">
        {/* Sticky Header Topbar */}
        <div className="sb-topbar">
          <AccountSwitcher accounts={ACCOUNTS} selectedId={selectedAccount} onSelect={setSelectedAccount} />
          <div className="sb-topbar-right">
            <button className="sb-btn-secondary" style={{ margin: 0, padding: "8px 14px" }} onClick={() => setActiveNav("trading")}>
              Launch Terminal
            </button>
            <div className="sb-avatar">KG</div>
          </div>
        </div>

        {/* Dynamic Route Content */}
        <div className="sb-content">
          {activeNav === "dashboard" && <DashboardView setActiveNav={setActiveNav} />}
          {activeNav === "new-challenge" && <BuyChallengeView />}
          {activeNav === "accounts" && <AccountsView setActiveNav={setActiveNav} />}
          {activeNav === "calendar" && <CalendarView />}
          {activeNav === "leaderboards" && <LeaderboardView />}
          {activeNav === "tools" && <ToolsView />}
          {activeNav === "affiliate" && <AffiliateView />}
          {activeNav === "settings" && <SettingsView />}
          {activeNav === "payouts" && <DashboardView setActiveNav={setActiveNav} />}
          {activeNav === "trading" && <DashboardView setActiveNav={setActiveNav} />}
          {activeNav === "analytics" && <DashboardView setActiveNav={setActiveNav} />}
          {activeNav === "competitions" && <LeaderboardView />}
          {activeNav === "certificates" && <DashboardView setActiveNav={setActiveNav} />}
          {activeNav === "predictions" && <LeaderboardView />}
        </div>
      </div>
    </div>
  );
}
