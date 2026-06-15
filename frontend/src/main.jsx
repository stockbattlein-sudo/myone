import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { joinWaitlist, getWaitlistCount, getAdminWaitlist } from './api';
import './index.css';

// Animated Number Counter Component
const AnimatedNumber = ({ value }) => {
  const [displayVal, setDisplayVal] = useState(value);
  const prevValRef = useRef(value);

  useEffect(() => {
    const start = prevValRef.current;
    const end = value;
    if (start === end) return;

    const duration = 600;
    const startTime = performance.now();

    let animFrame;
    const step = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const current = Math.round(start + (end - start) * ease);
      setDisplayVal(current);
      if (t < 1) {
        animFrame = requestAnimationFrame(step);
      } else {
        prevValRef.current = end;
      }
    };
    animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [value]);

  const formatINR = (n) => {
    return '₹' + Math.round(n).toLocaleString('en-IN');
  };

  return <span>{formatINR(displayVal)}</span>;
};

// Scroll Reveal Hook
const useScrollReveal = (activePage) => {
  useEffect(() => {
    const reveals = document.querySelectorAll('.fade-up');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    reveals.forEach(el => observer.observe(el));
    return () => reveals.forEach(el => observer.unobserve(el));
  }, [activePage]);
};

// Main Navbar Component
const Navbar = ({ activePage, setActivePage }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(prev => !prev);
  const closeMenu = () => setMenuOpen(false);

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    closeMenu();
    setActivePage('home');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <>
      <nav className="navbar" id="navbar">
        <div className="nav-inner">
          <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); setActivePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <div className="logo-mark float-anim" style={{ background: 'transparent', boxShadow: 'none' }}>
              <img src="/logo.jpg" alt="StockBattle Logo" className="brand-logo-img" />
            </div>
            StockBattle
          </a>

          <ul className="nav-links">
            <li><a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')}>How it Works</a></li>
            <li><a href="#pricing" onClick={(e) => handleNavClick(e, 'pricing')}>Assessments</a></li>
            <li><a href="#competition" onClick={(e) => handleNavClick(e, 'competition')}>Competition</a></li>
          </ul>

          <div className="nav-actions">
            <button className="btn-login" onClick={() => setActivePage('waitlist')}>Login</button>
            <button className="btn-primary" onClick={() => setActivePage('waitlist')}>
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button className="hamburger" id="hamburgerBtn" aria-label="Toggle menu" onClick={toggleMenu}>
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} id="mobileMenu">
        <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')}>How it Works</a>
        <a href="#pricing" onClick={(e) => handleNavClick(e, 'pricing')}>Assessments</a>
        <a href="#competition" onClick={(e) => handleNavClick(e, 'competition')}>Competition</a>
        <a href="#" onClick={(e) => { e.preventDefault(); setActivePage('waitlist'); closeMenu(); }}>Login / Get Started</a>
      </div>
    </>
  );
};

// Landing Page Content Component
const HomeContent = ({ setActivePage }) => {
  const [assessmentType, setAssessmentType] = useState(2); // 1 = 1-step, 2 = 2-step, 3 = instant

  // Calculator inputs
  const [calcAccount, setCalcAccount] = useState(500000);
  const [calcConsistency, setCalcConsistency] = useState(8);
  const [calcDuration, setCalcDuration] = useState(12);

  // Compute calculator values
  const rate = calcConsistency / 100;
  let computedValue = calcAccount;
  let computedStipend = 0;
  for (let i = 0; i < calcDuration; i++) {
    const monthlyProfit = computedValue * rate;
    const traderShare = monthlyProfit * 0.8;
    computedStipend += traderShare;
    computedValue += monthlyProfit;
  }

  return (
    <div id="page-home" className="page active">
      <section className="hero">
        <video className="bg-video" autoPlay loop muted playsInline>
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_024928_1efd0b0d-6c02-45a8-8847-1030900c4f63.mp4" type="video/mp4" />
        </video>
        <div className="video-overlay"></div>

        <div className="hero-container">
          <div className="hero-inner fade-up visible">
            <div className="hero-badge float-anim">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
              AI-Native Prop Trading Evaluation
            </div>

            <h1>Prove Your Worth.<br /><span className="grad-text-animated">Build Your Wealth.</span></h1>

            <div className="asset-tags">
              <span className="asset-tag">📊 Index F&O</span>
              <span class="asset-tag">📈 Equities</span>
              <span className="asset-tag">🥇 Commodities</span>
            </div>

            <p className="hero-sub">
              Trade simulated capital, prove your edge, and earn real performance-based stipends.
              Our AI platform evaluates discipline, risk control, and consistency — not just raw returns.
            </p>

            <div className="cta-stack">
              <button className="btn-cta-primary" onClick={() => setActivePage('waitlist')}>
                Start Your Assessment
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button className="btn-whatsapp" onClick={() => window.open('https://wa.me/', '_blank')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                Community
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="how-it-works">
        <div className="section-inner">
          <div className="section-label fade-up">
            <div className="section-deco">01</div>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">A transparent, structured path from evaluation to funded trading.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card glass-panel fade-up">
              <div className="step-num">STEP_01</div>
              <div className="step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3>Choose Program</h3>
              <p>Select your evaluation tier — ₹2L, ₹5L, or ₹10L. Complete onboarding and set preferences.</p>
            </div>

            <div className="step-card glass-panel fade-up" style={{ transitionDelay: '0.1s' }}>
              <div className="step-num">STEP_02</div>
              <div className="step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3>Risk Assessment</h3>
              <p>Trade within our simulated parameters. AI monitors your risk metrics and sizing in real-time.</p>
            </div>

            <div className="step-card glass-panel fade-up" style={{ transitionDelay: '0.2s' }}>
              <div className="step-num">STEP_03</div>
              <div className="step-icon float-anim">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 2l2.5 5L20 8l-4 3.9.9 5.5L12 15l-4.9 2.4.9-5.5L4 8l5.5-.8L12 2z"/>
                </svg>
              </div>
              <h3>Allocation</h3>
              <p>Hit targets and get allocated to a professional account. Your performance speaks.</p>
              <div className="pro-badge">PRO ACTIVE</div>
            </div>

            <div className="step-card glass-panel fade-up" style={{ transitionDelay: '0.3s' }}>
              <div className="step-num">STEP_04</div>
              <div className="step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>
              <h3>Profit Share</h3>
              <p>Earn bi-weekly stipends directly to your bank. Payouts scale with consistency.</p>
              <div className="stipend-list">
                <div className="stipend-row"><span className="grad-text">+ ₹25,000</span></div>
                <div className="stipend-row"><span className="grad-text">+ ₹50,000</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-inner">
          <div className="section-label fade-up">
            <div className="section-deco">02</div>
            <h2 className="section-title">Built for Trust</h2>
            <p className="section-subtitle">Every feature designed for transparency, fairness, and trader success.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card glass-panel fade-up">
              <div className="feature-icon-wrapper float-anim">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <path d="M7 17v-4"></path>
                  <path d="M12 17V9"></path>
                  <path d="M17 17v-6"></path>
                </svg>
              </div>
              <h3>Intraday Only</h3>
              <p>All positions must be squared off by market close. Clean intraday discipline enforced.</p>
            </div>

            <div className="feature-card glass-panel fade-up" style={{ transitionDelay: '0.1s' }}>
              <div className="feature-icon-wrapper">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3>Simulated Trading</h3>
              <p>No real capital deployed. Trade in a fully simulated environment with live market data.</p>
            </div>

            <div className="feature-card glass-panel fade-up" style={{ transitionDelay: '0.2s' }}>
              <div className="feature-icon-wrapper">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <h3>AI Analytics</h3>
              <p>Built-in trade journal, drawdown analytics, and AI-powered performance insights.</p>
            </div>

            <div className="feature-card glass-panel fade-up" style={{ transitionDelay: '0.1s' }}>
              <div className="feature-icon-wrapper">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
              <h3>Secure Payouts</h3>
              <p>Stipends are verified and transferred directly to your secure verified bank accounts.</p>
            </div>

            <div className="feature-card glass-panel fade-up" style={{ transitionDelay: '0.2s' }}>
              <div className="feature-icon-wrapper float-anim">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <h3>News Trading</h3>
              <p>We allow trading through high-impact macro events. Your strategy, your call.</p>
            </div>

            <div className="feature-card glass-panel fade-up" style={{ transitionDelay: '0.3s' }}>
              <div className="feature-icon-wrapper">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <h3>Real-Time Metrics</h3>
              <p>Live dashboard showing P&L and risk metrics. Know where you stand at all times.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="pricing">
        <div className="section-inner">
          <div className="section-label fade-up">
            <div className="section-deco">03</div>
            <h2 className="section-title">Assessment Plans</h2>
            <p className="section-subtitle">Simple, transparent pricing. One-time evaluation fee.</p>
          </div>

          <div className="assessment-toggle-container fade-up">
            <div className="assessment-toggle">
              <button id="btn-2-step" className={assessmentType === 2 ? 'active' : ''} onClick={() => setAssessmentType(2)}>2-Step Assessment</button>
              <button id="btn-1-step" className={assessmentType === 1 ? 'active' : ''} onClick={() => setAssessmentType(1)}>1-Step Assessment</button>
              <button id="btn-instant" className={assessmentType === 3 ? 'active' : ''} onClick={() => setAssessmentType(3)}>Instant Account</button>
            </div>
          </div>

          <div id="table-2-step" className="table-scroll-wrap glass-panel fade-up" style={{ display: assessmentType === 2 ? 'block' : 'none' }}>
            <table className="assessment-table">
              <thead>
                <tr>
                  <th className="align-left">Account Size</th>
                  <th>
                    <div className="tier-name">₹2L</div>
                    <button className="btn-tier" onClick={() => setActivePage('waitlist')}>Get Started</button>
                    <div className="tier-price">₹2,999</div>
                  </th>
                  <th>
                    <div className="tier-name">₹5L</div>
                    <button className="btn-tier" onClick={() => setActivePage('waitlist')}>Get Started</button>
                    <div className="tier-price">₹4,999</div>
                  </th>
                  <th className="highlight-col-header">
                    <div className="tier-name">₹10L</div>
                    <button className="btn-tier" onClick={() => setActivePage('waitlist')}>Get Started</button>
                    <div className="tier-price">₹8,999</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="align-left">Phase 1 Target</td>
                  <td>10%</td>
                  <td>10%</td>
                  <td className="highlight-col">10%</td>
                </tr>
                <tr>
                  <td className="align-left">Phase 2 Target</td>
                  <td>5%</td>
                  <td>5%</td>
                  <td className="highlight-col">5%</td>
                </tr>
                <tr>
                  <td className="align-left">Max Loss</td>
                  <td>10% <span className="sub-val">(₹20,000)</span></td>
                  <td>10% <span className="sub-val">(₹50,000)</span></td>
                  <td className="highlight-col">10% <span className="sub-val">(₹1,00,000)</span></td>
                </tr>
                <tr>
                  <td className="align-left">Daily Loss Limit</td>
                  <td>3% <span className="sub-val">(₹6,000)</span></td>
                  <td>3% <span className="sub-val">(₹15,000)</span></td>
                  <td className="highlight-col">3% <span className="sub-val">(₹30,000)</span></td>
                </tr>
                <tr>
                  <td className="align-left">News Trading Allowed</td>
                  <td>
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </td>
                  <td>
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </td>
                  <td className="highlight-col">
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td className="align-left">Profit Share</td>
                  <td>80%</td>
                  <td>80%</td>
                  <td className="highlight-col">80%</td>
                </tr>
                <tr>
                  <td className="align-left border-none">Withdrawal Schedule</td>
                  <td className="border-none">Weekly</td>
                  <td className="border-none">Weekly</td>
                  <td className="highlight-col border-none">Weekly</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div id="table-1-step" className="table-scroll-wrap glass-panel fade-up" style={{ display: assessmentType === 1 ? 'block' : 'none' }}>
            <table className="assessment-table">
              <thead>
                <tr>
                  <th className="align-left">Account Size</th>
                  <th>
                    <div className="tier-name">₹2L</div>
                    <button className="btn-tier" onClick={() => setActivePage('waitlist')}>Get Started</button>
                    <div className="tier-price">₹4,999</div>
                  </th>
                  <th>
                    <div className="tier-name">₹5L</div>
                    <button className="btn-tier" onClick={() => setActivePage('waitlist')}>Get Started</button>
                    <div className="tier-price">₹7,999</div>
                  </th>
                  <th className="highlight-col-header">
                    <div className="tier-name">₹10L</div>
                    <button className="btn-tier" onClick={() => setActivePage('waitlist')}>Get Started</button>
                    <div className="tier-price">₹12,999</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="align-left">Profit Target</td>
                  <td>10%</td>
                  <td>10%</td>
                  <td className="highlight-col">10%</td>
                </tr>
                <tr>
                  <td className="align-left">Max Loss</td>
                  <td>6% <span className="sub-val">(₹12,000)</span></td>
                  <td>6% <span className="sub-val">(₹30,000)</span></td>
                  <td className="highlight-col">6% <span className="sub-val">(₹60,000)</span></td>
                </tr>
                <tr>
                  <td className="align-left">Daily Loss Limit</td>
                  <td>2% <span className="sub-val">(₹4,000)</span></td>
                  <td>2% <span className="sub-val">(₹10,000)</span></td>
                  <td className="highlight-col">2% <span className="sub-val">(₹20,000)</span></td>
                </tr>
                <tr>
                  <td className="align-left">News Trading Allowed</td>
                  <td>
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </td>
                  <td>
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </td>
                  <td className="highlight-col">
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td className="align-left">Profit Share</td>
                  <td>80%</td>
                  <td>80%</td>
                  <td className="highlight-col">80%</td>
                </tr>
                <tr>
                  <td className="align-left border-none">Withdrawal Schedule</td>
                  <td className="border-none">Weekly</td>
                  <td className="border-none">Weekly</td>
                  <td className="highlight-col border-none">Weekly</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div id="table-instant" className="table-scroll-wrap glass-panel fade-up" style={{ display: assessmentType === 3 ? 'block' : 'none' }}>
            <table className="assessment-table">
              <thead>
                <tr>
                  <th className="align-left">Account Size</th>
                  <th>
                    <div className="tier-name">₹50K</div>
                    <button className="btn-tier" onClick={() => setActivePage('waitlist')}>Get Started</button>
                    <div className="tier-price">₹3,099</div>
                  </th>
                  <th>
                    <div className="tier-name">₹1L</div>
                    <button className="btn-tier" onClick={() => setActivePage('waitlist')}>Get Started</button>
                    <div className="tier-price">₹4,099</div>
                  </th>
                  <th className="highlight-col-header">
                    <div className="tier-name">₹1.5L</div>
                    <button className="btn-tier" onClick={() => setActivePage('waitlist')}>Get Started</button>
                    <div className="tier-price">₹5,099</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="align-left">Profit Target</td>
                  <td>No Target</td>
                  <td>No Target</td>
                  <td className="highlight-col">No Target</td>
                </tr>
                <tr>
                  <td className="align-left">Funded Stage Profit Split</td>
                  <td>70%</td>
                  <td>70%</td>
                  <td className="highlight-col">70%</td>
                </tr>
                <tr>
                  <td className="align-left">Max Drawdown</td>
                  <td>4% <span className="sub-val">(₹2,000)</span></td>
                  <td>4% <span className="sub-val">(₹4,000)</span></td>
                  <td className="highlight-col">4% <span className="sub-val">(₹6,000)</span></td>
                </tr>
                <tr>
                  <td className="align-left">Daily Drawdown</td>
                  <td>3% <span className="sub-val">(₹1,500)</span></td>
                  <td>3% <span className="sub-val">(₹3,000)</span></td>
                  <td className="highlight-col">3% <span className="sub-val">(₹4,500)</span></td>
                </tr>
                <tr>
                  <td className="align-left">Consistency Rule</td>
                  <td>15%</td>
                  <td>15%</td>
                  <td className="highlight-col">15%</td>
                </tr>
                <tr>
                  <td className="align-left">News Trading Allowed</td>
                  <td>
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </td>
                  <td>
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </td>
                  <td className="highlight-col">
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </td>
                </tr>
                <tr>
                  <td className="align-left border-none">Payout Schedule</td>
                  <td className="border-none">Weekly</td>
                  <td className="border-none">Weekly</td>
                  <td className="highlight-col border-none">Weekly</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section" id="competition">
        <div className="section-inner">
          <div className="section-label fade-up">
            <div className="section-deco">04</div>
            <h2 className="section-title">Monthly Trading Battle</h2>
            <p className="section-subtitle">Compete globally. Top 3 traders win free Instant Accounts.</p>
          </div>

          <div className="comp-grid">
            <div className="comp-card glass-panel fade-up" style={{ transitionDelay: '0.1s', marginTop: '40px' }}>
              <div className="rank-badge silver">2nd Place</div>
              <h3>₹1L Instant Account</h3>
              <p>Free entry to our ₹1 Lakh instant funding tier. Zero evaluation needed.</p>
            </div>

            <div className="comp-card glass-panel fade-up winner-card">
              <div className="rank-badge gold float-anim">1st Place 🏆</div>
              <h3 className="grad-text">₹1.5L Instant Account</h3>
              <p>The ultimate prize. Full ₹1.5 Lakh instant funding tier completely free.</p>
            </div>

            <div className="comp-card glass-panel fade-up" style={{ transitionDelay: '0.2s', marginTop: '40px' }}>
              <div className="rank-badge bronze">3rd Place</div>
              <h3>₹50K Instant Account</h3>
              <p>Free entry to our ₹50,000 instant funding tier. Start earning immediately.</p>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '56px' }} className="fade-up">
            <button className="btn-cta-primary" onClick={() => setActivePage('waitlist')}>Register for Next Battle</button>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="scaling">
        <div className="section-inner">
          <div className="section-label fade-up">
            <div className="section-deco">05</div>
            <h2 className="section-title">Scale With Performance</h2>
            <p className="section-subtitle">Consistent traders unlock exponential account growth.</p>
          </div>

          <div className="scale-grid">
            <div className="scale-chart glass-panel fade-up">
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Account Trajectory</h3>
              <svg viewBox="0 0 500 280" style={{ width: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6"/>
                    <stop offset="100%" stopColor="#10B981"/>
                  </linearGradient>
                </defs>

                <text x="44" y="24" textAnchor="end" fontSize="11" fill="var(--text-muted)" fontFamily="JetBrains Mono,monospace">₹1.6Cr</text>
                <text x="44" y="234" textAnchor="end" fontSize="11" fill="var(--text-muted)" fontFamily="JetBrains Mono,monospace">₹0</text>

                <path d="M 50 222 C 110 221 130 217 160 213 C 200 208 220 200 250 190 C 280 175 300 155 320 135 C 350 105 370 70 400 45 C 420 28 450 22 490 20 L 490 230 L 50 230 Z" fill="url(#chartGrad)"/>
                <path d="M 50 222 C 110 221 130 217 160 213 C 200 208 220 200 250 190 C 280 175 300 155 320 135 C 350 105 370 70 400 45 C 420 28 450 22 490 20" fill="none" stroke="url(#lineGrad)" strokeWidth="4" strokeLinecap="round"/>

                <circle cx="50" cy="222" r="6" fill="var(--bg-card)" stroke="#3b82f6" strokeWidth="3"/>
                <circle cx="490" cy="20" r="8" fill="var(--bg-card)" stroke="#10B981" strokeWidth="3"/>
              </svg>
            </div>

            <div className="calc-card glass-panel fade-up" style={{ transitionDelay: '0.15s' }}>
              <h3>Estimate Growth</h3>

              <div className="field-group">
                <label className="field-label">Starting Account Size</label>
                <select className="styled-select" id="calcAccount" value={calcAccount} onChange={(e) => setCalcAccount(parseInt(e.target.value))}>
                  <option value="200000">₹2L Account</option>
                  <option value="500000">₹5L Account</option>
                  <option value="1000000">₹10L Account</option>
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Monthly Consistency %</label>
                <input type="range" className="styled-slider" id="calcConsistency" min="5" max="15" value={calcConsistency} onChange={(e) => setCalcConsistency(parseInt(e.target.value))} />
                <div className="slider-val" id="consistencyVal">{calcConsistency}%</div>
              </div>

              <div className="field-group">
                <label className="field-label">Duration (Months)</label>
                <input type="range" className="styled-slider" id="calcDuration" min="3" max="24" value={calcDuration} onChange={(e) => setCalcDuration(parseInt(e.target.value))} />
                <div className="slider-val" id="durationVal">{calcDuration} months</div>
              </div>

              <div className="calc-output">
                <div className="calc-line">
                  <div className="calc-line-label">Account Value</div>
                  <div className="calc-line-val grad-text" id="calcValue">
                    <AnimatedNumber value={computedValue} />
                  </div>
                </div>
                <div className="calc-line">
                  <div className="calc-line-label">Cumulative Stipend</div>
                  <div className="calc-line-val grad-text" id="calcStipend">
                    <AnimatedNumber value={computedStipend} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="footer-cta" id="footer-cta">
        <h2 className="fade-up">Start Your Trading Journey Today</h2>
        <button className="btn-footer-cta fade-up" style={{ transitionDelay: '0.1s' }} onClick={() => setActivePage('waitlist')}>Get Started Now</button>
      </div>

      <footer className="footer-body">
        <div className="footer-grid">
          <div className="footer-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div className="logo-mark" style={{ background: 'transparent', boxShadow: 'none' }}>
                <img src="/logo.jpg" alt="StockBattle Logo" className="brand-logo-img" style={{ width: '36px', height: '36px' }} />
              </div>
              <span style={{ fontWeight: '800', fontSize: '20px', color: 'var(--text-primary)' }}>StockBattle</span>
            </div>
            <p>India's first AI-native prop trading evaluation platform. Proven traders, real rewards.</p>
          </div>

          <div className="footer-col">
            <h4>Platform</h4>
            <ul className="footer-links">
              <li><a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')}>How it Works</a></li>
              <li><a href="#pricing" onClick={(e) => handleNavClick(e, 'pricing')}>Assessments</a></li>
              <li><a href="#competition" onClick={(e) => handleNavClick(e, 'competition')}>Competition</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Community</h4>
            <ul className="footer-links">
              <li><a href="#" onClick={(e) => { e.preventDefault(); window.open('https://wa.me/', '_blank'); }}>WhatsApp</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); }}>Discord</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); }}>Twitter</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <ul className="footer-links">
              <li><a href="#" onClick={(e) => { e.preventDefault(); }}>Privacy Policy</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); }}>Terms of Service</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); }}>Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© 2026 StockBattle. All rights reserved.</p>
          <p className="footer-disclaimer">
            StockBattle is a simulation-based evaluation platform. No real capital is deployed. 
            All trading is simulated. Performance-based incentives are internal program rewards, 
            not investment returns.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Waitlist Form Component
const WaitlistContent = ({ setActivePage }) => {
  const [fname, setFname] = useState('');
  const [femail, setFemail] = useState('');
  const [fphone, setFphone] = useState('');

  // Validation feedback
  const [errors, setErrors] = useState({ fname: '', femail: '', fphone: '' });
  const [touched, setTouched] = useState({ fname: false, femail: false, fphone: false });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateName = (val) => {
    if (!val.trim()) return 'This field is required';
    return '';
  };

  const validateEmail = (val) => {
    if (!val.trim()) return 'This field is required';
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(val.trim())) return 'Please enter a valid email address';
    return '';
  };

  const validatePhone = (val) => {
    const numbersOnly = val.replace(/\D/g, '');
    if (!val.trim()) return 'This field is required';
    if (numbersOnly.length !== 10) return 'Enter a valid 10-digit mobile number';
    return '';
  };

  // Run validations
  const nameError = validateName(fname);
  const emailError = validateEmail(femail);
  const phoneError = validatePhone(fphone);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ fname: true, femail: true, fphone: true });

    if (nameError || emailError || phoneError) {
      return;
    }

    setLoading(true);

    try {
      const res = await joinWaitlist({
        name: fname.trim(),
        email: femail.trim(),
        phone: fphone.trim()
      });

      if (res.success) {
        setSubmitted(true);
      } else {
        alert(res.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      alert('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="page-waitlist" className="page active">
      <video className="bg-video" autoPlay loop muted playsInline>
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_024928_1efd0b0d-6c02-45a8-8847-1030900c4f63.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay"></div>

      <div className="waitlist-page">
        <div className="waitlist-inner">
          <div className="waitlist-left fade-up visible">
            <h1>Registrations are<br /><span className="grad-text-animated">Open.</span></h1>

            <div className="callout-block float-anim" style={{ marginBottom: '32px', boxShadow: '0 8px 32px var(--accent-light)' }}>
              <p style={{ fontSize: '18px', fontWeight: '800', fontStyle: 'normal', color: 'var(--accent)' }}>
                ⚡ First 100 users get a 50% discount!
              </p>
            </div>

            <div style={{ marginTop: '40px' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActivePage('home'); }} style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'color 0.3s' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                Back to Home
              </a>
            </div>
          </div>

          <div className="waitlist-form-card glass-panel fade-up visible" style={{ transitionDelay: '0.15s' }}>
            {!submitted ? (
              <form id="formContent" onSubmit={handleSubmit}>
                <h3 className="form-card-title">JOIN WAITLIST NOW</h3>
                <p className="form-card-sub">Claim your 50% discount before spots run out.</p>

                <div className="form-stack" id="waitlistForm">
                  <div className="form-field">
                    <label className="form-label" htmlFor="fname">Full Name</label>
                    <div className="field-wrap">
                      <input 
                        className={`form-input ${touched.fname && nameError ? 'error' : touched.fname ? 'success' : ''}`}
                        type="text" 
                        id="fname" 
                        placeholder="John Doe" 
                        autoComplete="name"
                        value={fname}
                        onChange={(e) => setFname(e.target.value)}
                        onBlur={() => setTouched(prev => ({ ...prev, fname: true }))}
                      />
                      {touched.fname && !nameError && <span className="field-icon" id="fnameIcon">✓</span>}
                    </div>
                    {touched.fname && nameError && <div className="error-msg show" id="fnameErr">{nameError}</div>}
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="femail">Email Address</label>
                    <div className="field-wrap">
                      <input 
                        className={`form-input ${touched.femail && emailError ? 'error' : touched.femail ? 'success' : ''}`}
                        type="email" 
                        id="femail" 
                        placeholder="john@example.com" 
                        autoComplete="email"
                        value={femail}
                        onChange={(e) => setFemail(e.target.value)}
                        onBlur={() => setTouched(prev => ({ ...prev, femail: true }))}
                      />
                      {touched.femail && !emailError && <span className="field-icon" id="femailIcon">✓</span>}
                    </div>
                    {touched.femail && emailError && <div className="error-msg show" id="femailErr">{emailError}</div>}
                  </div>

                  <div className="form-field">
                    <label className="form-label" htmlFor="fphone">Mobile Number</label>
                    <div className="field-wrap">
                      <input 
                        className={`form-input ${touched.fphone && phoneError ? 'error' : touched.fphone ? 'success' : ''}`}
                        type="tel" 
                        id="fphone" 
                        placeholder="+91 9876543210" 
                        autoComplete="tel"
                        value={fphone}
                        onChange={(e) => setFphone(e.target.value)}
                        onBlur={() => setTouched(prev => ({ ...prev, fphone: true }))}
                      />
                      {touched.fphone && !phoneError && <span className="field-icon" id="fphoneIcon">✓</span>}
                    </div>
                    {touched.fphone && phoneError && <div className="error-msg show" id="fphoneErr">{phoneError}</div>}
                  </div>

                  <button className="btn-notify" id="notifyBtn" type="submit" disabled={loading}>
                    {loading && <div className="spinner" id="btnSpinner" style={{ display: 'block' }}></div>}
                    <span id="btnText">{loading ? 'Registering...' : 'Claim Discount & Register'}</span>
                  </button>
                </div>

                <div className="secondary-links">
                  <a href="#" className="theme-link" onClick={(e) => e.preventDefault()}>Already have an account?</a>
                </div>
              </form>
            ) : (
              <div className="success-state" id="successState" style={{ display: 'block' }}>
                <div className="success-icon">🚀</div>
                <div className="success-title grad-text">Welcome to StockBattle!</div>
                <p className="success-sub">
                  Your 50% discount has been applied successfully. We've sent the next steps to <strong id="confirmedEmail" style={{ color: 'var(--text-primary)' }}>{femail}</strong>.
                </p>
                <button className="btn-notify" style={{ margin: '32px auto 0', maxWidth: '200px' }} onClick={() => setActivePage('home')}>
                  Go to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Page Component
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
    const headers = ['id', 'name', 'email', 'phone', 'market_experience', 'ip_address', 'created_at'];
    const rows = data.entries.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockbattle-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!auth) {
    return (
      <div className="admin-login">
        <form onSubmit={checkPwd}>
          <h2>Admin Login</h2>
          <input 
            type="password" 
            value={pwd} 
            onChange={e => setPwd(e.target.value)} 
            placeholder="Password" 
            style={{ 
              padding: '12px', 
              width: '250px', 
              marginBottom: '16px', 
              borderRadius: '6px', 
              border: '1px solid var(--border-color)', 
              background: 'var(--input-bg)', 
              color: 'var(--text-primary)' 
            }} 
          />
          <br/>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Enter</button>
        </form>
      </div>
    );
  }

  if (!data) return <div style={{ padding: '40px', color: 'var(--text-primary)' }}>Loading...</div>;

  const experienceKeys = Object.keys(data.byExperience);
  const mostCommon = experienceKeys.length > 0 
    ? Object.entries(data.byExperience).sort((a, b) => b[1] - a[1])[0][0] 
    : 'None';

  return (
    <div className="admin-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px' }}>Admin Dashboard</h1>
        <button onClick={exportCSV} className="btn-outline">Export CSV</button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {[{ label: 'Total Signups', val: data.total }, { label: 'Today', val: data.today }, { label: 'This Week', val: data.thisWeek }, { label: 'Most Common', val: mostCommon }].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', flex: '1 1 200px', border: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: s.label === 'Most Common' ? '18px' : '32px', fontWeight: 'bold' }}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '40px', background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '16px' }}>Breakdown</h3>
        <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden' }}>
          {Object.entries(data.byExperience).map(([key, val], i) => {
            const colors = ['#6dde26', '#3a8a00', '#ffd700', '#c0c0c0'];
            return <div key={key} style={{ width: data.total > 0 ? `${(val/data.total)*100}%` : '0%', background: colors[i % colors.length], height: '100%' }} title={`${key}: ${val}`} />
          })}
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
          {Object.entries(data.byExperience).map(([key, val], i) => {
            const colors = ['#6dde26', '#3a8a00', '#ffd700', '#c0c0c0'];
            return <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: colors[i % colors.length], borderRadius: '50%' }}/> {key} ({val})</div>
          })}
        </div>
      </div>

      <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: '14px' }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Answer</th>
              <th>Date</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map(row => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.name || '-'}</td>
                <td>{row.email}</td>
                <td>{row.phone || '-'}</td>
                <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={row.market_experience}>{row.market_experience || '-'}</td>
                <td>{new Date(row.created_at).toLocaleString('en-IN')}</td>
                <td>{row.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Root Router Wrapper for Landing Pages
const LandingPages = () => {
  const [activePage, setActivePage] = useState('home');

  useScrollReveal(activePage);

  return (
    <>
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      {activePage === 'home' ? (
        <HomeContent setActivePage={setActivePage} />
      ) : (
        <WaitlistContent setActivePage={setActivePage} />
      )}
    </>
  );
};

// Main App component
const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPages />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  </BrowserRouter>
);

const root = createRoot(document.getElementById('root'));
root.render(<App />);
