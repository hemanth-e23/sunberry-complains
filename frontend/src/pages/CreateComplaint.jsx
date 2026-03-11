import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CreateComplaint = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [productName, setProductName] = useState('');
    const [lotNumber, setLotNumber] = useState('');
    const [issueType, setIssueType] = useState('');
    const [customIssueType, setCustomIssueType] = useState('');
    const [priority, setPriority] = useState('medium');
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [tags, setTags] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [showNewTagModal, setShowNewTagModal] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3B82F6');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTags();
        fetchDepartments();
    }, []);

    const fetchTags = async () => {
        try {
            const response = await api.get('/tags/');
            setTags(response.data);
        } catch (error) {
            console.error('Error fetching tags:', error);
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

    const handlePhotoSelect = (e) => {
        const files = Array.from(e.target.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length + selectedPhotos.length > 5) {
            alert('Maximum 5 photos allowed');
            return;
        }
        const oversizedFiles = imageFiles.filter(file => file.size > 10 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            alert('Some files are too large. Maximum size is 10MB per file.');
            return;
        }
        setSelectedPhotos([...selectedPhotos, ...imageFiles]);
    };

    const removePhoto = (index) => {
        setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index));
    };

    const handleCreateTag = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/tags/', { name: newTagName, color: newTagColor });
            setTags([...tags, response.data]);
            setSelectedTags([...selectedTags, response.data.id]);
            setShowNewTagModal(false);
            setNewTagName('');
            setNewTagColor('#3B82F6');
        } catch (error) {
            alert(error.response?.data?.detail || 'Error creating tag');
        }
    };

    const toggleTag = (tagId) => {
        if (selectedTags.includes(tagId)) {
            setSelectedTags(selectedTags.filter(id => id !== tagId));
        } else {
            setSelectedTags([...selectedTags, tagId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            if (productName) formData.append('product_name', productName);
            if (lotNumber) formData.append('lot_number', lotNumber);
            const finalIssueType = issueType === 'Other' ? customIssueType : issueType;
            if (finalIssueType) formData.append('issue_type', finalIssueType);
            formData.append('priority', priority);
            if (selectedDepartment) formData.append('department_id', selectedDepartment);
            if (selectedTags.length > 0) {
                selectedTags.forEach(tagId => formData.append('tag_ids', tagId));
            }
            selectedPhotos.forEach((photo) => formData.append('photos', photo));
            await api.post('/complaints/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create complaint. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const priorities = [
        { key: 'low', label: 'Low', color: '#2563EB', bg: '#EFF6FF' },
        { key: 'medium', label: 'Medium', color: '#D97706', bg: '#FFFBEB' },
        { key: 'high', label: 'High', color: '#EA580C', bg: '#FFF7ED' },
        { key: 'critical', label: 'Critical', color: '#DC2626', bg: '#FEF2F2' },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)', padding: '2rem' }}>
            <div style={{ maxWidth: '820px', margin: '0 auto' }}>
                {/* Back Button */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn btn-ghost"
                    style={{ marginBottom: '1rem', padding: '0.5rem 0', color: 'var(--primary)' }}
                >
                    ← Back to Dashboard
                </button>

                {/* Page Header */}
                <div className="animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        Create New Complaint
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Fill in the details below to submit a new complaint ticket.
                    </p>
                </div>

                {error && (
                    <div className="animate-fade-in" style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: '#B91C1C', background: '#FEF2F2', padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-lg)', marginBottom: '1.25rem',
                        fontSize: '0.875rem', border: '1px solid #FECACA',
                    }}>
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Section: Basic Info */}
                    <div className="card animate-fade-in" style={{ marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.125rem' }}>📝</span> Basic Information
                        </h2>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="info-label">Title <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input
                                type="text" className="input-field"
                                placeholder="Brief summary of the issue"
                                value={title} onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="info-label">Description <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <textarea
                                className="input-field"
                                placeholder="Provide a detailed description of the complaint..."
                                value={description} onChange={(e) => setDescription(e.target.value)}
                                required rows={5}
                            />
                        </div>
                    </div>

                    {/* Section: Product Details */}
                    <div className="card animate-fade-in" style={{ marginBottom: '1rem', animationDelay: '0.05s', opacity: 0 }}>
                        <h2 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.125rem' }}>📦</span> Product Details
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="info-label">Product Name</label>
                                <input
                                    type="text" className="input-field"
                                    placeholder="e.g., Widget Pro 3000"
                                    value={productName} onChange={(e) => setProductName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="info-label">Lot Number</label>
                                <input
                                    type="text" className="input-field"
                                    placeholder="e.g., LOT-2026-001"
                                    value={lotNumber} onChange={(e) => setLotNumber(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <label className="info-label">Issue <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <select
                                className="input-field"
                                value={issueType}
                                onChange={(e) => {
                                    setIssueType(e.target.value);
                                    if (e.target.value !== 'Other') setCustomIssueType('');
                                }}
                                required
                                style={{ cursor: 'pointer' }}
                            >
                                <option value="">-- Select Issue Type --</option>
                                <option value="Date Code">Date Code</option>
                                <option value="Off Taste">Off Taste</option>
                                <option value="Off Smell">Off Smell</option>
                                <option value="Color">Color</option>
                                <option value="Foreign Material">Foreign Material</option>
                                <option value="Package Integrity">Package Integrity</option>
                                <option value="Damaged">Damaged</option>
                                <option value="Ingredient Inquiry">Ingredient Inquiry</option>
                                <option value="Other">Other</option>
                            </select>
                            {issueType === 'Other' && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    <label className="info-label">Please specify the issue <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <input
                                        type="text" className="input-field"
                                        placeholder="Describe the issue type..."
                                        value={customIssueType}
                                        onChange={(e) => setCustomIssueType(e.target.value)}
                                        required
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section: Classification */}
                    <div className="card animate-fade-in" style={{ marginBottom: '1rem', animationDelay: '0.1s', opacity: 0 }}>
                        <h2 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.125rem' }}>🏷️</span> Classification
                        </h2>

                        {/* Priority */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="info-label">Priority</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {priorities.map(p => (
                                    <button
                                        key={p.key} type="button"
                                        onClick={() => setPriority(p.key)}
                                        style={{
                                            padding: '0.5rem 1.125rem',
                                            border: priority === p.key ? `2px solid ${p.color}` : '2px solid var(--border)',
                                            background: priority === p.key ? p.bg : 'white',
                                            color: priority === p.key ? p.color : 'var(--text-secondary)',
                                            borderRadius: 'var(--radius-lg)',
                                            cursor: 'pointer',
                                            fontWeight: priority === p.key ? '600' : '400',
                                            fontSize: '0.875rem',
                                            transition: 'all var(--transition-base)',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Department */}
                        {departments.length > 0 && (
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label className="info-label">Assign to Department</label>
                                <select
                                    className="input-field"
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                >
                                    <option value="">Select Department (Optional)</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Tags */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="info-label" style={{ margin: 0 }}>Tags</label>
                                <button
                                    type="button" onClick={() => setShowNewTagModal(true)}
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--primary)', fontSize: '0.8125rem' }}
                                >
                                    + New Tag
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {tags.map(tag => (
                                    <button
                                        key={tag.id} type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        style={{
                                            padding: '0.4rem 0.875rem',
                                            border: selectedTags.includes(tag.id)
                                                ? `2px solid ${tag.color}`
                                                : '2px solid var(--border)',
                                            background: selectedTags.includes(tag.id) ? `${tag.color}15` : 'white',
                                            color: selectedTags.includes(tag.id) ? tag.color : 'var(--text-secondary)',
                                            borderRadius: 'var(--radius-full)',
                                            cursor: 'pointer',
                                            fontSize: '0.8125rem',
                                            fontWeight: '500',
                                            transition: 'all var(--transition-base)',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        {selectedTags.includes(tag.id) ? '✓ ' : ''}{tag.name}
                                    </button>
                                ))}
                                {tags.length === 0 && (
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                                        No tags yet. Create one above.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Section: Attachments */}
                    <div className="card animate-fade-in" style={{ marginBottom: '1.5rem', animationDelay: '0.15s', opacity: 0 }}>
                        <h2 style={{ fontSize: '0.9375rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.125rem' }}>📸</span> Attachments
                        </h2>

                        <div style={{
                            border: '2px dashed var(--border)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.5rem',
                            textAlign: 'center',
                            background: 'var(--bg-body)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-base)',
                        }}
                            onClick={() => document.getElementById('photo-input').click()}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)'; }}
                            onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                            <input
                                id="photo-input"
                                type="file" accept="image/*" multiple
                                onChange={handlePhotoSelect}
                                style={{ display: 'none' }}
                            />
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.6 }}>📷</div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                Click to upload or drag photos here
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                                Max 5 photos · 10MB each · JPG, PNG, GIF
                            </p>
                        </div>

                        {selectedPhotos.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                                {selectedPhotos.map((photo, index) => (
                                    <div key={index} style={{ position: 'relative' }}>
                                        <img
                                            src={URL.createObjectURL(photo)}
                                            alt={`Preview ${index + 1}`}
                                            style={{
                                                width: '90px', height: '90px',
                                                objectFit: 'cover',
                                                borderRadius: 'var(--radius-lg)',
                                                border: '2px solid var(--border-light)',
                                            }}
                                        />
                                        <button
                                            type="button" onClick={() => removePhoto(index)}
                                            style={{
                                                position: 'absolute', top: '-6px', right: '-6px',
                                                background: 'var(--danger)', color: 'white', border: '2px solid white',
                                                borderRadius: '50%', width: '22px', height: '22px',
                                                cursor: 'pointer', fontSize: '0.7rem',
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

                    {/* Actions */}
                    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', animationDelay: '0.2s', opacity: 0 }}>
                        <button
                            type="button" onClick={() => navigate('/dashboard')}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? (
                                <><div className="spinner-sm spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} /> Submitting...</>
                            ) : '🚀 Submit Complaint'}
                        </button>
                    </div>
                </form>

                {/* Create Tag Modal */}
                {showNewTagModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
                                Create New Tag
                            </h2>
                            <form onSubmit={handleCreateTag}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label className="info-label">Tag Name</label>
                                    <input type="text" className="input-field" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} required placeholder="e.g., Urgent" />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label className="info-label">Color</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} style={{ width: '48px', height: '40px', cursor: 'pointer', border: 'none', borderRadius: 'var(--radius-md)', padding: 0 }} />
                                        <span className="badge" style={{ background: newTagColor, color: 'white' }}>
                                            {newTagName || 'Preview'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowNewTagModal(false)} className="btn btn-secondary">Cancel</button>
                                    <button type="submit" className="btn btn-primary">Create Tag</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateComplaint;
