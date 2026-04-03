import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import api from '../api';
import Layout from '../components/Layout';
import '../dashboard.css';

const SalesDashboard = () => {
    const [summary, setSummary] = useState({ total_revenue: 0, total_items_sold: 0, total_orders: 0 });
    const [trends, setTrends] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const role = localStorage.getItem('role');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [summaryRes, trendsRes, topProductsRes] = await Promise.all([
                api.get('/sales-analytics/summary'),
                api.get('/sales-analytics/trends'),
                api.get('/sales-analytics/top-products')
            ]);
            
            setSummary(summaryRes.data);
            setTrends(trendsRes.data);
            setTopProducts(topProductsRes.data);
        } catch (error) {
            console.error('Failed to fetch sales analytics data', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
    };

    return (
        <Layout role={role}>
            <div className="page-header">
                <div>
                    <h1>Sales Analytics</h1>
                    <p className="subtitle">Comprehensive overview of your sales performance</p>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading analytics data...</div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="dashboard-grid">
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(16,185,129,0.03) 100%)' }}>
                            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>💰</div>
                            <div className="stat-content">
                                <h3>Total Revenue</h3>
                                <div className="stat-value">{formatCurrency(summary.total_revenue)}</div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(59,130,246,0.03) 100%)' }}>
                            <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6' }}>📦</div>
                            <div className="stat-content">
                                <h3>Items Sold</h3>
                                <div className="stat-value">{summary.total_items_sold}</div>
                            </div>
                        </div>
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--card-bg) 0%, rgba(139,92,246,0.03) 100%)' }}>
                            <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.08)', color: '#8b5cf6' }}>🧾</div>
                            <div className="stat-content">
                                <h3>Total Orders</h3>
                                <div className="stat-value">{summary.total_orders}</div>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
                        {/* Sales Trend Chart */}
                        <div className="dashboard-section" style={{ gridColumn: '1 / -1' }}>
                            <div className="section-header">
                                <span>Sales Trend (Last 30 Days)</span>
                            </div>
                            <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
                                {trends && trends.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                                            <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={12} tickFormatter={(value) => `₹${value}`} />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                                itemStyle={{ color: 'var(--text-primary)' }}
                                            />
                                            <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                        No sales data available for the selected period
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Products Chart */}
                        <div className="dashboard-section" style={{ gridColumn: '1 / -1' }}>
                            <div className="section-header">
                                <span>Top Selling Products</span>
                            </div>
                            <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
                                {topProducts && topProducts.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topProducts} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                            <YAxis yAxisId="left" orientation="left" stroke="var(--text-muted)" fontSize={12} />
                                            <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={12} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Bar yAxisId="left" dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                                            <Bar yAxisId="right" dataKey="quantity" name="Quantity Sold" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                        No product sales recorded yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Layout>
    );
};

export default SalesDashboard;
