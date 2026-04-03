import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../auth.css';

const LandingPage = () => {
    const [scrolled, setScrolled] = useState(false);
    const [stats, setStats] = useState({
        products: '...',
        transactions: '...',
        users: '...'
    });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handleScroll);
        
        fetch('http://127.0.0.1:5001/api/stats')
            .then(res => res.json())
            .then(data => {
                setStats({
                    products: data.products + '+',
                    transactions: data.transactions + '+',
                    users: data.users + '+'
                });
            })
            .catch(err => console.error("Error fetching stats:", err));

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        { icon: '📊', title: 'Real-time Tracking', desc: 'Monitor stock levels in real-time and never run out of essential items.' },
        { icon: '🔒', title: 'Secure Authentication', desc: 'Role-based access control ensures data security and integrity.' },
        { icon: '📈', title: 'Detailed Reporting', desc: 'Generate comprehensive sales and inventory reports for smart decisions.' },
        { icon: '⚡', title: 'Lightning Fast', desc: 'Optimized performance ensures your team stays productive.' },
        { icon: '🔔', title: 'Smart Alerts', desc: 'Get notified instantly when stock runs low — never miss a beat.' },
        { icon: '🌐', title: 'Cloud Powered', desc: 'Access your inventory from anywhere, anytime on any device.' },
    ];

    return (
        <div className="landing-page">
            {/* ===== Navbar ===== */}
            <nav className={`landing-nav ${scrolled ? 'nav-scrolled' : ''}`}>
                <div className="nav-container">
                    <div className="nav-brand">
                        <div className="nav-logo-icon">⚡</div>
                        <span>Smart Stock</span>
                    </div>
                    <div className="nav-links">
                        <Link to="/login" className="nav-link">Login</Link>
                        <Link to="/signup" className="nav-cta-btn">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* ===== Hero Section ===== */}
            <section className="hero-section">
                <div className="hero-orb hero-orb-1"></div>
                <div className="hero-orb hero-orb-2"></div>
                <div className="hero-orb hero-orb-3"></div>

                <div className="hero-content">
                    <div className="hero-badge">🚀 Next-gen Inventory Management</div>
                    <h1 className="hero-title">
                        Manage Your Inventory <br />
                        <span className="hero-gradient-text">Smarter & Faster</span>
                    </h1>
                    <p className="hero-subtitle">
                        Streamline product tracking, manage stock levels, and generate insightful reports.
                        Secure, reliable, and beautifully designed.
                    </p>
                    <div className="hero-actions">
                        <Link to="/signup" className="hero-btn-primary">
                            Start Free Today
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                        </Link>
                        <Link to="/login" className="hero-btn-secondary">Sign In →</Link>
                    </div>
                </div>



                <div className="hero-stats-row">
                    {[
                        { num: stats.products, label: 'Products Tracked' },
                        { num: stats.transactions, label: 'Total Transactions' },
                        { num: stats.users, label: 'Businesses' },
                    ].map((s, i) => (
                        <div key={i} className="hero-stat">
                            <span className="hero-stat-num">{s.num}</span>
                            <span className="hero-stat-label">{s.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ===== Features Grid ===== */}
            <section className="features-section">
                <div className="features-container">
                    <div className="section-label">Features</div>
                    <h2 className="section-title">Everything You Need</h2>
                    <p className="section-subtitle">Powerful tools to help you manage inventory efficiently</p>

                    <div className="features-grid">
                        {features.map((f, i) => (
                            <div key={i} className="feature-card" style={{ animationDelay: `${i * 0.08}s` }}>
                                <div className="feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section className="cta-section">
                <div className="cta-card">
                    <h2>Ready to Transform Your Inventory?</h2>
                    <p>Join thousands of businesses managing their stock with Smart Stock.</p>
                    <Link to="/signup" className="hero-btn-primary" style={{ width: 'auto' }}>
                        Get Started Free
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                    </Link>
                </div>
            </section>

            {/* ===== Footer ===== */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="nav-logo-icon">⚡</div>
                        <span>Smart Stock</span>
                    </div>
                    <p>© 2026 Smart Stock Inventory. All rights reserved.</p>
                </div>
            </footer>

            <style>{`
                .landing-page {
                    font-family: 'Inter', sans-serif;
                    overflow-x: hidden;
                }

                /* Navbar */
                .landing-nav {
                    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
                    padding: 16px 0;
                    transition: all 0.3s ease;
                }
                .nav-scrolled {
                    background: rgba(15, 12, 41, 0.95);
                    backdrop-filter: blur(12px);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                    padding: 10px 0;
                }
                .nav-container {
                    max-width: 1200px; margin: 0 auto; padding: 0 32px;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .nav-brand {
                    display: flex; align-items: center; gap: 10px;
                    font-size: 1.3rem; font-weight: 800; color: #fff;
                }
                .nav-logo-icon {
                    width: 36px; height: 36px; border-radius: 10px;
                    background: linear-gradient(135deg, #7c3aed, #06b6d4);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 18px;
                    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
                }
                .nav-links { display: flex; align-items: center; gap: 8px; }
                .nav-link {
                    color: rgba(255,255,255,0.8); text-decoration: none; padding: 8px 18px;
                    border-radius: 10px; font-weight: 600; font-size: 0.9rem;
                    transition: all 0.2s;
                }
                .nav-link:hover { color: #fff; background: rgba(255,255,255,0.08); }
                .nav-cta-btn {
                    background: linear-gradient(135deg, #7c3aed, #06b6d4);
                    color: #fff; padding: 10px 22px; border-radius: 10px;
                    text-decoration: none; font-weight: 700; font-size: 0.9rem;
                    box-shadow: 0 4px 14px rgba(124,58,237,0.3);
                    transition: all 0.25s;
                }
                .nav-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124,58,237,0.5); }

                /* Hero */
                .hero-section {
                    min-height: 100vh; display: flex; flex-direction: column;
                    justify-content: center; align-items: center; text-align: center;
                    padding: 120px 32px 60px;
                    background: #0f0c29;
                    background-image:
                        radial-gradient(at 20% 30%, rgba(124,58,237,0.25) 0, transparent 50%),
                        radial-gradient(at 80% 20%, rgba(6,182,212,0.2) 0, transparent 50%),
                        radial-gradient(at 50% 90%, rgba(244,114,182,0.12) 0, transparent 50%);
                    position: relative; overflow: hidden;
                }
                .hero-orb {
                    position: absolute; border-radius: 50%; filter: blur(80px);
                    animation: float 8s ease-in-out infinite; pointer-events: none;
                }
                .hero-orb-1 { width: 400px; height: 400px; background: rgba(124,58,237,0.15); top: 10%; left: 5%; }
                .hero-orb-2 { width: 300px; height: 300px; background: rgba(6,182,212,0.12); top: 50%; right: 10%; animation-delay: 3s; }
                .hero-orb-3 { width: 250px; height: 250px; background: rgba(244,114,182,0.1); bottom: 10%; left: 30%; animation-delay: 6s; }
                .hero-content { position: relative; z-index: 1; max-width: 720px; }
                .hero-badge {
                    display: inline-block; padding: 8px 20px; border-radius: 999px;
                    background: rgba(124,58,237,0.15); color: #a78bfa;
                    font-size: 0.85rem; font-weight: 600; margin-bottom: 24px;
                    border: 1px solid rgba(124,58,237,0.2);
                    letter-spacing: 0.02em;
                }
                .hero-title {
                    font-size: 3.8rem; font-weight: 900; color: #fff;
                    line-height: 1.1; margin-bottom: 20px; letter-spacing: -0.03em;
                }
                .hero-gradient-text {
                    background: linear-gradient(135deg, #a78bfa, #06b6d4, #f472b6);
                    -webkit-background-clip: text; background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-size: 200% auto;
                    animation: gradient-shift 4s ease infinite;
                }
                .hero-subtitle {
                    font-size: 1.15rem; color: rgba(255,255,255,0.65);
                    line-height: 1.7; margin-bottom: 36px; max-width: 560px; margin-left: auto; margin-right: auto;
                }
                .hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
                .hero-btn-primary {
                    display: inline-flex; align-items: center; gap: 10px;
                    background: linear-gradient(135deg, #7c3aed, #06b6d4); color: #fff;
                    padding: 14px 30px; border-radius: 12px; font-weight: 700; font-size: 1rem;
                    text-decoration: none; box-shadow: 0 4px 18px rgba(124,58,237,0.4);
                    transition: all 0.25s;
                }
                .hero-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(124,58,237,0.5); }
                .hero-btn-secondary {
                    display: inline-flex; align-items: center;
                    color: rgba(255,255,255,0.8); padding: 14px 30px; border-radius: 12px;
                    font-weight: 600; font-size: 1rem; text-decoration: none;
                    border: 1px solid rgba(255,255,255,0.15); transition: all 0.25s;
                }
                .hero-btn-secondary:hover { border-color: rgba(255,255,255,0.3); color: #fff; background: rgba(255,255,255,0.05); }

                .hero-stats-row {
                    display: flex; gap: 48px; justify-content: center; margin-top: 60px;
                    position: relative; z-index: 1;
                }
                .hero-stat { text-align: center; }
                .hero-stat-num { display: block; font-size: 2rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
                .hero-stat-label { font-size: 0.85rem; color: rgba(255,255,255,0.5); font-weight: 500; }

                /* Features */
                .features-section { padding: 100px 32px; background: #f8fafc; }
                .features-container { max-width: 1100px; margin: 0 auto; text-align: center; }
                .section-label {
                    display: inline-block; padding: 6px 16px; border-radius: 999px;
                    background: rgba(124,58,237,0.08); color: #7c3aed;
                    font-size: 0.8rem; font-weight: 700; margin-bottom: 16px;
                    text-transform: uppercase; letter-spacing: 0.06em;
                }
                .section-title { font-size: 2.4rem; font-weight: 800; color: #1e293b; margin-bottom: 12px; letter-spacing: -0.02em; }
                .section-subtitle { font-size: 1.05rem; color: #64748b; margin-bottom: 48px; max-width: 500px; margin-left: auto; margin-right: auto; }
                .features-grid {
                    display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;
                    text-align: left;
                }
                .feature-card {
                    background: #fff; padding: 30px; border-radius: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #f1f5f9;
                    transition: all 0.3s ease;
                    animation: slideUp 0.5s ease both;
                }
                .feature-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 12px 30px rgba(0,0,0,0.08);
                    border-color: rgba(124,58,237,0.15);
                }
                .feature-icon {
                    width: 48px; height: 48px; border-radius: 12px;
                    background: linear-gradient(135deg, rgba(124,58,237,0.1), rgba(6,182,212,0.1));
                    display: flex; align-items: center; justify-content: center;
                    font-size: 22px; margin-bottom: 16px;
                }
                .feature-card h3 { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
                .feature-card p { font-size: 0.9rem; color: #64748b; line-height: 1.6; margin: 0; }

                /* CTA */
                .cta-section { padding: 80px 32px; background: #f8fafc; }
                .cta-card {
                    max-width: 700px; margin: 0 auto; text-align: center; padding: 60px 40px;
                    background: linear-gradient(135deg, #0f0c29 0%, #24243e 100%);
                    border-radius: 24px; color: #fff;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.2);
                    position: relative; overflow: hidden;
                }
                .cta-card::before {
                    content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
                    background: radial-gradient(circle at 30% 30%, rgba(124,58,237,0.15), transparent 60%);
                    pointer-events: none;
                }
                .cta-card h2 { font-size: 2rem; font-weight: 800; margin-bottom: 12px; position: relative; z-index: 1; }
                .cta-card p { color: rgba(255,255,255,0.65); margin-bottom: 30px; position: relative; z-index: 1; font-size: 1.05rem; }

                /* Footer */
                .landing-footer {
                    padding: 32px; background: #0f0c29;
                    border-top: 1px solid rgba(124,58,237,0.1);
                }
                .footer-content {
                    max-width: 1200px; margin: 0 auto;
                    display: flex; justify-content: space-between; align-items: center;
                    flex-wrap: wrap; gap: 16px;
                }
                .footer-brand { display: flex; align-items: center; gap: 10px; font-size: 1.1rem; font-weight: 700; color: #fff; }
                .footer-content p { color: rgba(255,255,255,0.4); font-size: 0.85rem; margin: 0; }

                /* Responsive */
                @media (max-width: 768px) {
                    .hero-title { font-size: 2.4rem; }
                    .hero-stats-row { gap: 24px; flex-wrap: wrap; }
                    .hero-stat-num { font-size: 1.5rem; }
                    .section-title { font-size: 1.8rem; }
                    .features-grid { grid-template-columns: 1fr; }
                    .footer-content { flex-direction: column; text-align: center; }
                    .cta-card { padding: 40px 24px; }
                    .cta-card h2 { font-size: 1.5rem; }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
