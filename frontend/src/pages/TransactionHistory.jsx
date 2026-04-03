import React, { useEffect, useState } from 'react';
import api from '../api';
import Layout from '../components/Layout';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const role = localStorage.getItem('role');

    const [form, setForm] = useState({
        type: '',
        product_id: '',
        quantity: '',
        price: '',
        notes: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTransactions(1);
        fetchProducts();
    }, []);

    const fetchTransactions = async (pageNumber) => {
        setLoading(true);
        try {
            const response = await api.get(`/transactions/?page=${pageNumber}`);
            const data = response.data;
            if (data && data.data) {
                setTransactions(data.data);
                setTotalPages(data.pagination.pages);
                setPage(data.pagination.page);
            } else {
                setTransactions([]);
            }
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products/');
            const productArray = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setProducts(productArray);
        } catch (e) {
            console.error('Failed to fetch products', e);
        }
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                type: form.type,
                product_id: form.product_id,
                quantity: parseInt(form.quantity, 10),
                price: form.price === '' ? undefined : parseFloat(form.price),
                notes: form.notes || undefined,
                reason: form.type === 'PURCHASE' ? 'Purchase' : (form.type === 'SALE' ? 'Sale' : undefined),
            };
            await api.post('/transactions/', payload);
            setForm({ type: '', product_id: '', quantity: '', price: '', notes: '' });
            fetchTransactions(1);
            fetchProducts();
        } catch (error) {
            const msg = error?.response?.data?.msg || 'Failed to add transaction';
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleNextPage = () => {
        if (page < totalPages) {
            fetchTransactions(page + 1);
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            fetchTransactions(page - 1);
        }
    };

    const getBadgeStyle = (type) => {
        if (type === 'STOCK_IN') return <span className="badge badge-success">Stock In</span>;
        if (type === 'STOCK_OUT') return <span className="badge badge-danger">Stock Out</span>;
        return <span className="badge badge-neutral">{type}</span>;
    };

    return (
        <Layout role={role}>
            <div className="page-header">
                <div>
                    <h1>Transaction History</h1>
                    <p className="subtitle">View all inventory movements (additions, sales, manual updates)</p>
                </div>
            </div>

            {/* Add Transaction */}
            <div className="premium-table-wrapper" style={{ marginBottom: 16 }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
                    <h3 style={{ margin: 0 }}>Add Transaction</h3>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Record purchases and sales. Stock levels update automatically.
                    </p>
                </div>
                <form onSubmit={handleAddTransaction} style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                Transaction Type
                            </label>
                            <select
                                className="modal-input"
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                                required
                                style={{ marginBottom: 0 }}
                            >
                                <option value="" disabled>Select Transaction Type</option>
                                <option value="PURCHASE">Purchase (Stock In)</option>
                                <option value="SALE">Sale (Stock Out)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                Product
                            </label>
                            <select
                                className="modal-input"
                                value={form.product_id}
                                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                                required
                                style={{ marginBottom: 0 }}
                            >
                                <option value="" disabled>Select Product</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} (Stock: {p.quantity})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                Quantity
                            </label>
                            <input
                                type="number"
                                min={1}
                                className="modal-input"
                                value={form.quantity}
                                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                required
                                placeholder="e.g. 10"
                                style={{ marginBottom: 0 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                                Price (optional)
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                className="modal-input"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                placeholder="unit price"
                                style={{ marginBottom: 0 }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                            Notes (optional)
                        </label>
                        <textarea
                            className="modal-input"
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            placeholder="Add notes..."
                            rows={3}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                        <button className="btn btn-primary" type="submit" disabled={submitting}>
                            {submitting ? 'Adding...' : 'Add Transaction'}
                        </button>
                    </div>
                </form>
            </div>

            {loading ? (
                <div className="premium-table-wrapper">
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading history...</div>
                </div>
            ) : transactions.length === 0 ? (
                <div className="premium-table-wrapper">
                    <div className="empty-state">
                        <div className="empty-icon">📜</div>
                        <h3>No transactions found</h3>
                        <p>Stock movements will appear here.</p>
                    </div>
                </div>
            ) : (
                <div className="premium-table-wrapper">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Product Name</th>
                                <th>Type</th>
                                <th>Quantity Change</th>
                                <th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(t => (
                                <tr key={t.id}>
                                    <td style={{ color: 'var(--text-secondary)' }}>
                                        {new Date(t.created_at).toLocaleString('en-US', {
                                            month: 'short', day: 'numeric',
                                            hour: 'numeric', minute: '2-digit'
                                        })}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{t.product_name}</td>
                                    <td>{getBadgeStyle(t.type)}</td>
                                    <td style={{ 
                                        fontWeight: 700, 
                                        color: t.type === 'STOCK_IN' ? 'var(--success)' : 'var(--danger)',
                                        fontVariantNumeric: 'tabular-nums' 
                                    }}>
                                        {t.type === 'STOCK_IN' ? '+' : '-'}{t.quantity}
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{t.reason || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Page {page} of {totalPages}
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                    onClick={handlePrevPage} 
                                    disabled={page === 1}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Previous
                                </button>
                                <button 
                                    onClick={handleNextPage} 
                                    disabled={page === totalPages}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Layout>
    );
};

export default TransactionHistory;
