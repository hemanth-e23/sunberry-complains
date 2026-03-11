import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { getDaysAgo, getDaysSince } from '../utils/dateUtils';

const Dashboard = () => {
    const navigate = useNavigate();
    useIdleTimeout();
    const [complaints, setComplaints] = useState([]);
    const [totalStats, setTotalStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [allTags, setAllTags] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        fetchAllTags();
        fetchCurrentUser();
        fetchDepartments();
        fetchTotalStats();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchComplaints();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [search, statusFilter, tagFilter, priorityFilter, departmentFilter]);

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

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/departments/');
            setDepartments(response.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchTotalStats = async () => {
        try {
            const response = await api.get('/complaints/');
            const all = response.data;
            setTotalStats({
                total: all.length,
                open: all.filter(c => c.status === 'open').length,
                inProgress: all.filter(c => c.status === 'in_progress').length,
                resolved: all.filter(c => c.status === 'resolved').length,
                closed: all.filter(c => c.status === 'closed').length,
            });
        } catch (error) {
            console.error('Error fetching total stats:', error);
        }
    };

    const fetchComplaints = async () => {
        try {
            const params = {};
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (tagFilter) params.tag_id = tagFilter;
            if (priorityFilter) params.priority = priorityFilter;
            if (departmentFilter) params.department_id = departmentFilter;
            const response = await api.get('/complaints/', { params });
            setComplaints(response.data);
            // If no filters active, update total stats from same data
            if (!search && !statusFilter && !tagFilter && !priorityFilter && !departmentFilter) {
                const all = response.data;
                setTotalStats({
                    total: all.length,
                    open: all.filter(c => c.status === 'open').length,
                    inProgress: all.filter(c => c.status === 'in_progress').length,
                    resolved: all.filter(c => c.status === 'resolved').length,
                    closed: all.filter(c => c.status === 'closed').length,
                });
            }
        } catch (error) {
            console.error('Error fetching complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isSuperuser');
        navigate('/login');
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setTagFilter('');
        setPriorityFilter('');
        setDepartmentFilter('');
    };

    const hasActiveFilters = search || statusFilter || tagFilter || priorityFilter || departmentFilter;

    // Filtered count for subtitle
    const filteredCount = complaints.length;

    const getStatusStyle = (status) => {
        const styles = {
            open: { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' },
            in_progress: { background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' },
            resolved: { background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' },
            closed: { background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' },
        };
        return styles[status] || styles.open;
    };

    const getPriorityStyle = (priority) => {
        const styles = {
            critical: { background: '#FEF2F2', color: '#DC2626' },
            high: { background: '#FFF7ED', color: '#EA580C' },
            medium: { background: '#FFFBEB', color: '#D97706' },
            low: { background: '#EFF6FF', color: '#2563EB' },
        };
        return styles[priority] || styles.medium;
    };

    const getAgeColor = (createdAt) => {
        const days = getDaysSince(createdAt);
        if (days >= 7) return '#DC2626';
        if (days >= 3) return '#D97706';
        return 'var(--text-tertiary)';
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)' }}>
            {/* Header */}
            <header className="page-header">
                <span className="page-header-brand">🚛 Sunberry Complaints</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {currentUser && currentUser.is_superuser && (
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="btn btn-secondary btn-sm"
                        >
                            👥 Users
                        </button>
                    )}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.375rem 0.75rem',
                        background: 'var(--bg-hover)',
                        borderRadius: 'var(--radius-full)',
                    }}>
                        <div style={{
                            width: '28px', height: '28px',
                            borderRadius: '50%',
                            background: 'var(--brand-gradient)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '0.75rem', fontWeight: '700',
                        }}>
                            {currentUser?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {currentUser?.username || 'Loading...'}
                        </span>
                        {currentUser?.role === 'admin' && (
                            <span className="badge badge-sm" style={{ background: '#FEF3C7', color: '#92400E' }}>
                                Admin
                            </span>
                        )}
                    </div>
                    <button onClick={handleLogout} className="btn btn-ghost btn-sm" title="Logout">
                        ↪ Logout
                    </button>
                </div>
            </header>

            {/* Content */}
            <main style={{ padding: '1.5rem 2rem', maxWidth: '1280px', margin: '0 auto' }}>
                {/* Page Title + Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            Dashboard
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            {totalStats.total} complaint{totalStats.total !== 1 ? 's' : ''} total
                            {hasActiveFilters && ` · ${filteredCount} shown`}
                        </p>
                    </div>
                    {currentUser && currentUser.role === 'admin' && (
                        <button className="btn btn-primary" onClick={() => navigate('/create-complaint')}>
                            + New Complaint
                        </button>
                    )}
                </div>

                {/* Stats Bar */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                }}>
                    {[
                        { label: 'Open', value: totalStats.open, color: '#DC2626', bg: '#FEF2F2', icon: '🔴', filterKey: 'open' },
                        { label: 'In Progress', value: totalStats.inProgress, color: '#D97706', bg: '#FFFBEB', icon: '🟡', filterKey: 'in_progress' },
                        { label: 'Resolved', value: totalStats.resolved, color: '#16A34A', bg: '#F0FDF4', icon: '🟢', filterKey: 'resolved' },
                        { label: 'Closed', value: totalStats.closed, color: '#64748B', bg: '#F8FAFC', icon: '⚫', filterKey: 'closed' },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="animate-fade-in"
                            style={{
                                background: statusFilter === stat.filterKey ? stat.bg : 'white',
                                borderRadius: 'var(--radius-xl)',
                                padding: '1.25rem 1.5rem',
                                border: statusFilter === stat.filterKey ? `2px solid ${stat.color}` : '1px solid var(--border-light)',
                                boxShadow: statusFilter === stat.filterKey ? `0 0 0 2px ${stat.color}20` : 'var(--shadow-xs)',
                                cursor: 'pointer',
                                transition: 'all var(--transition-base)',
                            }}
                            onClick={() => {
                                if (statusFilter === stat.filterKey) {
                                    setStatusFilter('');
                                } else {
                                    setStatusFilter(stat.filterKey);
                                }
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = stat.color; e.currentTarget.style.boxShadow = `0 0 0 1px ${stat.color}20`; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                                        {stat.label}
                                    </p>
                                    <p style={{ fontSize: '1.75rem', fontWeight: '700', color: stat.color, letterSpacing: '-0.02em' }}>
                                        {stat.value}
                                    </p>
                                </div>
                                <div style={{
                                    width: '42px', height: '42px',
                                    borderRadius: 'var(--radius-lg)',
                                    background: stat.bg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.25rem',
                                }}>
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search and Filters */}
                <div style={{
                    background: 'white',
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-xs)',
                    marginBottom: '1.5rem',
                }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: '1 1 280px' }}>
                            <span style={{
                                position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                                color: 'var(--text-tertiary)', fontSize: '0.875rem', pointerEvents: 'none',
                            }}>🔍</span>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Search by title, product, lot number..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ paddingLeft: '2.25rem' }}
                            />
                        </div>
                        <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '150px', flex: '0 0 auto' }}>
                            <option value="">All Statuses</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                        {departments.length > 0 && (
                            <select className="input-field" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} style={{ width: '160px', flex: '0 0 auto' }}>
                                <option value="">All Depts</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        )}
                        <select className="input-field" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ width: '150px', flex: '0 0 auto' }}>
                            <option value="">All Priorities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                        {allTags.length > 0 && (
                            <select className="input-field" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} style={{ width: '140px', flex: '0 0 auto' }}>
                                <option value="">All Tags</option>
                                {allTags.map((tag) => (
                                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                                ))}
                            </select>
                        )}
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>
                                ✕ Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Complaint Cards */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading complaints...</p>
                        </div>
                    </div>
                ) : complaints.length === 0 ? (
                    <div className="empty-state animate-fade-in">
                        <div className="empty-state-icon">📋</div>
                        <div className="empty-state-title">
                            {hasActiveFilters ? 'No complaints match your filters' : 'No complaints yet'}
                        </div>
                        <p className="empty-state-text">
                            {hasActiveFilters
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Create your first complaint to get started.'}
                        </p>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
                        {complaints.map((complaint, index) => (
                            <div
                                key={complaint.id}
                                className={`card card-interactive animate-fade-in stagger-${Math.min(index + 1, 6)}`}
                                style={{ padding: '1.25rem 1.5rem', opacity: 0 }}
                                onClick={() => navigate(`/complaints/${complaint.id}`)}
                            >
                                {/* Top row: ID + badges */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <span style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                                        #{complaint.id}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                                        <span className="badge badge-sm" style={getPriorityStyle(complaint.priority)}>
                                            {complaint.priority?.toUpperCase()}
                                        </span>
                                        <span className="badge badge-sm" style={getStatusStyle(complaint.status)}>
                                            {complaint.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 style={{
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.375rem',
                                    lineHeight: '1.4',
                                    letterSpacing: '-0.01em',
                                }}>
                                    {complaint.title}
                                </h3>

                                {/* Description */}
                                <p style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.8125rem',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    marginBottom: '0.75rem',
                                    lineHeight: '1.5',
                                }}>
                                    {complaint.description}
                                </p>

                                {/* Issue Type, Product & Lot */}
                                {(complaint.issue_type || complaint.product_name || complaint.lot_number) && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '0.75rem',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '0.75rem',
                                        flexWrap: 'wrap',
                                    }}>
                                        {complaint.issue_type && (
                                            <span style={{ background: '#FFF7ED', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', color: '#C2410C', fontWeight: '600' }}>
                                                🔍 {complaint.issue_type}
                                            </span>
                                        )}
                                        {complaint.product_name && (
                                            <span style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                                                📦 {complaint.product_name}
                                            </span>
                                        )}
                                        {complaint.lot_number && (
                                            <span style={{ background: 'var(--bg-hover)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                                                🏷️ {complaint.lot_number}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Department + Tags */}
                                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                    {complaint.department && (
                                        <span className="badge badge-sm" style={{
                                            background: complaint.department.color || '#3B82F6',
                                            color: 'white',
                                        }}>
                                            {complaint.department.name}
                                        </span>
                                    )}
                                    {complaint.tags?.map((tag) => (
                                        <span key={tag.id} className="badge badge-sm" style={{
                                            background: `${tag.color}18`,
                                            color: tag.color,
                                            border: `1px solid ${tag.color}30`,
                                        }}>
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div style={{
                                    marginTop: '0.75rem',
                                    paddingTop: '0.75rem',
                                    borderTop: '1px solid var(--border-light)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-tertiary)',
                                }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <span style={{ color: getAgeColor(complaint.created_at) }} title={`Created ${getDaysAgo(complaint.created_at)}`}>
                                            🕐 {getDaysAgo(complaint.created_at)}
                                        </span>
                                        {complaint.comments_count > 0 && (
                                            <span title="Comments">💬 {complaint.comments_count}</span>
                                        )}
                                        {complaint.attachments_count > 0 && (
                                            <span title="Attachments">📎 {complaint.attachments_count}</span>
                                        )}
                                    </div>
                                    {complaint.creator && (
                                        <span style={{ fontWeight: '500' }}>
                                            {complaint.creator.username}
                                        </span>
                                    )}
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
