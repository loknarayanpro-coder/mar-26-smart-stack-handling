import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import '../auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/login', { email, password });

            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('role', response.data.role);
                navigate('/dashboard');
            } else {
                setError('Login failed: No token received');
                setLoading(false);
            }
        } catch (err) {
            let msg = err.response?.data?.msg || 'Invalid credentials';
            if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
                msg = 'Cannot reach the server. Start the backend: cd backend && python main.py (port 5001), then refresh.';
            }
            setError(msg);
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Left Side Illustration */}
                <div className="auth-illustration">
                    <h2>Welcome Back!</h2>
                    <p>Access your dashboard to manage inventory efficiently.</p>
                    {/* Placeholder for illustration */}
                    <div style={{ fontSize: '100px', marginTop: '20px' }}>📦</div>
                </div>

                {/* Right Side Form */}
                <div className="auth-form-container">
                    <h2 className="auth-title">Login</h2>
                    <p className="auth-subtitle">Sign in to your account</p>

                    <form onSubmit={handleSubmit}>
                        {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}

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

                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                className="input-field"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
                            />
                        </div>

                        <button type="submit" className="gradient-btn" disabled={loading}>
                            {loading ? 'LOGGING IN...' : 'SIGN IN'}
                        </button>

                        <div className="auth-links">
                            <p>Don't have an account? <Link to="/signup">Create an Account</Link></p>
                            <p><Link to="/forgot-password">Forgot Password?</Link></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
