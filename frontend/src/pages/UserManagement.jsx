import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const UserManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'user'
    });

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
                alert('Access denied. Admin privileges required.');
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
            setFormData({ username: '', password: '', role: 'user' });
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
                role: formData.role
            });
            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.detail || 'Error updating user');
        }
    };

    const handleResetPassword = async (userId) => {
        const newPassword = prompt('Enter new password:');
        if (!newPassword) return;

        try {
            await api.post(`/admin/users/${userId}/reset-password`, {
                new_password: newPassword
            });
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
        setFormData({
            username: user.username,
            role: user.role
        });
        setShowEditModal(true);
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            User Management
                        </h1>
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{ color: 'var(--brand-primary)', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary"
                    >
                        + Create User
                    </button>
                </div>

                {/* Users Table */}
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Username</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Role</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Created</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>{user.username}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            background: user.role === 'admin' ? '#FEF3C7' : '#DBEAFE',
                                            color: user.role === 'admin' ? '#92400E' : '#1E40AF',
                                            fontSize: '0.875rem',
                                            fontWeight: '500'
                                        }}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            background: user.is_active ? '#D1FAE5' : '#FEE2E2',
                                            color: user.is_active ? '#065F46' : '#991B1B',
                                            fontSize: '0.875rem',
                                            fontWeight: '500'
                                        }}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => openEditModal(user)}
                                            style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', background: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleResetPassword(user.id)}
                                            style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                        >
                                            Reset Password
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(user.id)}
                                            style={{ padding: '0.5rem 1rem', background: user.is_active ? '#EF4444' : '#10B981', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                        >
                                            {user.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Create User Modal */}
                {showCreateModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Create New User</h2>
                            <form onSubmit={handleCreateUser}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Username</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Role</label>
                                    <select
                                        className="input-field"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        style={{ padding: '0.75rem 1.5rem', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {showEditModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Edit User</h2>
                            <form onSubmit={handleUpdateUser}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Username</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Role</label>
                                    <select
                                        className="input-field"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        style={{ padding: '0.75rem 1.5rem', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Update User
                                    </button>
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
