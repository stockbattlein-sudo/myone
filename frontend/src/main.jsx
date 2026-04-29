import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { joinWaitlist, getWaitlistCount, getAdminWaitlist } from './api';
import './index.css';

// Cursor
const Cursor = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const ringRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    let animationFrameId;
    const animRing = () => {
      ringPos.current.x += (pos.x - ringPos.current.x) * 0.13;
      ringPos.current.y += (pos.y - ringPos.current.y) * 0.13;
      if (ringRef.current) {
        ringRef.current.style.left = ringPos.current.x + 'px';
        ringRef.current.style.top = ringPos.current.y + 'px';
      }
      animationFrameId = requestAnimationFrame(animRing);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animRing();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [pos.x, pos.y]);

  useEffect(() => {
    const handleEnter = () => {
      if(ringRef.current) {
        ringRef.current.style.transform = 'translate(-50%,-50%) scale(1.8)';
        ringRef.current.style.borderColor = 'rgba(0,212,106,0.55)';
      }
    };
    const handleLeave = () => {
      if(ringRef.current) {
        ringRef.current.style.transform = 'translate(-50%,-50%) scale(1)';
        ringRef.current.style.borderColor = 'rgba(0,212,106,0.35)';
      }
    };

    const interactables = document.querySelectorAll('button,a,select,input,.faq-item');
    interactables.forEach(el => {
      el.addEventListener('mouseenter', handleEnter);
      el.addEventListener('mouseleave', handleLeave);
    });

    return () => {
      interactables.forEach(el => {
        el.removeEventListener('mouseenter', handleEnter);
        el.removeEventListener('mouseleave', handleLeave);
      });
    };
  });

  return (
    <>
      <div className="cursor" style={{ left: pos.x + 'px', top: pos.y + 'px' }}></div>
      <div className="cursor-ring" ref={ringRef}></div>
    </>
  );
};

const Navbar = () => (
  <nav>
    <div className="logo">Stock<span>Battle</span></div>
    <div className="nav-right">
      <div className="nav-dot"></div>
      <div className="nav-tag">COMING SOON — 2026</div>
    </div>
  </nav>
);

const Ticker = () => {
  const stocks = [
    {sym:'RELIANCE',p:'2847.35',c:'+1.24%',up:true},{sym:'TCS',p:'3921.10',c:'+0.87%',up:true},
    {sym:'INFY',p:'1456.80',c:'-0.43%',up:false},{sym:'HDFC BANK',p:'1623.45',c:'+0.62%',up:true},
    {sym:'NIFTY 50',p:'22,456',c:'+0.94%',up:true},{sym:'WIPRO',p:'487.20',c:'-0.21%',up:false},
    {sym:'BAJFINANCE',p:'6834.50',c:'+1.87%',up:true},{sym:'ITC',p:'432.15',c:'+0.33%',up:true},
    {sym:'SUNPHARMA',p:'1234.60',c:'-0.56%',up:false},{sym:'TATAMOTORS',p:'876.40',c:'+2.14%',up:true},
    {sym:'ADANIPORTS',p:'1098.75',c:'+0.78%',up:true},{sym:'SENSEX',p:'74,123',c:'+0.91%',up:true},
  ];
  const items = [...stocks, ...stocks];

  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {items.map((s, i) => (
          <div key={i} className="tick-item">
            <span className="tick-sym">{s.sym}</span>
            <span className={s.up ? 'tick-up' : 'tick-dn'}>{s.p}</span>
            <span className={s.up ? 'tick-up' : 'tick-dn'}>{s.up ? '▲' : '▼'} {s.c}</span>
            <span className="tick-sep">·</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LiveBar = () => (
  <div className="live-bar">
    <div className="live-badge"><div className="live-dot"></div>Live Waitlist Open</div>
    <div className="live-items">
      <div className="live-item">Tournaments: <span>Weekly &amp; Monthly</span></div>
      <div className="live-item">Prize Pool: <span>₹5,000 weekly</span></div>
      <div className="live-item">Platform: <span>Free to join</span></div>
    </div>
  </div>
);

const Hero = () => {
  const [totalCount, setTotalCount] = useState(247);
  const [displayedCount, setDisplayedCount] = useState(0);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', exp: '' });
  const [status, setStatus] = useState('idle'); // idle, loading, success
  const [position, setPosition] = useState(null);
  const [shakeField, setShakeField] = useState(null);

  useEffect(() => {
    getWaitlistCount().then(res => {
      if (res && res.count) {
        setTotalCount(res.count);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let animationFrameId;
    const animCount = () => {
      setDisplayedCount(prev => {
        if (prev < totalCount) {
          return Math.min(prev + Math.ceil((totalCount - prev) / 8), totalCount);
        }
        return prev;
      });
      animationFrameId = requestAnimationFrame(animCount);
    };
    const timeoutId = setTimeout(animCount, 700);
    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [totalCount]);

  const triggerShake = (field) => {
    setShakeField(field);
    setTimeout(() => setShakeField(null), 1600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, phone, email, exp } = formData;
    if(!name.trim()){ triggerShake('name'); return; }
    if(phone.length!==10 || isNaN(phone)){ triggerShake('phone'); return; }
    if(!email.includes('@') || !email.includes('.')){ triggerShake('email'); return; }
    if(!exp){ triggerShake('exp'); return; }

    setStatus('loading');

    const expMap = {
      'beginner': "I'm completely new to investing",
      'some': "I'm learning about markets",
      'active': "I actively trade stocks",
      'pro': "I actively trade stocks"
    };

    try {
      const res = await joinWaitlist({ 
        name: name.trim(), 
        email: email.trim(), 
        marketExperience: expMap[exp] || exp 
      });

      if (res.success) {
        setPosition(res.position);
        setTotalCount(prev => prev + 1);
        setStatus('success');
      } else {
        setStatus('idle');
        alert(res.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setStatus('idle');
      alert('Something went wrong. Please try again.');
    }
  };

  return (
    <section className="hero">
      <div className="hero-glow"></div>
      <div className="hero-inner">
        <div className="hero-left">
          <div className="eyebrow"><span className="eyebrow-line"></span>India's Trading Arena</div>
          <h1>
            COMPETE<br/>
            <span className="accent">TRADE</span>
            <span className="dim">WIN</span>
          </h1>
          <p className="hero-desc">
            India's first <strong>virtual stock trading tournament platform.</strong>
            Compete with real NSE/BSE prices, zero risk — and real prizes.
            No entry fee. Ever.
          </p>
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-num">{displayedCount.toLocaleString('en-IN')}</div>
              <div className="stat-label">On Waitlist</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">₹10L</div>
              <div className="stat-label">Virtual Capital</div>
            </div>
            <div className="stat-item">
              <div className="stat-num">FREE</div>
              <div className="stat-label">Entry Fee</div>
            </div>
          </div>
        </div>

        <div className="waitlist-card">
          <div className="card-green-line"></div>
          <div className="counter-badge">
            <div className="counter-dots">
              <div className="dot"></div><div className="dot"></div><div className="dot"></div>
            </div>
            <div className="counter-text"><span>{displayedCount.toLocaleString('en-IN')}</span> traders already waiting</div>
          </div>

          <div className="card-label">Join Waitlist</div>
          <div className="card-title">Early Access + Priority Invite</div>
          <div className="card-sub">First 100 users get free Finvox AI premium access.</div>

          {status !== 'success' ? (
            <div id="form-state">
              <div className="form-group">
                <input type="text" className={`form-input ${shakeField === 'name' ? 'shake' : ''}`} placeholder="Your name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} autoComplete="name" />
              </div>
              <div className="form-group">
                <input type="tel" className={`form-input ${shakeField === 'phone' ? 'shake' : ''}`} placeholder="Phone number (10 digits)" maxLength="10" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} autoComplete="tel" />
              </div>
              <div className="form-group">
                <input type="email" className={`form-input ${shakeField === 'email' ? 'shake' : ''}`} placeholder="Email address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} autoComplete="email" />
              </div>
              <div className="form-group">
                <select className={`form-select ${shakeField === 'exp' ? 'shake' : ''}`} value={formData.exp} onChange={e => setFormData({...formData, exp: e.target.value})}>
                  <option value="" disabled>Trading experience</option>
                  <option value="beginner">Beginner — Never traded</option>
                  <option value="some">Some — Paper/virtual traded</option>
                  <option value="active">Active — Trade regularly</option>
                  <option value="pro">Pro — Full-time trader</option>
                </select>
              </div>
              <button className="submit-btn" disabled={status === 'loading'} onClick={handleSubmit}>
                {status === 'loading' ? 'Submitting...' : 'Secure My Spot →'}
              </button>
              <div className="privacy-note">🔒 No spam. No entry fee. Ever.</div>
            </div>
          ) : (
            <div className="success-state" style={{ display: 'block' }}>
              <div className="success-icon">🎯</div>
              <div className="success-title">YOU'RE IN!</div>
              <div className="success-num">You are trader #<span>{position || displayedCount}</span> on the waitlist</div>
              <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--muted)', fontFamily: '"JetBrains Mono", monospace', lineHeight: 1.7 }}>
                We'll notify you at launch.<br/>Watch your inbox.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => (
  <div className="section-wrap">
    <div className="section">
      <div className="section-label">How It Works</div>
      <div className="section-title">4 STEPS TO<br/>YOUR FIRST WIN</div>
      <div className="steps">
        <div className="step">
          <div className="step-num">01</div>
          <div className="step-icon">🏦</div>
          <div className="step-title">Open Broker Account</div>
          <div className="step-desc">Open a free Angel One demat account via our referral link. Takes 10 minutes. One-time only.</div>
          <div className="step-tag">Free</div>
        </div>
        <div className="step">
          <div className="step-num">02</div>
          <div className="step-icon">⚔️</div>
          <div className="step-title">Join a Tournament</div>
          <div className="step-desc">Pick weekly or monthly competition. Get ₹10,00,000 in virtual money instantly. No entry fee.</div>
          <div className="step-tag">Free</div>
        </div>
        <div className="step">
          <div className="step-num">03</div>
          <div className="step-icon">📈</div>
          <div className="step-title">Trade Real Markets</div>
          <div className="step-desc">Buy & sell NSE/BSE stocks at live market prices. Strategy is everything. Zero real money at risk.</div>
          <div className="step-tag">Live Prices</div>
        </div>
        <div className="step">
          <div className="step-num">04</div>
          <div className="step-icon">🏆</div>
          <div className="step-title">Win Real Prizes</div>
          <div className="step-desc">Top performers win real cash every week and month. Prizes funded by us — not other players.</div>
          <div className="step-tag">Real Prizes</div>
        </div>
      </div>
    </div>
  </div>
);

const Prizes = () => (
  <div className="section">
    <div className="section-label">Prize Structure</div>
    <div className="section-title">WHAT YOU<br/>CAN WIN</div>

    <div className="prizes-grid">
      <div className="prize-card gold">
        <div className="prize-rank">🥇 Weekly — 1st Place</div>
        <div className="prize-amount">₹3,000</div>
        <div className="prize-type">Bank transfer within 24 hours</div>
        <div className="prize-bg">🏆</div>
      </div>
      <div className="prize-card silver">
        <div className="prize-rank">🥈 Weekly — 2nd Place</div>
        <div className="prize-amount">₹1,500</div>
        <div className="prize-type">Bank transfer within 24 hours</div>
        <div className="prize-bg">🥈</div>
      </div>
      <div className="prize-card bronze">
        <div className="prize-rank">🥉 Weekly — 3rd Place</div>
        <div className="prize-amount">₹500</div>
        <div className="prize-type">+ Winner certificate for LinkedIn</div>
        <div className="prize-bg">🎖️</div>
      </div>
    </div>

    <div className="monthly-banner">
      <div className="monthly-label">Monthly Grand Tournament</div>
      <div className="monthly-amount">₹25,000</div>
      <div className="monthly-sub">Top prize — 1st place monthly competition</div>
    </div>
  </div>
);

const FAQ = () => {
  const faqs = [
    { q: 'Is StockBattle completely free to join?', a: "Yes — 100% free. We never charge an entry fee. The only requirement is opening a free Angel One demat account using our referral link. We earn from brokerage commissions when you trade real markets — that's how we fund the prize pool." },
    { q: 'Do I need to invest real money?', a: "Never. All trading on StockBattle is done with virtual money — ₹10,00,000 given to you at the start of each tournament. You trade real NSE/BSE stocks at live prices, but no real money is at risk. It's a 100% safe simulation." },
    { q: 'Why do I need an Angel One account?', a: "This is how we keep the platform free for everyone. When you open an Angel One account via our link, we earn a referral commission — which we use to fund prizes and platform costs. The account itself is free to open and takes just 10 minutes." },
    { q: 'How are prizes paid out?', a: "Prize money is transferred directly to your bank account within 24 hours of tournament end. Winners also receive a digital certificate they can share on LinkedIn. Prizes come from our revenue — not from other players' money." },
    { q: 'When does StockBattle launch?', a: "We're targeting a launch in Q1 2026. Waitlist members get exclusive early access before the public launch, plus lifetime free premium tier for the first 500 signups. Join now to secure your spot." },
  ];

  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div className="section-wrap-alt">
      <div className="section">
        <div className="section-label">FAQ</div>
        <div className="section-title">QUESTIONS<br/>ANSWERED</div>

        <div className="faq-list">
          {faqs.map((faq, i) => (
            <div key={i} className={`faq-item ${openIdx === i ? 'open' : ''}`} onClick={() => setOpenIdx(openIdx === i ? null : i)}>
              <div className="faq-q">{faq.q} <span className="faq-icon">+</span></div>
              <div className="faq-a">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer>
    <div className="footer-logo">StockBattle</div>
    <div className="footer-links">
      <a href="#" className="footer-link">Privacy</a>
      <a href="#" className="footer-link">Terms</a>
      <a href="mailto:hello@stockbattle.in" className="footer-link">Contact</a>
    </div>
    <div className="footer-copy">© 2026 StockBattle. Not SEBI registered. Educational platform.</div>
  </footer>
);

const Home = () => (
  <>
    <Cursor />
    <Navbar />
    <Ticker />
    <LiveBar />
    <Hero />
    <HowItWorks />
    <Prizes />
    <FAQ />
    <Footer />
  </>
);

const Admin = () => {
  const [auth, setAuth] = useState(false);
  const [pwd, setPwd] = useState('');
  const [data, setData] = useState(null);

  const checkPwd = async (e) => {
    e.preventDefault();
    if (pwd === import.meta.env.VITE_ADMIN_PASSWORD) {
      try {
        const res = await getAdminWaitlist(import.meta.env.VITE_ADMIN_SECRET);
        setData(res);
        setAuth(true);
      } catch (err) {
        alert('Invalid secret or network error');
      }
    } else {
      alert('Wrong password');
    }
  };

  const exportCSV = () => {
    if (!data) return;
    const headers = ['id', 'name', 'email', 'market_experience', 'ip_address', 'created_at'];
    const rows = data.entries.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockleague-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!auth) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={checkPwd} style={{ background: 'var(--bg2)', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '24px' }}>Admin Login</h2>
          <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Password" style={{ padding: '12px', width: '250px', marginBottom: '16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
          <br/>
          <button type="submit" style={{ background: 'var(--green)', color: '#071A0E', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Enter</button>
        </form>
      </div>
    );
  }

  if (!data) return <div style={{ padding: '40px' }}>Loading...</div>;

  const mostCommon = Object.entries(data.byExperience).sort((a,b) => b[1]-a[1])[0][0];

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Syne, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px' }}>Admin Dashboard</h1>
        <button onClick={exportCSV} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: '6px', color: 'var(--text)', cursor: 'pointer' }}>Export CSV</button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
        {[{ label: 'Total Signups', val: data.total }, { label: 'Today', val: data.today }, { label: 'This Week', val: data.thisWeek }, { label: 'Most Common', val: mostCommon }].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', flex: 1, border: '1px solid var(--border2)' }}>
            <div style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: s.label === 'Most Common' ? '18px' : '32px', fontWeight: 'bold' }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '40px', background: 'var(--bg2)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border2)' }}>
        <h3 style={{ marginBottom: '16px' }}>Breakdown</h3>
        <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden' }}>
          {Object.entries(data.byExperience).map(([key, val], i) => {
            const colors = ['#00D46A', '#2D3A4E', '#F5B731', '#9AAABB'];
            return <div key={key} style={{ width: `${(val/data.total)*100}%`, background: colors[i], height: '100%' }} title={`${key}: ${val}`} />
          })}
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
          {Object.entries(data.byExperience).map(([key, val], i) => {
            const colors = ['#00D46A', '#2D3A4E', '#F5B731', '#9AAABB'];
            return <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: colors[i], borderRadius: '50%' }}/> {key} ({val})</div>
          })}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
              <th style={{ padding: '12px' }}>#</th>
              <th style={{ padding: '12px' }}>Name</th>
              <th style={{ padding: '12px' }}>Email</th>
              <th style={{ padding: '12px' }}>Answer</th>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px' }}>{row.id}</td>
                <td style={{ padding: '12px' }}>{row.name || '-'}</td>
                <td style={{ padding: '12px' }}>{row.email}</td>
                <td style={{ padding: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={row.market_experience}>{row.market_experience}</td>
                <td style={{ padding: '12px' }}>{new Date(row.created_at).toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px' }}>{row.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  </BrowserRouter>
);

const root = createRoot(document.getElementById('root'));
root.render(<App />);
