import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import '../auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [devResetLink, setDevResetLink] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        setDevResetLink('');

        try {
            const response = await api.post('/auth/forgot-password', { email });
            setSuccess(response.data?.msg || 'Check your email for the reset link.');
            if (response.data?.reset_link) {
                setDevResetLink(response.data.reset_link);
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-illustration">
                    <h2>Forgot Password?</h2>
                    <p>No worries. Enter your email and we'll send you a reset link.</p>
                    <div style={{ fontSize: '100px', marginTop: '20px' }}>🔐</div>
                </div>

                <div className="auth-form-container">
                    <h2 className="auth-title">Reset Password</h2>
                    <p className="auth-subtitle">Enter your email to receive a reset link</p>

                    <form onSubmit={handleSubmit}>
                        {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
                        {success && <p style={{ color: 'green', textAlign: 'center', marginBottom: '15px' }}>{success}</p>}
                        {devResetLink && (
                            <p style={{ marginBottom: '15px', fontSize: '0.9rem' }}>
                                <a href={devResetLink} style={{ color: '#764ba2', wordBreak: 'break-all' }}>
                                    Click here to reset password
                                </a>
                            </p>
                        )}

                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@example.com"
                            />
                        </div>

                        <button type="submit" className="gradient-btn" disabled={loading}>
                            {loading ? 'SENDING...' : 'SEND RESET LINK'}
                        </button>

                        <div className="auth-links">
                            <p><Link to="/login">Back to Login</Link></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
