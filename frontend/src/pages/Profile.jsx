import React, { useEffect, useState } from 'react';
import api from '../api';
import Layout from '../components/Layout';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const role = localStorage.getItem('role');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data);
            } catch (error) {
                console.error('Failed to fetch profile', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return (
        <Layout role={role}>
            <div className="page-header"><h1>My Profile</h1></div>
            <div className="card" style={{ maxWidth: '600px' }}>
                <div className="card-body" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Loading profile...
                </div>
            </div>
        </Layout>
    );

    const getRoleBadge = (r) => {
        if (r === 'admin') return <span className="badge badge-info">Admin</span>;
        return <span className="badge badge-neutral">Employee</span>;
    };

    const InfoField = ({ icon, label, value, mono }) => (
        <div style={{
            padding: '16px 20px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', gap: '14px',
            transition: 'all 0.2s ease'
        }}>
            <div style={{
                width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.08))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', flexShrink: 0
            }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit', wordBreak: 'break-all' }}>{value || '—'}</div>
            </div>
        </div>
    );

    return (
        <Layout role={role}>
            <div className="page-header">
                <h1>My Profile</h1>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                <div className="card-body">
                    {/* Avatar + Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '28px', fontWeight: 800,
                            boxShadow: '0 6px 20px rgba(124,58,237,0.3)',
                            position: 'relative', flexShrink: 0
                        }}>
                            {user?.name?.charAt(0).toUpperCase()}
                            {/* Animated ring */}
                            <div style={{
                                position: 'absolute', inset: '-4px', borderRadius: '50%',
                                border: '2px solid transparent',
                                background: 'linear-gradient(135deg, #7c3aed, #06b6d4) border-box',
                                WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                                WebkitMaskComposite: 'xor', maskComposite: 'exclude',
                                animation: 'pulse-glow 3s ease-in-out infinite'
                            }}></div>
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>{user?.name}</h2>
                            {getRoleBadge(user?.role)}
                        </div>
                    </div>

                    {/* Info Fields */}
                    <div style={{ display: 'grid', gap: '12px' }}>
                        <InfoField icon="📧" label="Email Address" value={user?.email} />
                        <InfoField icon="🆔" label="User ID" value={user?.id} mono />
                        <InfoField icon="📅" label="Account Created" value={user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
