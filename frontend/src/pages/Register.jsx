import React, { useState } from 'react';
import api from '../api';
import '../auth.css';
import Layout from '../components/Layout';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const role = localStorage.getItem('role');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/register', formData);
            setSuccess('User registered successfully');
            setFormData({ name: '', email: '', password: '', role: 'employee' });
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed');
            setLoading(false);
        }
    };

    const formContent = (
        <div className="auth-card" style={role ? { margin: '0 auto', height: 'auto', boxShadow: 'none', border: '1px solid #ddd' } : {}}>
            {/* Left Side Illustration */}
            <div className="auth-illustration">
                <h2>Join Us!</h2>
                <p>Create an account to start managing your inventory today.</p>
                <div style={{ fontSize: '100px', marginTop: '20px' }}>🚀</div>
            </div>

            {/* Right Side Form */}
            <div className="auth-form-container">
                <h2 className="auth-title">Register</h2>
                <p className="auth-subtitle">Create a new employee account</p>

                <form onSubmit={handleSubmit}>
                    {success && <p style={{ color: 'green', textAlign: 'center', marginBottom: '15px' }}>{success}</p>}
                    {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}

                    <div className="input-group">
                        <label>Full Name</label>
                        <input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="input-field"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="input-field"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                            className="input-field"
                            placeholder="Create a password"
                        />
                    </div>

                    {role === 'admin' && (
                        <div className="input-group">
                            <label>Role</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                className="input-field"
                            >
                                <option value="employee">Employee</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    )}

                    <button type="submit" className="gradient-btn" disabled={loading}>
                        {loading ? 'REGISTERING...' : 'REGISTER'}
                    </button>
                </form>
            </div>
        </div>
    );

    if (role) {
        return (
            <Layout role={role}>
                <div style={{ padding: '20px' }}>
                    {formContent}
                </div>
            </Layout>
        );
    }

    return (
        <div className="auth-page">
            {formContent}
        </div>
    );
};

export default Register;
