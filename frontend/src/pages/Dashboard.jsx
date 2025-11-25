import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useIdleTimeout } from '../hooks/useIdleTimeout';

const Dashboard = () => {
    const navigate = useNavigate();
    useIdleTimeout(); // Enable 30-minute idle timeout
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [allTags, setAllTags] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        fetchAllTags();
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchComplaints();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search, statusFilter, tagFilter, priorityFilter]);

    const fetchAllTags = async () => {
        try {
            const response = await api.get('/tags/');
            setAllTags(response.data);
        } catch (error) {
            console.error('Error fetching tags:', error);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('/users/me');
            setCurrentUser(response.data);
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    };

    const fetchComplaints = async () => {
        try {
            const params = {};
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (tagFilter) params.tag_id = tagFilter;
            if (priorityFilter) params.priority = priorityFilter;

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
        localStorage.removeItem('username');
        localStorage.removeItem('temp_password');
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
                    {currentUser && currentUser.role === 'admin' && (
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="btn"
                            style={{ background: 'var(--brand-gradient)', color: 'white', border: 'none' }}
                        >
                            👥 User Management
                        </button>
                    )}
                    <span className="text-gray">User: <strong>{currentUser ? currentUser.username : 'Loading...'}</strong></span>
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
                        style={{ width: '150px' }}
                    >
                        <option value="">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                    <select
                        className="input-field"
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        style={{ width: '150px' }}
                    >
                        <option value="">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                    <select
                        className="input-field"
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        style={{ width: '150px' }}
                    >
                        <option value="">All Tags</option>
                        {allTags.map((tag) => (
                            <option key={tag.id} value={tag.id}>{tag.name}</option>
                        ))}
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
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.875rem',
                                            fontWeight: '500',
                                            background: complaint.priority === 'high' ? '#FEE2E2' : complaint.priority === 'medium' ? '#FEF3C7' : '#DBEAFE',
                                            color: complaint.priority === 'high' ? '#EF4444' : complaint.priority === 'medium' ? '#F59E0B' : '#3B82F6'
                                        }}>
                                            {complaint.priority ? complaint.priority.toUpperCase() : 'N/A'}
                                        </span>
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
                                </div>
                                <h3 style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1.125rem' }}>{complaint.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {complaint.description}
                                </p>
                                {complaint.tags && complaint.tags.length > 0 && (
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                        {complaint.tags.map((tag) => (
                                            <span key={tag.id} style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.375rem',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                background: 'var(--brand-gradient)',
                                                color: 'white'
                                            }}>
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
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
