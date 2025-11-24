import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Dashboard = () => {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchComplaints();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search, statusFilter]);

    const fetchComplaints = async () => {
        try {
            const params = {};
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;

            const response = await api.get('/complaints/', { params });
            setComplaints(response.data);
        } catch (error) {
            console.error('Error fetching complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)' }}>
            {/* Header */}
            <header style={{ background: 'white', padding: '1rem 2rem', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--secondary-color)' }}>
                    Sunberry Complaints
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="btn"
                        style={{ background: 'var(--brand-gradient)', color: 'white', border: 'none' }}
                    >
                        👥 User Management
                    </button>
                    <span className="text-gray">User: <strong>admin</strong></span>
                    <button onClick={handleLogout} className="btn" style={{ background: '#E5E7EB', color: 'var(--text-primary)' }}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Content */}
            <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Complaints Dashboard
                        </h2>
                        <p className="text-gray">Manage and track all complaints.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/create-complaint')}>
                        + New Complaint
                    </button>
                </div>

                {/* Search and Filter */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Search by title or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <select
                        className="input-field"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: '200px' }}
                    >
                        <option value="">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {complaints.map((complaint) => (
                            <div key={complaint.id} className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => navigate(`/complaints/${complaint.id}`)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>#{complaint.id}</span>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '999px',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        background: complaint.status === 'open' ? '#FEE2E2' : complaint.status === 'in_progress' ? '#FEF3C7' : '#D1FAE5',
                                        color: complaint.status === 'open' ? '#EF4444' : complaint.status === 'in_progress' ? '#F59E0B' : '#10B981'
                                    }}>
                                        {complaint.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <h3 style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1.125rem' }}>{complaint.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {complaint.description}
                                </p>
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Created: {new Date(complaint.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
