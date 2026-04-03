import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import '../auth.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const tokenFromUrl = searchParams.get('token') || '';
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!tokenFromUrl) {
            setError('Invalid reset link. Please request a new password reset.');
        }
    }, [tokenFromUrl]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            await api.post('/auth/reset-password', { token: tokenFromUrl, password });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-illustration">
                        <h2>Success!</h2>
                        <p>Your password has been reset.</p>
                        <div style={{ fontSize: '100px', marginTop: '20px' }}>✅</div>
                    </div>
                    <div className="auth-form-container">
                        <h2 className="auth-title">Password Reset</h2>
                        <p style={{ color: 'green', textAlign: 'center', marginBottom: '20px' }}>
                            You can now log in with your new password.
                        </p>
                        <Link to="/login" className="gradient-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                            GO TO LOGIN
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!tokenFromUrl) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-form-container" style={{ flex: 1 }}>
                        <h2 className="auth-title">Invalid Link</h2>
                        <p style={{ color: 'red', textAlign: 'center', marginBottom: '20px' }}>{error}</p>
                        <Link to="/forgot-password" className="gradient-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                            REQUEST NEW RESET LINK
                        </Link>
                        <div className="auth-links" style={{ marginTop: '20px' }}>
                            <p><Link to="/login">Back to Login</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-illustration">
                    <h2>Set New Password</h2>
                    <p>Create a strong password for your account.</p>
                    <div style={{ fontSize: '100px', marginTop: '20px' }}>🔑</div>
                </div>

                <div className="auth-form-container">
                    <h2 className="auth-title">Reset Password</h2>
                    <p className="auth-subtitle">Enter your new password below</p>

                    <form onSubmit={handleSubmit}>
                        {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}

                        <div className="input-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                className="input-field"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Enter new password (min 6 characters)"
                            />
                        </div>

                        <div className="input-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                className="input-field"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Confirm your new password"
                            />
                        </div>

                        <button type="submit" className="gradient-btn" disabled={loading}>
                            {loading ? 'RESETTING...' : 'RESET PASSWORD'}
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

export default ResetPassword;
