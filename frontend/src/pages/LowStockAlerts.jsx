import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';

const LowStockAlerts = () => {
    const role = localStorage.getItem('role');
    const [user, setUser] = useState(null);
    const [alertsEnabled, setAlertsEnabled] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [testEmailMsg, setTestEmailMsg] = useState('');
    const [testEmailLoading, setTestEmailLoading] = useState(false);
    const [stockAlerts, setStockAlerts] = useState([]);
    const [alertsLoading, setAlertsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/auth/me');
                setUser(res.data);
                setAlertsEnabled(res.data?.email_alerts_enabled !== false);
            } catch {
                setUser(null);
            }
        };
        load();
    }, []);

    useEffect(() => {
        const loadAlerts = async () => {
            setAlertsLoading(true);
            try {
                const res = await api.get('/products/alerts');
                setStockAlerts(Array.isArray(res.data) ? res.data : []);
            } catch {
                setStockAlerts([]);
            } finally {
                setAlertsLoading(false);
            }
        };
        loadAlerts();
    }, []);

    const sendTestEmail = async () => {
        setTestEmailMsg('');
        setTestEmailLoading(true);
        try {
            const res = await api.post('/auth/test-email');
            setTestEmailMsg(res.data?.msg || 'Sent.');
        } catch (e) {
            setTestEmailMsg(e.response?.data?.msg || 'Could not send test email.');
        } finally {
            setTestEmailLoading(false);
        }
    };

    const toggleAlerts = async (enabled) => {
        setSaving(true);
        setSaveMsg('');
        try {
            await api.put('/auth/settings', { email_alerts_enabled: enabled });
            setAlertsEnabled(enabled);
            setSaveMsg(enabled ? 'Email alerts enabled.' : 'Email alerts turned off.');
        } catch {
            setSaveMsg('Could not update settings.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout role={role}>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Low-Stock Alerts</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '0.9rem' }}>
                        Configure notifications when inventory falls below thresholds.
                    </p>
                </div>
            </div>

            {/* Full low-stock list (moved from Dashboard) */}
            <div style={{ marginBottom: 24 }} className="alerts-page-stock-panel">
                {alertsLoading ? (
                    <div className="premium-table-wrapper" style={{ padding: 24, color: 'var(--text-secondary)' }}>Loading low-stock items…</div>
                ) : stockAlerts.length === 0 ? (
                    <div className="premium-table-wrapper" style={{ padding: 24 }}>
                        <h2 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 800 }}>Current low-stock items</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>None right now — all products are at or above reorder / minimum threshold.</p>
                    </div>
                ) : (
                    <div id="alerts-low-stock-list" className="dashboard-low-stock-hero">
                        <div className="dashboard-low-stock-hero-head">
                            <div>
                                <h2 className="dashboard-low-stock-title">Low stock — action needed</h2>
                                <p className="dashboard-low-stock-sub">
                                    {stockAlerts.length} product{stockAlerts.length !== 1 ? 's' : ''} below reorder / minimum threshold. Adjust thresholds in{' '}
                                    <Link to="/inventory" style={{ fontWeight: 700, color: 'var(--primary)' }}>Inventory</Link> (Add / Edit). Email settings are below on this page.
                                </p>
                            </div>
                            <div className="dashboard-low-stock-actions">
                                <Link to="/inventory?filter=low-stock" className="btn btn-primary btn-sm">View in Inventory</Link>
                            </div>
                        </div>
                        <ul className="dashboard-low-stock-list">
                            {stockAlerts.map((a) => (
                                <li key={a.id || a.product_id}>
                                    <Link to="/inventory?filter=low-stock">
                                        <span className="dashboard-low-stock-name">{a.name}</span>
                                        <span className="dashboard-low-stock-meta">
                                            Qty <strong>{a.quantity}</strong>
                                            {a.threshold != null && <> · threshold {a.threshold}</>}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="premium-table-wrapper" style={{ maxWidth: 640, marginBottom: 16 }}>
                <div style={{ padding: '24px' }}>
                    <h2 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 800 }}>What alerts are for</h2>
                    <ul style={{ margin: '0 0 0 18px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                        <li><strong style={{ color: 'var(--text-primary)' }}>In the app:</strong> This page lists all low-stock items; a banner may show on other pages when there are any; you can also filter in Inventory.</li>
                        <li><strong style={{ color: 'var(--text-primary)' }}>By email:</strong> when a product’s quantity <strong>drops from at or above</strong> your reorder/min level <strong>to below</strong> it (e.g. after a sale), admins with alerts on get an email — if SMTP is set on the server.</li>
                        <li><strong style={{ color: 'var(--text-primary)' }}>Why no email sometimes:</strong> items that were <em>already</em> low won’t trigger again until stock goes back above the threshold and then falls below again. Also check spam and real Gmail app passwords in <code style={{ fontSize: '0.78rem' }}>backend/.env</code>.</li>
                    </ul>
                </div>
            </div>

            <div className="premium-table-wrapper" style={{ maxWidth: 640 }}>
                <div style={{ padding: '24px' }}>
                    <h2 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 800 }}>Alert settings</h2>
                    <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        Thresholds are stored per product (reorder point &amp; minimum stock). Admins set them when adding or editing a product.
                    </p>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 16,
                            padding: '16px 18px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            background: 'var(--bg-primary)',
                            marginBottom: 12,
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 800, marginBottom: 4 }}>Enable email alerts</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
                                Receive email when stock falls below the threshold (admins; requires SMTP in server).
                            </div>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={alertsEnabled}
                            disabled={saving || !user}
                            onClick={() => toggleAlerts(!alertsEnabled)}
                            style={{
                                width: 52,
                                height: 28,
                                borderRadius: 999,
                                border: 'none',
                                cursor: saving || !user ? 'not-allowed' : 'pointer',
                                background: alertsEnabled ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : '#cbd5e1',
                                position: 'relative',
                                flexShrink: 0,
                            }}
                        >
                            <span
                                style={{
                                    position: 'absolute',
                                    top: 3,
                                    left: alertsEnabled ? 26 : 3,
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: '#fff',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    transition: 'left 0.2s ease',
                                }}
                            />
                        </button>
                    </div>

                    {saveMsg && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>{saveMsg}</p>
                    )}

                    {role === 'admin' && (
                        <div
                            style={{
                                marginBottom: 20,
                                padding: '14px 16px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-light)',
                                background: 'var(--bg-primary)',
                            }}
                        >
                            <div style={{ fontWeight: 800, marginBottom: 6 }}>Test email (SMTP)</div>
                            <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Sends a <strong>live low-stock snapshot</strong> (product name, qty, threshold) to <strong>{user?.email || 'your account'}</strong>. If nothing is low, the mail still confirms SMTP. Also checks <code style={{ fontSize: '0.75rem' }}>MAIL_USERNAME</code> / <code style={{ fontSize: '0.75rem' }}>MAIL_PASSWORD</code> in the backend.
                            </p>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                disabled={testEmailLoading}
                                onClick={sendTestEmail}
                            >
                                {testEmailLoading ? 'Sending…' : 'Send test email'}
                            </button>
                            {testEmailMsg && (
                                <p
                                    style={{
                                        margin: '10px 0 0',
                                        fontSize: '0.85rem',
                                        color:
                                            testEmailMsg.includes('SMTP not configured') ||
                                            testEmailMsg.includes('SMTP error') ||
                                            testEmailMsg.includes('Gmail rejected') ||
                                            testEmailMsg.includes('bad credentials')
                                                ? 'var(--danger)'
                                                : 'var(--text-secondary)',
                                    }}
                                >
                                    {testEmailMsg}
                                </p>
                            )}
                            <details style={{ marginTop: 12, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                                <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    Gmail setup (quick steps)
                                </summary>
                                <ol style={{ margin: '10px 0 0 18px' }}>
                                    <li>Edit <code style={{ fontSize: '0.75rem' }}>backend/.env</code> — replace <strong>MAIL_USERNAME</strong> / <strong>MAIL_FROM</strong> with your Gmail.</li>
                                    <li>Create a Google <strong>App password</strong> (2FA must be on):{' '}
                                        <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">Google App Passwords</a>
                                    </li>
                                    <li>Set <strong>MAIL_PASSWORD</strong> to that 16-character app password (no spaces or with spaces, both work).</li>
                                    <li>Restart the Flask backend, then click <strong>Send test email</strong> again.</li>
                                </ol>
                                <p style={{ margin: '10px 0 0', fontWeight: 600, color: 'var(--danger)' }}>
                                    If you see <strong>535</strong> / “Username and Password not accepted”: Google is blocking login — use an App Password only, and make sure <strong>MAIL_USERNAME</strong> is exactly that Gmail address.
                                </p>
                                <p style={{ margin: '8px 0 0' }}>Template without secrets: <code style={{ fontSize: '0.75rem' }}>backend/.env.example</code></p>
                            </details>
                        </div>
                    )}

                    <Link
                        to="/inventory"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px 18px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            textDecoration: 'none',
                            color: 'var(--text-primary)',
                            fontWeight: 700,
                            background: 'var(--surface)',
                        }}
                    >
                        <div>
                            <div>Minimum stock &amp; reorder</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 600, marginTop: 4 }}>
                                Set the minimum stock level for each product in Inventory (Add / Edit).
                            </div>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }} aria-hidden>›</span>
                    </Link>

                    <div
                        style={{
                            marginTop: 20,
                            padding: '14px 16px',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--info-bg)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                        }}
                    >
                        <strong style={{ color: 'var(--text-primary)' }}>SMS (optional):</strong> configure Twilio in server environment
                        (<code style={{ fontSize: '0.78rem' }}>TWILIO_ACCOUNT_SID</code>,{' '}
                        <code style={{ fontSize: '0.78rem' }}>TWILIO_AUTH_TOKEN</code>,{' '}
                        <code style={{ fontSize: '0.78rem' }}>TWILIO_FROM_NUMBER</code>,{' '}
                        <code style={{ fontSize: '0.78rem' }}>LOW_STOCK_SMS_TO</code>) to notify designated numbers.
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <Link to="/dashboard" className="btn btn-secondary">
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LowStockAlerts;
