import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const ComplaintDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [complaintRes, auditRes, commentsRes] = await Promise.all([
                api.get(`/complaints/${id}`),
                api.get(`/complaints/${id}/audit-logs`),
                api.get(`/complaints/${id}/comments`)
            ]);
            setComplaint(complaintRes.data);
            setAuditLogs(auditRes.data);
            setComments(commentsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        setUpdating(true);
        try {
            await api.put(`/complaints/${id}`, { status: newStatus });
            await fetchData(); // Refresh data
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleAssignToMe = async () => {
        setUpdating(true);
        try {
            // We need to know the current user's ID. For now, we'll assume the backend handles it if we send assigned_to_id
            // But wait, the backend expects an ID. 
            // Let's fetch the current user first or just send a special flag?
            // Actually, the backend `update_complaint` takes `ComplaintUpdate` schema which has `assigned_to_id`.
            // We need the current user's ID.
            const userRes = await api.get('/users/me');
            await api.put(`/complaints/${id}`, { assigned_to_id: userRes.data.id });
            await fetchData();
        } catch (error) {
            console.error('Error assigning complaint:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setUpdating(true);
        try {
            await api.post(`/complaints/${id}/comments`, { content: newComment });
            setNewComment('');
            await fetchData();
        } catch (error) {
            console.error('Error posting comment:', error);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
    if (!complaint) return <div style={{ padding: '2rem' }}>Complaint not found</div>;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)', padding: '2rem' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    ← Back to Dashboard
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    {/* Main Content */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                            <div>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Complaint #{complaint.id}</span>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                                    {complaint.title}
                                </h1>
                            </div>
                            <span style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '999px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                background: complaint.status === 'open' ? '#FEE2E2' : complaint.status === 'in_progress' ? '#FEF3C7' : '#D1FAE5',
                                color: complaint.status === 'open' ? '#EF4444' : complaint.status === 'in_progress' ? '#F59E0B' : '#10B981'
                            }}>
                                {complaint.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Description</h3>
                            <p style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>{complaint.description}</p>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Assigned To</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <p style={{ color: 'var(--text-primary)' }}>
                                    {complaint.assigned_to_id ? `User #${complaint.assigned_to_id}` : 'Unassigned'}
                                </p>
                                {!complaint.assigned_to_id && (
                                    <button
                                        onClick={handleAssignToMe}
                                        disabled={updating}
                                        className="btn"
                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', background: 'var(--primary-color)', color: 'white' }}
                                    >
                                        Assign to Me
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Update Status</h3>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {complaint.status !== 'open' && (
                                    <button
                                        onClick={() => handleStatusUpdate('open')}
                                        disabled={updating}
                                        className="btn"
                                        style={{ background: '#FEE2E2', color: '#EF4444' }}
                                    >
                                        Mark as Open
                                    </button>
                                )}
                                {complaint.status !== 'in_progress' && (
                                    <button
                                        onClick={() => handleStatusUpdate('in_progress')}
                                        disabled={updating}
                                        className="btn"
                                        style={{ background: '#FEF3C7', color: '#F59E0B' }}
                                    >
                                        Mark In Progress
                                    </button>
                                )}
                                {complaint.status !== 'resolved' && (
                                    <button
                                        onClick={() => handleStatusUpdate('resolved')}
                                        disabled={updating}
                                        className="btn"
                                        style={{ background: '#D1FAE5', color: '#10B981' }}
                                    >
                                        Mark Resolved
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Comments & Updates</h3>

                            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {comments.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No comments yet.</p>
                                ) : (
                                    comments.map((comment) => (
                                        <div key={comment.id} style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                                    {comment.user ? comment.user.username : `User #${comment.user_id}`}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {new Date(comment.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{comment.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleSubmitComment}>
                                <textarea
                                    className="input-field"
                                    placeholder="Write an update..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    rows={3}
                                    style={{ marginBottom: '0.5rem', resize: 'vertical' }}
                                    required
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={updating || !newComment.trim()}
                                    >
                                        Post Update
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Sidebar - Audit Log */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>History</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {auditLogs.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No history yet.</p>
                            ) : (
                                auditLogs.map((log) => (
                                    <div key={log.id} style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                            {log.change_description}
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            )}
                            <div style={{ paddingBottom: '1rem' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                    Complaint Created
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {new Date(complaint.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintDetail;
