import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { getDaysAgo, getDaysSince, formatDateTime } from '../utils/dateUtils';

/** Fetches an image using the JWT token and renders it as a blob URL */
const AuthImage = ({ url, alt, style, onClick }) => {
    const [blobUrl, setBlobUrl] = useState(null);

    useEffect(() => {
        let cancelled = false;
        api.get(url, { responseType: 'blob' })
            .then(res => {
                if (!cancelled) setBlobUrl(URL.createObjectURL(res.data));
            })
            .catch(() => {});
        return () => {
            cancelled = true;
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [url]);

    return (
        <img
            src={blobUrl || ''}
            alt={alt}
            style={{
                ...style,
                background: blobUrl ? 'transparent' : 'var(--bg-hover)',
            }}
            onClick={onClick}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary-light)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'scale(1)'; }}
        />
    );
};

const ComplaintDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [comments, setComments] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentPhotos, setCommentPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [statusError, setStatusError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        fetchData();
        fetchCurrentUser();
    }, [id]);

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('/users/me');
            setCurrentUser(response.data);
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    };

    const fetchData = async () => {
        try {
            const [complaintRes, auditRes, commentsRes, attachmentsRes] = await Promise.all([
                api.get(`/complaints/${id}`),
                api.get(`/complaints/${id}/audit-logs`),
                api.get(`/complaints/${id}/comments`),
                api.get(`/complaints/${id}/attachments`).catch(() => ({ data: [] })),
            ]);
            setComplaint(complaintRes.data);
            setAuditLogs(auditRes.data);
            setComments(commentsRes.data);
            setAttachments(attachmentsRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length + commentPhotos.length > 5) {
            alert('Maximum 5 photos allowed');
            return;
        }
        const oversizedFiles = imageFiles.filter(file => file.size > 10 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            alert('Some files are too large. Maximum size is 10MB per file.');
            return;
        }
        setCommentPhotos([...commentPhotos, ...imageFiles]);
    };

    const removeCommentPhoto = (index) => {
        setCommentPhotos(commentPhotos.filter((_, i) => i !== index));
    };

    const handleStatusUpdate = async (newStatus) => {
        setUpdating(true);
        setStatusError('');
        try {
            await api.put(`/complaints/${id}`, { status: newStatus });
            await fetchData();
        } catch (error) {
            setStatusError(error.response?.data?.detail || 'Failed to update status.');
        } finally {
            setUpdating(false);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() && commentPhotos.length === 0) return;
        setUpdating(true);
        try {
            const formData = new FormData();
            formData.append('content', newComment || '');
            commentPhotos.forEach((photo) => formData.append('photos', photo));
            await api.post(`/complaints/${id}/comments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setNewComment('');
            setCommentPhotos([]);
            await fetchData();
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('Failed to post comment. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusStyle = (status) => {
        const styles = {
            open: { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' },
            in_progress: { background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' },
            resolved: { background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' },
            closed: { background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' },
        };
        return styles[status] || styles.open;
    };

    const getStatusIcon = (status) => {
        const icons = { open: '🔴', in_progress: '🟡', resolved: '🟢', closed: '⚫' };
        return icons[status] || '🔴';
    };

    const getAgeColor = (createdAt) => {
        const days = getDaysSince(createdAt);
        if (days >= 7) return '#DC2626';
        if (days >= 3) return '#D97706';
        return 'var(--text-secondary)';
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading complaint...</p>
                </div>
            </div>
        );
    }

    if (!complaint) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <div className="empty-state-title">Complaint not found</div>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const isAdmin = currentUser?.role === 'admin';
    const statusActions = [
        { key: 'open', label: 'Reopen', icon: '🔄' },
        { key: 'in_progress', label: 'In Progress', icon: '⚡' },
        { key: 'resolved', label: 'Resolved', icon: '✅' },
        { key: 'closed', label: 'Close', icon: '🔒' },
    ]
        .filter(a => a.key !== complaint.status)
        // Non-admins cannot close a ticket or take any action on a closed ticket
        .filter(a => isAdmin || (a.key !== 'closed' && complaint.status !== 'closed'));

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)', padding: '2rem' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Back Button */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-ghost"
                    style={{ marginBottom: '1rem', padding: '0.5rem 0', color: 'var(--primary)' }}
                >
                    ← Back to Dashboard
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
                    {/* ===== LEFT COLUMN ===== */}
                    <div>
                        {/* Complaint Header Card */}
                        <div className="card animate-fade-in" style={{ marginBottom: '1.25rem' }}>
                            {/* Status + Age bar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span className="badge" style={getStatusStyle(complaint.status)}>
                                        {getStatusIcon(complaint.status)} {complaint.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                    {complaint.department && (
                                        <span className="badge" style={{ background: complaint.department.color || '#3B82F6', color: 'white' }}>
                                            {complaint.department.name}
                                        </span>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: getAgeColor(complaint.created_at) }}>
                                    🕐 {getDaysAgo(complaint.created_at)}
                                </span>
                            </div>

                            {/* Title */}
                            <div style={{ marginBottom: '0.375rem' }}>
                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', fontWeight: '500' }}>
                                    #{complaint.id} · {complaint.creator?.username || `User #${complaint.created_by_id}`}
                                </span>
                            </div>
                            <h1 style={{
                                fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)',
                                letterSpacing: '-0.02em', lineHeight: '1.3', marginBottom: '0.25rem',
                            }}>
                                {complaint.title}
                            </h1>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                                {formatDateTime(complaint.created_at)}
                            </p>

                            {/* Description */}
                            <div style={{
                                marginTop: '1.5rem', padding: '1.25rem',
                                background: 'var(--bg-body)', borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-light)',
                            }}>
                                <p style={{ lineHeight: '1.7', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontSize: '0.9375rem' }}>
                                    {complaint.description}
                                </p>
                            </div>

                            {/* Product Info & Issue Type */}
                            {(complaint.product_name || complaint.lot_number || complaint.issue_type) && (
                                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                                    {complaint.issue_type && (
                                        <div style={{
                                            flex: 1, minWidth: '180px', padding: '0.875rem 1rem',
                                            background: '#FFF7ED', borderRadius: 'var(--radius-lg)',
                                            border: '1px solid #FED7AA',
                                        }}>
                                            <label className="info-label">🔍 Issue Type</label>
                                            <p style={{ fontWeight: '600', color: '#C2410C', fontSize: '0.9375rem' }}>
                                                {complaint.issue_type}
                                            </p>
                                        </div>
                                    )}
                                    {complaint.product_name && (
                                        <div style={{
                                            flex: 1, minWidth: '180px', padding: '0.875rem 1rem',
                                            background: 'var(--bg-body)', borderRadius: 'var(--radius-lg)',
                                            border: '1px solid var(--border-light)',
                                        }}>
                                            <label className="info-label">Product Name</label>
                                            <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                                                {complaint.product_name}
                                            </p>
                                        </div>
                                    )}
                                    {complaint.lot_number && (
                                        <div style={{
                                            flex: 1, minWidth: '180px', padding: '0.875rem 1rem',
                                            background: 'var(--bg-body)', borderRadius: 'var(--radius-lg)',
                                            border: '1px solid var(--border-light)',
                                        }}>
                                            <label className="info-label">Lot Number</label>
                                            <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                                                {complaint.lot_number}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tags */}
                            {complaint.tags?.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                                    {complaint.tags.map((tag) => (
                                        <span key={tag.id} className="badge" style={{
                                            background: `${tag.color}15`, color: tag.color,
                                            border: `1px solid ${tag.color}30`,
                                        }}>
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Attachments */}
                            {attachments.length > 0 && (
                                <div style={{ marginTop: '1.25rem' }}>
                                    <label className="info-label">Attachments ({attachments.length})</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                                        {attachments.map((attachment) => (
                                            <AuthImage
                                                key={attachment.id}
                                                url={`/complaints/${id}/attachments/${attachment.id}`}
                                                alt={attachment.filename}
                                                style={{
                                                    width: '100%', height: '110px', objectFit: 'cover',
                                                    borderRadius: 'var(--radius-lg)', border: '2px solid var(--border-light)',
                                                    cursor: 'pointer', transition: 'all var(--transition-base)',
                                                }}
                                                onClick={() => {
                                                    api.get(`/complaints/${id}/attachments/${attachment.id}`, { responseType: 'blob' })
                                                        .then(res => { const url = URL.createObjectURL(res.data); window.open(url, '_blank'); });
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Status Actions */}
                            {statusActions.length > 0 && (
                                <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
                                    <label className="info-label">Update Status</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                        {statusActions.map((action) => (
                                            <button
                                                key={action.key}
                                                onClick={() => handleStatusUpdate(action.key)}
                                                disabled={updating}
                                                className="btn btn-sm"
                                                style={{
                                                    ...getStatusStyle(action.key),
                                                    fontWeight: '600',
                                                    cursor: updating ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                {action.icon} {action.label}
                                            </button>
                                        ))}
                                    </div>
                                    {statusError && (
                                        <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: '#DC2626' }}>
                                            ⚠️ {statusError}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ===== COMMENTS SECTION ===== */}
                        <div className="card animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
                            <h3 style={{
                                fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)',
                                marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            }}>
                                💬 Comments & Updates
                                <span className="badge badge-sm" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                                    {comments.length}
                                </span>
                            </h3>

                            {/* Comments List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {comments.length === 0 ? (
                                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem' }}>
                                        No comments yet. Be the first to add an update.
                                    </p>
                                ) : (
                                    comments.map((comment, index) => (
                                        <div key={comment.id} style={{
                                            display: 'flex', gap: '0.875rem',
                                            padding: '1rem 0',
                                            borderBottom: index < comments.length - 1 ? '1px solid var(--border-light)' : 'none',
                                        }}>
                                            {/* Avatar */}
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                                background: comment.user?.role === 'admin' ? 'var(--brand-gradient)' : 'var(--bg-hover)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: comment.user?.role === 'admin' ? 'white' : 'var(--text-secondary)',
                                                fontSize: '0.75rem', fontWeight: '700',
                                            }}>
                                                {(comment.user?.username || '?').charAt(0).toUpperCase()}
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                                                    <span style={{ fontWeight: '600', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                                                        {comment.user?.username || `User #${comment.user_id}`}
                                                        {comment.user?.role === 'admin' && (
                                                            <span className="badge badge-sm" style={{
                                                                marginLeft: '0.375rem', background: '#FEF3C7', color: '#92400E',
                                                            }}>Admin</span>
                                                        )}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                        {getDaysAgo(comment.created_at)} · {formatDateTime(comment.created_at)}
                                                    </span>
                                                </div>
                                                {comment.content && (
                                                    <p style={{
                                                        fontSize: '0.875rem', color: 'var(--text-primary)',
                                                        whiteSpace: 'pre-wrap', lineHeight: '1.6',
                                                    }}>
                                                        {comment.content}
                                                    </p>
                                                )}
                                                {comment.attachments?.length > 0 && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                                                        {comment.attachments.map((attachment) => (
                                                            <AuthImage
                                                                key={attachment.id}
                                                                url={`/complaints/${id}/comments/${comment.id}/attachments/${attachment.id}`}
                                                                alt={attachment.filename}
                                                                style={{
                                                                    width: '80px', height: '80px', objectFit: 'cover',
                                                                    borderRadius: 'var(--radius-lg)', border: '2px solid var(--border-light)',
                                                                    cursor: 'pointer', transition: 'all var(--transition-base)',
                                                                }}
                                                                onClick={() => {
                                                                    api.get(`/complaints/${id}/comments/${comment.id}/attachments/${attachment.id}`, { responseType: 'blob' })
                                                                        .then(res => { const url = URL.createObjectURL(res.data); window.open(url, '_blank'); });
                                                                }}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Add Comment Form */}
                            <form onSubmit={handleSubmitComment} style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
                                <div style={{ display: 'flex', gap: '0.875rem' }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                        background: currentUser?.role === 'admin' ? 'var(--brand-gradient)' : 'var(--bg-hover)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: currentUser?.role === 'admin' ? 'white' : 'var(--text-secondary)',
                                        fontSize: '0.75rem', fontWeight: '700',
                                    }}>
                                        {(currentUser?.username || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <textarea
                                            className="input-field"
                                            placeholder="Write an update or comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            rows={3}
                                        />
                                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <label
                                                    htmlFor="comment-photo-input"
                                                    className="btn btn-ghost btn-sm"
                                                    style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}
                                                >
                                                    📷 Photos
                                                </label>
                                                <input
                                                    id="comment-photo-input"
                                                    type="file" accept="image/*" multiple
                                                    onChange={handlePhotoSelect}
                                                    style={{ display: 'none' }}
                                                />
                                                {commentPhotos.length > 0 && (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                        {commentPhotos.length} file{commentPhotos.length > 1 ? 's' : ''} selected
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                type="submit" className="btn btn-primary btn-sm"
                                                disabled={updating || (!newComment.trim() && commentPhotos.length === 0)}
                                            >
                                                {updating ? 'Posting...' : 'Post Update'}
                                            </button>
                                        </div>
                                        {commentPhotos.length > 0 && (
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                                                {commentPhotos.map((photo, index) => (
                                                    <div key={index} style={{ position: 'relative' }}>
                                                        <img
                                                            src={URL.createObjectURL(photo)}
                                                            alt={`Preview ${index + 1}`}
                                                            style={{
                                                                width: '60px', height: '60px', objectFit: 'cover',
                                                                borderRadius: 'var(--radius-md)', border: '2px solid var(--border-light)',
                                                            }}
                                                        />
                                                        <button
                                                            type="button" onClick={() => removeCommentPhoto(index)}
                                                            style={{
                                                                position: 'absolute', top: '-5px', right: '-5px',
                                                                background: 'var(--danger)', color: 'white', border: '2px solid white',
                                                                borderRadius: '50%', width: '18px', height: '18px',
                                                                cursor: 'pointer', fontSize: '0.6rem',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* ===== RIGHT SIDEBAR ===== */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Details Card */}
                        <div className="card animate-fade-in" style={{ animationDelay: '0.05s', opacity: 0 }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                                📋 Details
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label className="info-label">Priority</label>
                                    <span className="badge" style={{
                                        ...(complaint.priority === 'critical' ? { background: '#FEF2F2', color: '#DC2626' }
                                            : complaint.priority === 'high' ? { background: '#FFF7ED', color: '#EA580C' }
                                            : complaint.priority === 'medium' ? { background: '#FFFBEB', color: '#D97706' }
                                            : { background: '#EFF6FF', color: '#2563EB' }),
                                    }}>
                                        {complaint.priority?.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <label className="info-label">Created By</label>
                                    <p style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                        {complaint.creator?.username || `User #${complaint.created_by_id}`}
                                    </p>
                                </div>
                                <div>
                                    <label className="info-label">Created</label>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{formatDateTime(complaint.created_at)}</p>
                                </div>
                                {complaint.updated_at && (
                                    <div>
                                        <label className="info-label">Last Updated</label>
                                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{formatDateTime(complaint.updated_at)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Audit History */}
                        <div className="card animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
                            <h3 style={{ fontSize: '0.9375rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                                📜 History
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {auditLogs.map((log, index) => (
                                    <div key={log.id} style={{
                                        padding: '0.75rem 0',
                                        borderBottom: '1px solid var(--border-light)',
                                        position: 'relative',
                                    }}>
                                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: '1.5', marginBottom: '0.25rem' }}>
                                            {log.change_description}
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            {log.changed_by?.username || `User #${log.changed_by_id}`} · {getDaysAgo(log.timestamp)}
                                        </p>
                                    </div>
                                ))}
                                {/* Creation entry */}
                                <div style={{ padding: '0.75rem 0' }}>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: '1.5', marginBottom: '0.25rem' }}>
                                        ✨ Complaint created
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                        {complaint.creator?.username || `User #${complaint.created_by_id}`} · {getDaysAgo(complaint.created_at)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintDetail;
