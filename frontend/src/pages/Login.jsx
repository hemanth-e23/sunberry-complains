import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await api.post('/users/token', {
                username,
                password,
            });
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('username', response.data.user?.username || username);
            localStorage.setItem('userRole', response.data.user?.role || 'user');
            localStorage.setItem('isSuperuser', response.data.user?.is_superuser ? 'true' : 'false');
            navigate('/dashboard');
        } catch (err) {
            if (err.response?.status === 403) {
                setError('Your account is inactive. Please contact an administrator.');
            } else {
                setError('Invalid username or password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-body)',
        }}>
            <div className="animate-slide-in" style={{
                display: 'flex',
                width: '880px',
                maxWidth: '95%',
                minHeight: '520px',
                borderRadius: 'var(--radius-2xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)',
                background: 'white',
            }}>
                {/* Left Side - Gradient Panel */}
                <div style={{
                    flex: 1,
                    background: 'var(--brand-gradient)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    padding: '3rem 2rem',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Decorative circles */}
                    <div style={{
                        position: 'absolute', top: '-40px', left: '-40px',
                        width: '160px', height: '160px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-60px', right: '-30px',
                        width: '200px', height: '200px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                    }} />
                    <div style={{
                        position: 'absolute', top: '40%', right: '-20px',
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)',
                    }} />

                    <div style={{
                        fontSize: '4rem',
                        marginBottom: '1.5rem',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                    }}>🚛</div>
                    <h1 style={{
                        fontSize: '1.625rem',
                        fontWeight: '800',
                        textAlign: 'center',
                        lineHeight: '1.3',
                        letterSpacing: '-0.02em',
                    }}>
                        Sunberry
                        <br />
                        <span style={{ fontWeight: '400', fontSize: '1.125rem', opacity: 0.9 }}>
                            Complaint Management
                        </span>
                    </h1>
                    <div style={{
                        marginTop: '2rem',
                        padding: '0.75rem 1.25rem',
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.8125rem',
                        backdropFilter: 'blur(10px)',
                        textAlign: 'center',
                        lineHeight: '1.5',
                    }}>
                        Track, manage &amp; resolve<br />complaints efficiently
                    </div>
                </div>

                {/* Right Side - Form */}
                <div style={{
                    flex: 1,
                    padding: '3rem 2.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}>
                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        marginBottom: '0.375rem',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.02em',
                    }}>
                        Welcome back
                    </h2>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '2rem',
                        fontSize: '0.9375rem',
                    }}>
                        Sign in to your account to continue.
                    </p>

                    {error && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#B91C1C',
                            background: '#FEF2F2',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: '1.25rem',
                            fontSize: '0.875rem',
                            border: '1px solid #FECACA',
                        }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="info-label">Username</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="info-label">Password</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={loading}
                            style={{ fontWeight: '600' }}
                        >
                            {loading ? (
                                <><div className="spinner-sm spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Signing in...</>
                            ) : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
