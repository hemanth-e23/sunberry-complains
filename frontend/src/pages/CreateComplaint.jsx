import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CreateComplaint = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [selectedTags, setSelectedTags] = useState([]);
    const [tags, setTags] = useState([]);
    const [showNewTagModal, setShowNewTagModal] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3B82F6');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const response = await api.get('/tags/');
            setTags(response.data);
        } catch (error) {
            console.error('Error fetching tags:', error);
        }
    };

    const handleCreateTag = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/tags/', {
                name: newTagName,
                color: newTagColor
            });
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
            await api.post('/complaints/', {
                title,
                description,
                priority,
                tag_ids: selectedTags
            });
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to create complaint. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const priorityColors = {
        low: '#6B7280',
        medium: '#3B82F6',
        high: '#F59E0B',
        critical: '#EF4444'
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)', padding: '2rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    ← Back to Dashboard
                </button>

                <div className="card">
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                        Create New Complaint
                    </h1>

                    {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                Title
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Brief summary of the issue"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                Description
                            </label>
                            <textarea
                                className="input-field"
                                placeholder="Detailed description of the complaint..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={6}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className="mb-4">
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                Priority
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {['low', 'medium', 'high', 'critical'].map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPriority(p)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            border: priority === p ? `2px solid ${priorityColors[p]}` : '2px solid transparent',
                                            background: priority === p ? priorityColors[p] : '#F3F4F6',
                                            color: priority === p ? 'white' : '#374151',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            fontWeight: priority === p ? '600' : '400',
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                    Tags
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowNewTagModal(true)}
                                    style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontSize: '0.875rem' }}
                                >
                                    + Create New Tag
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {tags.map(tag => (
                                    <button
                                        key={tag.id}
                                        type="button"
                                        onClick={() => toggleTag(tag.id)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            border: selectedTags.includes(tag.id) ? `2px solid ${tag.color}` : '2px solid #E5E7EB',
                                            background: selectedTags.includes(tag.id) ? tag.color : 'white',
                                            color: selectedTags.includes(tag.id) ? 'white' : '#374151',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="btn"
                                style={{ background: '#E5E7EB', color: 'var(--text-primary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Submitting...' : 'Submit Complaint'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Create Tag Modal */}
                {showNewTagModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Create New Tag</h2>
                            <form onSubmit={handleCreateTag}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Tag Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={newTagName}
                                        onChange={(e) => setNewTagName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Color</label>
                                    <input
                                        type="color"
                                        value={newTagColor}
                                        onChange={(e) => setNewTagColor(e.target.value)}
                                        style={{ width: '100%', height: '40px', cursor: 'pointer' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewTagModal(false)}
                                        style={{ padding: '0.75rem 1.5rem', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Create Tag
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

export default CreateComplaint;
