import React, { useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import '../reports.css';

const API_BASE = 'http://127.0.0.1:5001/api/reports';

const Reports = () => {
    const role = localStorage.getItem('role') || 'user';

    // Summary state
    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);

    // Export state
    const [reportType, setReportType] = useState('inventory');
    const [dateRange, setDateRange] = useState('all');
    const [exporting, setExporting] = useState(null);

    // Toast state
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ===== Generate Summary =====
    const handleGenerateSummary = async () => {
        setSummaryLoading(true);
        try {
            const res = await api.get('/reports/summary');
            setSummary(res.data);
            showToast('Summary generated successfully!');
        } catch (err) {
            console.error(err);
            showToast('Failed to generate summary', 'error');
        } finally {
            setSummaryLoading(false);
        }
    };

    // ===== Export Handlers =====
    const handleExport = async (format) => {
        setExporting(format);
        try {
            const url = `${API_BASE}/export/${format}?type=${reportType}&range=${dateRange}`;
            const token = localStorage.getItem('token');

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${reportType}_report.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);

            showToast(`${format.toUpperCase()} exported successfully!`);
        } catch (err) {
            console.error(err);
            showToast(`Failed to export ${format.toUpperCase()}`, 'error');
        } finally {
            setExporting(null);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', minimumFractionDigits: 0
        }).format(val);
    };

    return (
        <Layout role={role}>
            <div className="reports-page">
                {/* Page Header */}
                <div className="top-bar">
                    <div>
                        <h1 className="page-title">Reports & Export</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                            Generate summaries and export your inventory data
                        </p>
                    </div>
                </div>

                {/* ===== Inventory Summary Section ===== */}
                <div className="reports-section" id="inventory-summary">
                    <div className="reports-section-header">
                        <div className="section-icon">📊</div>
                        <h3>Inventory Summary</h3>
                    </div>
                    <div className="reports-section-body">
                        <p>
                            Generate a summary of your current inventory levels, including product names,
                            quantities, and values.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={handleGenerateSummary}
                            disabled={summaryLoading}
                            id="generate-summary-btn"
                        >
                            {summaryLoading ? (
                                <>
                                    <span className="reports-spinner" style={{ width: 18, height: 18, borderWidth: 2, marginBottom: 0 }}></span>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Generate Summary
                                </>
                            )}
                        </button>

                        {/* Summary Results */}
                        {summary && (
                            <div style={{ marginTop: '24px', animation: 'slideUp 0.4s ease' }}>
                                {/* Stats Cards */}
                                <div className="summary-stats-grid">
                                    <div className="summary-stat-card">
                                        <div className="summary-stat-icon">📦</div>
                                        <div className="summary-stat-label">Total Products</div>
                                        <div className="summary-stat-value">{summary.total_products}</div>
                                    </div>
                                    <div className="summary-stat-card">
                                        <div className="summary-stat-icon">💰</div>
                                        <div className="summary-stat-label">Total Value</div>
                                        <div className="summary-stat-value">{formatCurrency(summary.total_value)}</div>
                                    </div>
                                    <div className="summary-stat-card">
                                        <div className="summary-stat-icon">📋</div>
                                        <div className="summary-stat-label">Total Quantity</div>
                                        <div className="summary-stat-value">{summary.total_quantity.toLocaleString()}</div>
                                    </div>
                                    <div className="summary-stat-card">
                                        <div className="summary-stat-icon">⚠️</div>
                                        <div className="summary-stat-label">Low Stock Items</div>
                                        <div className="summary-stat-value">{summary.low_stock_count}</div>
                                    </div>
                                </div>

                                {/* Category Breakdown */}
                                {summary.category_breakdown && summary.category_breakdown.length > 0 && (
                                    <div className="reports-section" style={{ marginTop: '16px' }}>
                                        <div className="reports-section-header">
                                            <div className="section-icon">🏷️</div>
                                            <h3>Category Breakdown</h3>
                                        </div>
                                        <div className="reports-section-body" style={{ padding: '16px 24px' }}>
                                            <div className="category-grid">
                                                {summary.category_breakdown.map((cat, i) => (
                                                    <div className="category-card" key={i}>
                                                        <div className="category-info">
                                                            <h4>{cat.category}</h4>
                                                            <span>{cat.count} products · {cat.quantity} units</span>
                                                        </div>
                                                        <div className="category-value">{formatCurrency(cat.value)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Low Stock Items */}
                                {summary.low_stock_items && summary.low_stock_items.length > 0 && (
                                    <div className="reports-section" style={{ marginTop: '16px' }}>
                                        <div className="reports-section-header">
                                            <div className="section-icon" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--danger)' }}>🔻</div>
                                            <h3>Low Stock Alerts ({summary.low_stock_count})</h3>
                                        </div>
                                        <div className="reports-section-body" style={{ padding: '16px 24px' }}>
                                            <div className="low-stock-list">
                                                {summary.low_stock_items.map((item, i) => (
                                                    <div className="low-stock-item" key={i}>
                                                        <div className="low-stock-name">{item.name}</div>
                                                        <div className="low-stock-meta">
                                                            <span className="low-stock-category">{item.category || 'Uncategorized'}</span>
                                                            <span className="low-stock-qty">Qty: {item.quantity}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== Export Reports Section ===== */}
                <div className="reports-section" id="export-reports">
                    <div className="reports-section-header">
                        <div className="section-icon">📥</div>
                        <h3>Export Reports</h3>
                    </div>
                    <div className="reports-section-body">
                        <p>
                            Export detailed reports of your inventory data, including transactions, stock levels, and more.
                        </p>

                        <div className="export-controls">
                            <div className="export-field">
                                <label htmlFor="report-type">Report Type</label>
                                <select
                                    id="report-type"
                                    className="export-select"
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                >
                                    <option value="inventory">Inventory Report</option>
                                    <option value="sales">Sales Report</option>
                                    <option value="low_stock">Low Stock Report</option>
                                </select>
                            </div>
                            <div className="export-field">
                                <label htmlFor="date-range">Date Range</label>
                                <select
                                    id="date-range"
                                    className="export-select"
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    disabled={reportType !== 'sales'}
                                >
                                    <option value="all">All Time</option>
                                    <option value="7days">Last 7 Days</option>
                                    <option value="30days">Last 30 Days</option>
                                    <option value="90days">Last 90 Days</option>
                                </select>
                            </div>
                        </div>

                        <div className="export-actions">
                            <button
                                className="export-btn export-btn-csv"
                                onClick={() => handleExport('csv')}
                                disabled={exporting !== null}
                                id="export-csv-btn"
                            >
                                {exporting === 'csv' ? (
                                    <>
                                        <span className="reports-spinner" style={{ width: 16, height: 16, borderWidth: 2, marginBottom: 0 }}></span>
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Export CSV
                                    </>
                                )}
                            </button>
                            <button
                                className="export-btn export-btn-pdf"
                                onClick={() => handleExport('pdf')}
                                disabled={exporting !== null}
                                id="export-pdf-btn"
                            >
                                {exporting === 'pdf' ? (
                                    <>
                                        <span className="reports-spinner" style={{ width: 16, height: 16, borderWidth: 2, marginBottom: 0 }}></span>
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        Export PDF
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`reports-toast ${toast.type}`}>
                        {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Reports;
