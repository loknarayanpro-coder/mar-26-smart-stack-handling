import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import '../auth.css';

const Signup = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'employee' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Add a timeout to the request configuration
            const response = await api.post('/auth/register', formData, { timeout: 10000 });

            setSuccess('Registration successful! Redirecting to login...');

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error('Registration Error:', err);
            let errMsg =
                err.response?.data?.detail ||
                err.response?.data?.msg ||
                err.message ||
                'Registration failed.';
            if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
                errMsg =
                    'Cannot reach the server. Start the backend from the project folder: cd backend && python main.py (must listen on port 5001), then try again.';
            }
            setError(errMsg);
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Left Side Illustration */}
                <div className="auth-illustration">
                    <h2>Welcome!</h2>
                    <p>Join our community and start your journey.</p>
                    <div style={{ fontSize: '100px', marginTop: '20px' }}>🌟</div>
                </div>

                {/* Right Side Form */}
                <div className="auth-form-container">
                    <h2 className="auth-title">Sign Up</h2>
                    <p className="auth-subtitle">Create your account</p>

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

                        <button type="submit" className="gradient-btn" disabled={loading}>
                            {loading ? 'REGISTERING...' : 'REGISTER'}
                        </button>

                        <div className="auth-links">
                            <p>Already have an account? <Link to="/login">Login</Link></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;
