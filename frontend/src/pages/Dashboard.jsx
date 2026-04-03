import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalValue: 0,
        lowStockCount: 0,
        categories: 0
    });
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [saleForm, setSaleForm] = useState({ product_id: '', quantity_sold: 1 });
    const [saleSuccess, setSaleSuccess] = useState('');
    const [saleError, setSaleError] = useState('');
    const role = localStorage.getItem('role');
    const location = useLocation();

    const fetchData = async () => {
        setFetchError('');
        try {
            const [productsRes, alertsRes] = await Promise.all([
                api.get('/products/?per_page=100'),
                api.get('/products/alerts')
            ]);

            const productsData = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data.data || []);
            const alertsData = Array.isArray(alertsRes.data) ? alertsRes.data : [];
            const pagination = productsRes.data?.pagination;
            const totalProductCount = pagination?.total ?? productsData.length;

            const totalValue = productsData.reduce((acc, curr) => acc + ((curr.price || 0) * (curr.quantity || 0)), 0);
            const categories = new Set(productsData.map(p => p.category).filter(Boolean)).size;

            setStats({
                totalProducts: totalProductCount,
                totalValue: totalValue,
                lowStockCount: alertsData.length,
                categories: categories
            });
            setProducts(productsData);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
            setFetchError('Unable to load data. Ensure the backend is running on port 5001 and MongoDB is connected.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (location.pathname !== '/dashboard') return;
        fetchData();
    }, [location.pathname]);

    useEffect(() => {
        const hash = location.hash;
        if (hash) {
            const el = document.getElementById(hash.slice(1));
            if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    }, [location.hash]);

    const handleStockUpdate = async (productId, currentQty, change) => {
        try {
            await api.put(`/products/${productId}`, { quantity: currentQty + change });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to update stock');
        }
    };

    const handleSaleSubmit = async (e) => {
        e.preventDefault();
        setSaleError('');
        setSaleSuccess('');
        if (!saleForm.product_id || saleForm.quantity_sold < 1) {
            setSaleError('Select a product and enter quantity');
            return;
        }
        try {
            const res = await api.post('/products/sales', {
                product_id: saleForm.product_id,
                quantity_sold: parseInt(saleForm.quantity_sold) || 1
            });
            setSaleSuccess(`Sale recorded! Total: ₹${(res.data.total || 0).toFixed(2)}`);
            setSaleForm({ product_id: '', quantity_sold: 1 });
            fetchData();
        } catch (err) {
            setSaleError(err.response?.data?.msg || 'Failed to record sale');
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
    };

    const statCards = [
        { icon: '📦', label: 'Total Products', value: stats.totalProducts, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', path: '/inventory' },
        { icon: '💰', label: 'Total Value', value: formatCurrency(stats.totalValue), color: '#10b981', bg: 'rgba(16,185,129,0.08)', path: '/reports' },
        { icon: '🏷️', label: 'Categories', value: stats.categories, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', path: '/inventory' },
        { icon: '⚠️', label: 'Low Stock Alerts', value: stats.lowStockCount, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', path: '/alerts' },
    ];

    return (
        <Layout role={role}>
            {/* Top Bar */}
            <div className="top-bar">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '0.9rem' }}>Overview of your inventory status</p>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, background: 'var(--surface)', padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Error Banner */}
            {fetchError && (
                <div style={{ padding: '14px 18px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontWeight: 500, fontSize: '0.9rem', border: '1px solid rgba(239,68,68,0.15)' }}>
                    {fetchError}
                </div>
            )}

            {/* Empty State */}
            {!loading && !fetchError && products.length === 0 && (
                <div style={{ padding: '14px 18px', background: 'var(--info-bg)', color: 'var(--info)', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '0.9rem', border: '1px solid rgba(59,130,246,0.15)' }}>
                    No products yet. Go to <Link to="/inventory" style={{ fontWeight: 700, color: 'var(--primary)' }}>Inventory</Link> to add your first product.
                </div>
            )}

            {/* Stats Grid */}
            <div className="stats-grid">
                {statCards.map((card, i) => (
                    <Link to={card.path} key={i} className="stat-card" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                        <div className="stat-icon-wrapper" style={{ background: card.bg, color: card.color }}>
                            {card.icon}
                        </div>
                        <div className="stat-info">
                            <h4>{card.label}</h4>
                            <p>{loading ? '—' : card.value}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Low stock shortcut + Tips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div className="dashboard-section">
                    <div className="section-header">
                        <span>Low stock</span>
                        <Link to="/alerts" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>Open Alerts page →</Link>
                    </div>
                    {loading ? (
                        <p style={{ color: 'var(--text-secondary)', padding: '10px 0' }}>Loading...</p>
                    ) : stats.lowStockCount === 0 ? (
                        <div className="no-data">
                            <p>No low-stock items 🎉</p>
                            <p style={{ fontSize: '0.88rem', marginTop: '6px', color: 'var(--text-muted)' }}>Thresholds and email are on the Alerts page.</p>
                        </div>
                    ) : (
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <strong style={{ color: 'var(--text-primary)' }}>{stats.lowStockCount}</strong> product{stats.lowStockCount !== 1 ? 's' : ''} below reorder / minimum threshold.
                            {' '}<Link to="/alerts" style={{ fontWeight: 700, color: 'var(--primary)' }}>View the full list on the Alerts page</Link>
                            {' '}or <Link to="/inventory?filter=low-stock" style={{ fontWeight: 600, color: 'var(--primary)' }}>filter in Inventory</Link>.
                        </p>
                    )}
                </div>

                {/* Quick Tips */}
                <div className="dashboard-section">
                    <div className="section-header">
                        <span>Quick Tips</span>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.06))', padding: '18px 20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--success)' }}>
                        <h4 style={{ margin: '0 0 6px', color: 'var(--success)', fontSize: '0.95rem', fontWeight: 700 }}>📊 Inventory Health</h4>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Running low on stock? Open the <Link to="/alerts" style={{ fontWeight: 700, color: 'var(--primary)' }}>Alerts page</Link> or use the stat card above.</p>
                    </div>

                    <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(244,114,182,0.06))', padding: '18px 20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)', marginTop: '12px' }}>
                        <h4 style={{ margin: '0 0 6px', color: 'var(--primary)', fontSize: '0.95rem', fontWeight: 700 }}>💡 Pro Tip</h4>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>Use the "Sales Entry" section below to quickly record transactions and keep your inventory accurate.</p>
                    </div>
                </div>
            </div>

            {/* Stock Update + Sales Entry */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '8px' }}>
                {/* Products Stock Update */}
                <div id="stock-update" className="dashboard-section">
                    <div className="section-header">
                        <span>Products Stock Update</span>
                        <Link to="/inventory" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Manage All</Link>
                    </div>
                    {loading ? <p style={{ color: 'var(--text-secondary)', padding: '10px 0' }}>Loading...</p> : products.length === 0 ? (
                        <div className="no-data">
                            <p>No products yet.</p>
                            <p style={{ fontSize: '0.88rem', marginTop: '6px', color: 'var(--text-muted)' }}>Go to Products to add your first product.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="premium-table" style={{ boxShadow: 'none' }}>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Stock</th>
                                        <th style={{ textAlign: 'right' }}>Update</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.slice(0, 5).map(p => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                                            <td>
                                                <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{p.quantity ?? 0}</span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                    <button type="button" onClick={() => handleStockUpdate(p.id, p.quantity || 0, -1)} className="btn-icon">−</button>
                                                    <button type="button" onClick={() => handleStockUpdate(p.id, p.quantity || 0, 1)} className="btn-icon">+</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Sales Entry */}
                <div id="sales-entry" className="dashboard-section">
                    <div className="section-header">
                        <span>Sales Entry</span>
                    </div>
                    <form onSubmit={handleSaleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {saleError && <div style={{ color: 'var(--danger)', fontSize: '0.88rem', padding: '10px 14px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.15)' }}>{saleError}</div>}
                        {saleSuccess && <div style={{ color: 'var(--success)', fontSize: '0.88rem', padding: '10px 14px', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.15)' }}>{saleSuccess}</div>}
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Product</label>
                            <select
                                value={saleForm.product_id}
                                onChange={e => setSaleForm({ ...saleForm, product_id: e.target.value })}
                                required
                                className="modal-input"
                                style={{ marginBottom: 0 }}
                            >
                                <option value="">Select product...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity ?? 0})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Quantity Sold</label>
                            <input
                                type="number"
                                min="1"
                                value={saleForm.quantity_sold}
                                onChange={e => setSaleForm({ ...saleForm, quantity_sold: e.target.value })}
                                className="modal-input"
                                style={{ marginBottom: 0 }}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ marginTop: '4px' }}>
                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            Record Sale
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
