'use client';

import React, { useState } from 'react';
import { useEvents } from '@/lib/hooks';
import {
    deleteEventArt,
    uploadEventArt,
} from '@/lib/api';

export function EventArtTab() {
    const { data: eventsData, isLoading, refetch } = useEvents({ limit: 50 });
    const [uploading, setUploading] = useState<number | null>(null);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [eventFilter, setEventFilter] = useState<'upcoming' | 'completed'>('upcoming');

    const handleUpload = async (eventId: number, file: File) => {
        setUploading(eventId);
        try {
            await uploadEventArt(eventId, file);
            alert('✅ Event art uploaded successfully');
            refetch();
        } catch (error: any) {
            console.error(error);
            alert(`❌ ${error.message}`);
        } finally {
            setUploading(null);
        }
    };

    const handleDelete = async (eventId: number) => {
        if (!confirm('Delete event art for this event?')) return;

        setDeleting(eventId);
        try {
            await deleteEventArt(eventId);
            alert('✅ Event art deleted');
            refetch();
        } catch (error) {
            console.error(error);
            alert('❌ Error deleting event art');
        } finally {
            setDeleting(null);
        }
    };

    if (isLoading) {
        return <div className="admin-section-title">Loading events...</div>;
    }

    const allEvents = eventsData?.events || [];
    const upcomingEvents = allEvents.filter(e => e.status === 'scheduled');
    const completedEvents = allEvents.filter(e => e.status === 'completed' || e.status === 'cancelled');
    const events = eventFilter === 'upcoming' ? upcomingEvents : completedEvents;

    return (
        <div className="admin-tab-content admin-tab-content--active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 className="admin-section-title">EVENT ART UPLOADS</h2>
                    <p style={{ color: '#999', fontSize: '0.95rem' }}>
                        Upload custom event art images. These will be displayed as hero backgrounds on event pages. Supported formats: AVIF, PNG, JPG, WEBP.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`filter-btn ${eventFilter === 'upcoming' ? 'filter-btn--active' : ''}`}
                        onClick={() => setEventFilter('upcoming')}
                    >
                        UPCOMING
                    </button>
                    <button
                        className={`filter-btn ${eventFilter === 'completed' ? 'filter-btn--active' : ''}`}
                        onClick={() => setEventFilter('completed')}
                    >
                        COMPLETED
                    </button>
                </div>
            </div>

            {events.map((event) => (
                <div key={event.id} className="event-art-card">
                    <div className="event-art-card__header">
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{event.name}</h3>
                            <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '0.25rem' }}>
                                {new Date(event.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                            </p>
                        </div>
                        {event.event_art_url && (
                            <span style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: 600 }}>✓ HAS ART</span>
                        )}
                    </div>
                    <div className="event-art-card__body">
                        <input
                            type="file"
                            accept="image/avif,image/png,image/jpeg,image/webp"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUpload(event.id, file);
                            }}
                            disabled={uploading === event.id || deleting === event.id}
                            style={{
                                padding: '0.75rem',
                                border: '2px solid #333',
                                borderRadius: '4px',
                                backgroundColor: '#1a1a1a',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                            }}
                        />
                        {event.event_art_url && (
                            <button
                                className="admin-btn admin-btn--secondary"
                                onClick={() => handleDelete(event.id)}
                                disabled={deleting === event.id || uploading === event.id}
                                style={{ marginLeft: 'auto' }}
                            >
                                {deleting === event.id ? 'DELETING...' : 'DELETE ART'}
                            </button>
                        )}
                        {uploading === event.id && <span style={{ color: '#999', fontSize: '0.9rem' }}>Uploading...</span>}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ===== PHOTO UPLOADER TAB =====
