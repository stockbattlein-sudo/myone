import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { joinWaitlist, getWaitlistCount, getAdminWaitlist } from './api';
import { Analytics } from '@vercel/analytics/react';
import './index.css';

// Custom hook for counting up
const useCountUp = (end, duration = 2000, isVisible = true) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isVisible) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [end, duration, isVisible]);

    return count;
};

// Particles Component
const Particles = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return null;

    const particles = Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}vw`,
        animationDuration: `${Math.random() * 10 + 10}s`,
        animationDelay: `${Math.random() * 5}s`,
        text: ['+2.4%', '₹1,240', '▲0.8%'][Math.floor(Math.random() * 3)]
    }));

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
            {particles.map(p => (
                <div key={p.id} className="particle" style={{
                    left: p.left,
                    animation: `floatUp ${p.animationDuration} linear ${p.animationDelay} infinite`,
                }}>
                    {p.text}
                </div>
            ))}
        </div>
    );
};

// Ticker Component
const Ticker = () => {
    const items = [
        { name: 'RELIANCE', change: '+1.2%', up: true },
        { name: 'TCS', change: '-0.8%', up: false },
        { name: 'INFY', change: '+2.1%', up: true },
        { name: 'HDFCBANK', change: '+0.4%', up: true },
        { name: 'BAJFINANCE', change: '-1.5%', up: false },
        { name: 'TATAMOTORS', change: '+3.2%', up: true },
        { name: 'ZOMATO', change: '+1.8%', up: true },
        { name: 'WIPRO', change: '-0.3%', up: false }
    ];

    const repeatedItems = [...items, ...items, ...items, ...items];

    return (
        <div className="ticker-wrap">
            <div className="ticker-content">
                {repeatedItems.map((item, i) => (
                    <span key={i} className={`ticker-item ${item.up ? 'up' : 'down'}`}>
                        {item.name} {item.change} ·
                    </span>
                ))}
            </div>
        </div>
    );
};

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 60);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToForm = () => {
        document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav style={{
            position: 'fixed',
            top: 0, width: '100%', zIndex: 50,
            padding: '20px 40px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: scrolled ? 'rgba(11,14,17,0.95)' : 'transparent',
            backdropFilter: scrolled ? 'blur(12px)' : 'none',
            transition: 'background 0.3s, backdrop-filter 0.3s',
            borderBottom: scrolled ? '1px solid var(--border)' : 'none'
        }}>
            <div>
                <h1 style={{ fontSize: '24px' }}>
                    <span style={{ color: 'var(--accent)' }}>STOCK</span><span style={{ color: '#FFF' }}>LEAGUE</span>
                </h1>
                <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    Fantasy Stock Market
                </div>
            </div>
            <button onClick={scrollToForm} style={{
                background: 'var(--accent)', color: '#fff', padding: '10px 24px', borderRadius: '100px',
                fontWeight: '600', fontSize: '14px', transition: 'transform 0.2s',
            }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                Join Waitlist
            </button>
        </nav>
    );
};

const Hero = () => {
    const [totalCount, setTotalCount] = useState(0);
    const count = useCountUp(totalCount || 1247, 2000, !!totalCount);

    useEffect(() => {
        getWaitlistCount().then(res => setTotalCount(res.count)).catch(console.error);
    }, []);

    const scrollToForm = () => {
        document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section style={{ position: 'relative', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 20px', overflow: 'hidden' }}>
            <Particles />
            <div style={{ zIndex: 10, maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{
                    background: 'var(--gold-dim)', color: 'var(--gold)', padding: '8px 16px', borderRadius: '100px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(255,214,0,0.3)'
                }}>
                    🏆 India's First Fantasy Stock Market
                </motion.div>
                
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ fontSize: 'clamp(44px, 6vw, 72px)', lineHeight: '1.1' }}>
                    Pick Stocks.<br/>Build Portfolios.<br/><span style={{ color: 'var(--gold)' }}>Win Real Prizes.</span>
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '520px', lineHeight: '1.5' }}>
                    StockLeague is launching soon. Compete in daily NSE contests, beat 10,000+ players, and win real cash — no real money at risk.
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} style={{
                    background: 'var(--bg2)', padding: '12px 24px', borderRadius: '100px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px'
                }}>
                    <span className="pulse">🟢</span> <span className="mono" style={{ color: 'var(--text)' }}>{count.toLocaleString('en-IN')}</span> traders already on the list
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                    <button onClick={scrollToForm} style={{
                        background: 'linear-gradient(135deg, #00C853 0%, #00E676 100%)', color: '#fff', padding: '18px 40px', borderRadius: '100px',
                        fontWeight: '700', fontSize: '18px', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(0,200,83,0.2)', border: '1px solid rgba(255,255,255,0.2)'
                    }} onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(0,200,83,0.4)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,200,83,0.2)'; }}>
                        Secure Your Early Access →
                    </button>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Early members get exclusive launch pricing + first contest free</span>
                </motion.div>
            </div>
            <Ticker />
        </section>
    );
};

const Stats = () => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setIsVisible(true);
        }, { threshold: 0.5 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const prizeCount = useCountUp(5000000, 2500, isVisible);
    const playerCount = useCountUp(10000, 2000, isVisible);
    const winCount = useCountUp(20, 1500, isVisible);

    return (
        <section ref={ref} style={{
            background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
            padding: '40px 20px', display: 'flex', justifyContent: 'center'
        }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', width: '100%', maxWidth: '1000px', gap: '40px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--gold)', fontSize: '48px', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
                        <span className="mono">₹</span>{prizeCount.toLocaleString('en-IN')}+
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Total Prize Pool</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--gold)', fontSize: '48px', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
                        {playerCount.toLocaleString('en-IN')}+
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Players Joining</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--gold)', fontSize: '48px', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
                        Top {winCount}%
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Winners Paid</div>
                </div>
            </div>
        </section>
    );
};

const HowItWorks = () => {
    const cards = [
        { icon: '📋', title: 'Build Your Portfolio', desc: 'Pick 5–10 NSE stocks, assign weights. Total must equal 100%. Max 30% in any single stock.' },
        { icon: '⚔️', title: 'Join a Contest', desc: 'Enter free or paid daily/weekly contests. Compete against thousands of traders across India.' },
        { icon: '🏆', title: 'Win Real Prizes', desc: "Your portfolio's real-time performance determines your score. Top rankers win real cash via UPI." }
    ];

    return (
        <section style={{ padding: '100px 20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '40px', marginBottom: '8px' }}>How StockLeague Works</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '48px', fontSize: '18px' }}>Three steps to your first win</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                {cards.map((c, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ delay: i * 0.15 }} style={{
                        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', flex: '1 1 300px', maxWidth: '350px',
                        textAlign: 'left', transition: 'box-shadow 0.3s, border-color 0.3s'
                    }} onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 20px var(--accent-glow)'; }} onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <div style={{ fontSize: '40px', marginBottom: '16px' }}>{c.icon}</div>
                        <h3 style={{ fontSize: '24px', marginBottom: '12px' }}>{c.title}</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{c.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

const ContestPreview = () => {
    const contests = [
        { type: 'FREE DAILY', color: '#2979FF', pool: '₹10,000', entry: 'FREE', filled: 8421, total: 10000, ends: '02:14:33' },
        { type: 'MEGA LEAGUE', color: '#00E676', pool: '₹5,00,000', entry: '₹49', filled: 4120, total: 50000, ends: '05:30:00' },
        { type: 'HIGH ROLLER', color: '#FF9100', pool: '₹1,00,000', entry: '₹99', filled: 850, total: 1500, ends: '01:45:12' },
        { type: 'CHAMPIONS', color: '#D500F9', pool: '₹2,50,000', entry: '₹199', filled: 120, total: 1500, ends: '12:00:00' }
    ];

    return (
        <section style={{ padding: '80px 20px', background: 'var(--bg2)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '40px', marginBottom: '48px' }}>What You'll Be Playing</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
                {contests.map((c, i) => (
                    <div key={i} style={{
                        background: 'var(--bg)', border: `1px solid ${c.color}40`, borderRadius: '12px', padding: '24px', flex: '1 1 300px', maxWidth: '400px', textAlign: 'left', position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ color: c.color, fontSize: '14px', fontWeight: '700', letterSpacing: '1px' }}>
                                <span className="pulse" style={{ display: 'inline-block', marginRight: '6px' }}>●</span> {c.type}
                            </div>
                            <div style={{ background: 'var(--bg2)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>LIVE</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>{c.pool}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Prize Pool</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '20px', fontWeight: '600' }}>{c.entry}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Entry</div>
                            </div>
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ width: '100%', height: '6px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${(c.filled/c.total)*100}%`, height: '100%', background: c.color }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{c.filled.toLocaleString('en-IN')}/{c.total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Ends in: <span className="mono" style={{ color: 'var(--text)' }}>{c.ends}</span></div>
                            <button disabled style={{ background: 'var(--bg3)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'not-allowed' }} title="Coming Soon">
                                JOIN →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <p style={{ marginTop: '40px', color: 'var(--text-muted)' }}>Be on the waitlist to get first access when we go live 🚀</p>
        </section>
    );
};

const WaitlistForm = () => {
    const [step, setStep] = useState(1);
    const [experience, setExperience] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, error, success, duplicate
    const [position, setPosition] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    const options = [
        "I actively trade stocks",
        "I'm learning about markets",
        "I play fantasy sports (Dream11 etc.)",
        "I'm completely new to investing"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setErrorMsg('Please enter a valid email address');
            return;
        }
        setStatus('loading');
        setErrorMsg('');

        try {
            const res = await joinWaitlist({ name, email, marketExperience: experience });
            if (res.success) {
                setPosition(res.position);
                setStatus(res.alreadyJoined ? 'duplicate' : 'success');
                if (window.posthog) {
                    window.posthog.capture('waitlist_joined', { market_experience: experience, position: res.position });
                }
            } else {
                setStatus('error');
                setErrorMsg(res.message || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            setStatus('error');
            setErrorMsg('Something went wrong. Please try again.');
        }
    };

    const handleShareWA = () => {
        window.open('https://wa.me/?text=' + encodeURIComponent("I just joined the StockLeague waitlist — India's fantasy stock market! Join here: https://stockleague.vercel.app"));
    };

    const handleCopy = (e) => {
        navigator.clipboard.writeText("https://stockleague.vercel.app");
        const btn = e.currentTarget;
        const oldText = btn.innerText;
        btn.innerText = "Copied! ✓";
        setTimeout(() => btn.innerText = oldText, 2000);
    };

    return (
        <section id="waitlist-form" style={{ padding: '100px 20px', background: '#0D1F14', display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: 'var(--bg2)', maxWidth: '560px', width: '100%', borderRadius: '24px', padding: '40px', border: '1px solid var(--accent-glow)', boxShadow: '0 0 40px rgba(0,200,83,0.05)' }}>
                <AnimatePresence mode="wait">
                    {status === 'success' || status === 'duplicate' ? (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '64px', marginBottom: '24px' }}>{status === 'duplicate' ? '🙌' : '✅'}</div>
                            {status === 'duplicate' ? (
                                <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>You're already on the list!</h2>
                            ) : (
                                <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>You're #{position?.toLocaleString('en-IN')} on the list!</h2>
                            )}
                            <p style={{ color: 'var(--text-muted)', fontSize: '18px', marginBottom: '32px', lineHeight: '1.5' }}>
                                We'll email you the moment StockLeague goes live.<br/>
                                You get: First contest FREE + ₹100 bonus credits 🎉
                            </p>
                            <div style={{ background: 'var(--bg3)', padding: '24px', borderRadius: '16px' }}>
                                <div style={{ fontWeight: '600', marginBottom: '16px' }}>Share with a friend → get bumped up the list</div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button onClick={handleShareWA} style={{ background: '#25D366', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontWeight: '600' }}>Share on WhatsApp</button>
                                    <button onClick={handleCopy} style={{ background: 'var(--border)', color: 'var(--text)', padding: '12px 24px', borderRadius: '8px', fontWeight: '600' }}>Copy Link</button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <h2 style={{ fontSize: '32px', textAlign: 'center', marginBottom: '8px' }}>Join the Waitlist</h2>
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '40px' }}>Answer one quick question, drop your email — we'll reach you first.</p>
                            
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', marginBottom: '16px', fontWeight: '600' }}>What's your current relationship with the stock market?</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                    {options.map(opt => (
                                        <button key={opt} onClick={() => { setExperience(opt); setStep(2); }} style={{
                                            padding: '16px', borderRadius: '12px', border: `2px solid ${experience === opt ? 'var(--accent)' : 'var(--border)'}`,
                                            background: experience === opt ? 'var(--accent-glow)' : 'transparent', color: 'var(--text)', textAlign: 'left', transition: 'all 0.2s'
                                        }}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <AnimatePresence>
                                {step === 2 && (
                                    <motion.form initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} onSubmit={handleSubmit} style={{ overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                            <input type="text" placeholder="Your first name (optional)" value={name} onChange={e => setName(e.target.value)} style={{
                                                width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '16px', outline: 'none'
                                            }} onFocus={e => e.target.style.borderColor = 'var(--text-muted)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                                            
                                            <div>
                                                <input type="email" placeholder="your@email.com (required)" required value={email} onChange={e => { setEmail(e.target.value); setErrorMsg(''); }} style={{
                                                    width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s'
                                                }} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                                                {errorMsg && <div style={{ color: 'var(--red)', fontSize: '14px', marginTop: '8px' }}>{errorMsg}</div>}
                                            </div>
                                        </div>
                                        
                                        <button type="submit" disabled={status === 'loading'} style={{
                                            width: '100%', background: 'var(--accent)', color: '#fff', padding: '18px', borderRadius: '12px', fontWeight: '700', fontSize: '18px',
                                            opacity: status === 'loading' ? 0.7 : 1, cursor: status === 'loading' ? 'wait' : 'pointer'
                                        }}>
                                            {status === 'loading' ? 'Securing your spot...' : 'Claim My Spot on the Waitlist →'}
                                        </button>
                                        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '16px' }}>
                                            No spam. Ever. Early access + ₹100 bonus credits on launch day.
                                        </p>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

const SocialProof = () => {
    const quotes = [
        { initial: 'R', name: 'Rahul M.', city: 'Mumbai', quote: 'Finally something for people who know stocks but can\'t risk real money!', color: '#00C853' },
        { initial: 'P', name: 'Priya S.', city: 'Bangalore', quote: 'Dream11 for stocks? Day 1 sign up.', color: '#2979FF' },
        { initial: 'A', name: 'Arjun K.', city: 'Delhi', quote: 'NSE fantasy is going to be massive.', color: '#FF9100' },
        { initial: 'N', name: 'Neha T.', city: 'Pune', quote: 'As a CA student this is perfect.', color: '#D500F9' },
        { initial: 'V', name: 'Vikram R.', city: 'Hyderabad', quote: 'Been trading for 5 years — this is exactly what the market needed.', color: '#FF1744' },
        { initial: 'S', name: 'Sneha P.', city: 'Chennai', quote: 'Love that it\'s free to start. No risk, all learning.', color: '#FFD600' }
    ];

    return (
        <section style={{ padding: '80px 0', overflow: 'hidden' }}>
            <h2 style={{ fontSize: '32px', textAlign: 'center', marginBottom: '40px' }}>Who's Joining?</h2>
            <div className="ticker-wrap" style={{ position: 'relative', background: 'transparent', border: 'none', padding: 0 }}>
                <div className="ticker-content" style={{ animationDuration: '40s' }}>
                    {[...quotes, ...quotes].map((q, i) => (
                        <div key={i} style={{ display: 'inline-block', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', margin: '0 12px', width: '350px', whiteSpace: 'normal', verticalAlign: 'top' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: q.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px' }}>
                                    {q.initial}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600' }}>{q.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{q.city}</div>
                                </div>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>"{q.quote}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Footer = () => (
    <footer style={{ background: 'var(--bg)', padding: '60px 20px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px' }}><span style={{ color: 'var(--accent)' }}>STOCK</span><span style={{ color: '#FFF' }}>LEAGUE</span></h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '40px', color: 'var(--text-muted)' }}>
            <a href="#" style={{ hover: { color: '#fff' } }}>Instagram</a>
            <a href="#" style={{ hover: { color: '#fff' } }}>Twitter/X</a>
            <a href="mailto:contact@stockleague.in">contact@stockleague.in</a>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 24px', lineHeight: '1.6' }}>
            StockLeague is a fantasy gaming platform. No real money is invested in securities. All contests involve virtual portfolios only. For entertainment and financial literacy purposes.
        </p>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>© 2025 StockLeague. Made with 🇮🇳 in India.</div>
    </footer>
);

const Home = () => (
    <>
        <Navbar />
        <Hero />
        <Stats />
        <HowItWorks />
        <ContestPreview />
        <WaitlistForm />
        <SocialProof />
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
                    <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Password" style={{ padding: '12px', width: '250px', marginBottom: '16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: '#fff' }} />
                    <br/>
                    <button type="submit" style={{ background: 'var(--accent)', color: '#fff', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold' }}>Enter</button>
                </form>
            </div>
        );
    }

    if (!data) return <div style={{ padding: '40px' }}>Loading...</div>;

    const mostCommon = Object.entries(data.byExperience).sort((a,b) => b[1]-a[1])[0][0];

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px' }}>Admin Dashboard</h1>
                <button onClick={exportCSV} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: '6px', color: '#fff' }}>Export CSV</button>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                {[{ label: 'Total Signups', val: data.total }, { label: 'Today', val: data.today }, { label: 'This Week', val: data.thisWeek }, { label: 'Most Common', val: mostCommon }].map(s => (
                    <div key={s.label} style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', flex: 1 }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>{s.label}</div>
                        <div style={{ fontSize: s.label === 'Most Common' ? '18px' : '32px', fontWeight: 'bold' }}>{s.val}</div>
                    </div>
                ))}
            </div>

            <div style={{ marginBottom: '40px', background: 'var(--bg2)', padding: '24px', borderRadius: '12px' }}>
                <h3 style={{ marginBottom: '16px' }}>Breakdown</h3>
                <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden' }}>
                    {Object.entries(data.byExperience).map(([key, val], i) => {
                        const colors = ['#00C853', '#2979FF', '#FF9100', '#D500F9'];
                        return <div key={key} style={{ width: `${(val/data.total)*100}%`, background: colors[i], height: '100%' }} title={`${key}: ${val}`} />
                    })}
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
                    {Object.entries(data.byExperience).map(([key, val], i) => {
                        const colors = ['#00C853', '#2979FF', '#FF9100', '#D500F9'];
                        return <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: colors[i], borderRadius: '50%' }}/> {key} ({val})</div>
                    })}
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
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
        <Analytics />
    </BrowserRouter>
);

const root = createRoot(document.getElementById('root'));
root.render(<App />);
