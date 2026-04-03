import React, { useEffect, useState } from 'react';
import api from '../api';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const role = localStorage.getItem('role');
    const navigate = useNavigate();

    useEffect(() => {
        if (role !== 'admin') {
            navigate('/dashboard');
            return;
        }
        fetchUsers();
    }, [role, navigate]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/auth/users');
            setUsers(response.data);
        } catch (err) {
            setError('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (email) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await api.delete(`/auth/users/${encodeURIComponent(email)}`);
                setUsers(users.filter(user => user.email !== email));
            } catch (err) {
                alert(err.response?.data?.msg || 'Failed to delete user');
            }
        }
    };

    const getRoleBadge = (userRole) => {
        if (userRole === 'admin') return <span className="badge badge-info">Admin</span>;
        return <span className="badge badge-neutral">Employee</span>;
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <Layout role={role}>
            <div className="page-header">
                <div>
                    <h1>User Management</h1>
                    <p className="subtitle">{users.length} registered users</p>
                </div>
            </div>

            {error && (
                <div style={{ padding: '14px 18px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontWeight: 500, fontSize: '0.9rem', border: '1px solid rgba(239,68,68,0.15)' }}>
                    {error}
                </div>
            )}

            {loading ? (
                <div className="premium-table-wrapper">
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading users...</div>
                </div>
            ) : users.length === 0 ? (
                <div className="premium-table-wrapper">
                    <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <h3>No users found</h3>
                        <p>Register users to see them here</p>
                    </div>
                </div>
            ) : (
                <div className="premium-table-wrapper">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.email}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: 'var(--gradient-primary)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontSize: '0.8rem', fontWeight: 700,
                                                flexShrink: 0
                                            }}>
                                                {getInitials(user.name)}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{user.name || '—'}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                                    <td>{getRoleBadge(user.role)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleDelete(user.email)}
                                            className="btn btn-danger btn-sm"
                                        >
                                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Layout>
    );
};

export default UserManagement;
