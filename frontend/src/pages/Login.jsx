import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/users/token', {
                username,
                password,
            });
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('username', username);
            localStorage.setItem('temp_password', password);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid username or password');
        }
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-body)'
        }}>
            <div style={{
                display: 'flex',
                width: '800px',
                height: '500px',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)',
                background: 'white'
            }}>
                {/* Left Side - Gradient */}
                <div style={{
                    flex: 1,
                    background: 'var(--brand-gradient)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    padding: '2rem'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚛</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}>
                        Sunberry Complaints<br />Management System
                    </h1>
                </div>

                {/* Right Side - Form */}
                <div style={{
                    flex: 1,
                    padding: '3rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        Welcome Back
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Please sign in to your account.
                    </p>

                    {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                Username
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g., admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="........"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1rem' }}>
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
