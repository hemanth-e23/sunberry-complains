import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { formatDate } from '../utils/dateUtils';

const UserManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'user', is_superuser: false });
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users/');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            if (error.response?.status === 403) {
                alert('Access denied. Superuser privileges required.');
                navigate('/dashboard');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users/', formData);
            setShowCreateModal(false);
            setFormData({ username: '', password: '', role: 'user', is_superuser: false });
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.detail || 'Error creating user');
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/users/${selectedUser.id}`, {
                username: formData.username,
                role: formData.role,
                is_superuser: formData.is_superuser,
            });
            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.detail || 'Error updating user');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword) return;
        try {
            await api.post(`/admin/users/${selectedUser.id}/reset-password`, {
                new_password: newPassword
            });
            setShowResetModal(false);
            setSelectedUser(null);
            setNewPassword('');
            alert('Password reset successfully');
        } catch (error) {
            alert(error.response?.data?.detail || 'Error resetting password');
        }
    };

    const handleToggleStatus = async (userId) => {
        try {
            await api.post(`/admin/users/${userId}/toggle-status`);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.detail || 'Error toggling user status');
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setFormData({ username: user.username, role: user.role, is_superuser: user.is_superuser });
        setShowEditModal(true);
    };

    const openResetModal = (user) => {
        setSelectedUser(user);
        setNewPassword('');
        setShowResetModal(true);
    };

    const stats = {
        total: users.length,
        active: users.filter(u => u.is_active).length,
        admins: users.filter(u => u.role === 'admin').length,
        superusers: users.filter(u => u.is_superuser).length,
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)', padding: '2rem' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* Back + Header */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-ghost"
                    style={{ marginBottom: '1rem', padding: '0.5rem 0', color: 'var(--primary)' }}
                >
                    ← Back to Dashboard
                </button>

                <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            User Management
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            {stats.total} users · {stats.active} active · {stats.admins} admin{stats.admins !== 1 ? 's' : ''} · {stats.superusers} superuser{stats.superusers !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button onClick={() => { setFormData({ username: '', password: '', role: 'user', is_superuser: false }); setShowCreateModal(true); }} className="btn btn-primary">
                        + Create User
                    </button>
                </div>

                {/* Users Table */}
                <div className="table-container animate-fade-in" style={{ animationDelay: '0.05s', opacity: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '34px', height: '34px', borderRadius: '50%',
                                                background: user.role === 'admin' ? 'var(--brand-gradient)' : 'var(--bg-hover)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: user.role === 'admin' ? 'white' : 'var(--text-secondary)',
                                                fontSize: '0.8125rem', fontWeight: '700', flexShrink: 0,
                                            }}>
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.username}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                                            <span className="badge" style={{
                                                background: user.role === 'admin' ? '#FEF3C7' : '#EFF6FF',
                                                color: user.role === 'admin' ? '#92400E' : '#1E40AF',
                                            }}>
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </span>
                                            {user.is_superuser && (
                                                <span className="badge" style={{
                                                    background: '#F0EAFF', color: '#6D28D9',
                                                    border: '1px solid #DDD6FE',
                                                }}>
                                                    ⭐ Super
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge" style={{
                                            background: user.is_active ? '#F0FDF4' : '#FEF2F2',
                                            color: user.is_active ? '#16A34A' : '#DC2626',
                                        }}>
                                            {user.is_active ? '● Active' : '● Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                                            <button onClick={() => openEditModal(user)} className="btn btn-secondary btn-sm">
                                                Edit
                                            </button>
                                            <button onClick={() => openResetModal(user)} className="btn btn-sm" style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
                                                Reset PW
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(user.id)}
                                                className={`btn btn-sm ${user.is_active ? 'btn-danger' : 'btn-success'}`}
                                            >
                                                {user.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Create User Modal */}
                {showCreateModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.375rem', color: 'var(--text-primary)' }}>
                                Create New User
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                Add a new user account to the system.
                            </p>
                            <form onSubmit={handleCreateUser}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="info-label">Username</label>
                                    <input
                                        type="text" className="input-field"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required placeholder="Enter username"
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="info-label">Password</label>
                                    <input
                                        type="password" className="input-field"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required placeholder="Enter password"
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="info-label">Role</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {['user', 'admin'].map(role => (
                                            <button
                                                key={role} type="button"
                                                onClick={() => setFormData({ ...formData, role })}
                                                style={{
                                                    flex: 1, padding: '0.625rem 1rem',
                                                    border: formData.role === role ? '2px solid var(--primary)' : '2px solid var(--border)',
                                                    background: formData.role === role ? 'rgba(124,58,237,0.06)' : 'white',
                                                    color: formData.role === role ? 'var(--primary)' : 'var(--text-secondary)',
                                                    borderRadius: 'var(--radius-lg)',
                                                    cursor: 'pointer',
                                                    fontWeight: formData.role === role ? '600' : '400',
                                                    fontSize: '0.875rem',
                                                    fontFamily: 'inherit',
                                                    transition: 'all var(--transition-base)',
                                                }}
                                            >
                                                {role === 'admin' ? '🛡️ Admin' : '👤 User'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.625rem',
                                            padding: '0.75rem 1rem',
                                            border: formData.is_superuser ? '2px solid #7C3AED' : '2px solid var(--border)',
                                            background: formData.is_superuser ? 'rgba(124,58,237,0.06)' : 'white',
                                            borderRadius: 'var(--radius-lg)',
                                            cursor: 'pointer',
                                            transition: 'all var(--transition-base)',
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.is_superuser}
                                            onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                                            style={{ width: '16px', height: '16px', accentColor: '#7C3AED' }}
                                        />
                                        <div>
                                            <span style={{ fontWeight: '600', fontSize: '0.875rem', color: formData.is_superuser ? '#7C3AED' : 'var(--text-secondary)' }}>
                                                ⭐ Superuser
                                            </span>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                                                Can manage users, reset passwords &amp; system settings
                                            </p>
                                        </div>
                                    </label>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                                    <button type="submit" className="btn btn-primary">Create User</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {showEditModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.375rem', color: 'var(--text-primary)' }}>
                                Edit User
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                Update user details for <strong>{selectedUser?.username}</strong>.
                            </p>
                            <form onSubmit={handleUpdateUser}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="info-label">Username</label>
                                    <input
                                        type="text" className="input-field"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="info-label">Role</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {['user', 'admin'].map(role => (
                                            <button
                                                key={role} type="button"
                                                onClick={() => setFormData({ ...formData, role })}
                                                style={{
                                                    flex: 1, padding: '0.625rem 1rem',
                                                    border: formData.role === role ? '2px solid var(--primary)' : '2px solid var(--border)',
                                                    background: formData.role === role ? 'rgba(124,58,237,0.06)' : 'white',
                                                    color: formData.role === role ? 'var(--primary)' : 'var(--text-secondary)',
                                                    borderRadius: 'var(--radius-lg)',
                                                    cursor: 'pointer',
                                                    fontWeight: formData.role === role ? '600' : '400',
                                                    fontSize: '0.875rem',
                                                    fontFamily: 'inherit',
                                                    transition: 'all var(--transition-base)',
                                                }}
                                            >
                                                {role === 'admin' ? '🛡️ Admin' : '👤 User'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.625rem',
                                            padding: '0.75rem 1rem',
                                            border: formData.is_superuser ? '2px solid #7C3AED' : '2px solid var(--border)',
                                            background: formData.is_superuser ? 'rgba(124,58,237,0.06)' : 'white',
                                            borderRadius: 'var(--radius-lg)',
                                            cursor: 'pointer',
                                            transition: 'all var(--transition-base)',
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.is_superuser}
                                            onChange={(e) => setFormData({ ...formData, is_superuser: e.target.checked })}
                                            style={{ width: '16px', height: '16px', accentColor: '#7C3AED' }}
                                        />
                                        <div>
                                            <span style={{ fontWeight: '600', fontSize: '0.875rem', color: formData.is_superuser ? '#7C3AED' : 'var(--text-secondary)' }}>
                                                ⭐ Superuser
                                            </span>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                                                Can manage users, reset passwords &amp; system settings
                                            </p>
                                        </div>
                                    </label>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
                                    <button type="submit" className="btn btn-primary">Update User</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Reset Password Modal */}
                {showResetModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.375rem', color: 'var(--text-primary)' }}>
                                Reset Password
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                Set a new password for <strong>{selectedUser?.username}</strong>.
                            </p>
                            <form onSubmit={handleResetPassword}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label className="info-label">New Password</label>
                                    <input
                                        type="password" className="input-field"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required placeholder="Enter new password"
                                        autoFocus
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowResetModal(false)} className="btn btn-secondary">Cancel</button>
                                    <button type="submit" className="btn btn-primary">Reset Password</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
