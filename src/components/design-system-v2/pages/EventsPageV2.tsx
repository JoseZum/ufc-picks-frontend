'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { V2Layout } from '../V2Layout';
import { NavBarV2 } from '../NavBarV2';
import { useEvents, useCurrentUser } from '@/lib/hooks';
import { getEventPosterUrl } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export const EventsPageV2 = () => {
    const router = useRouter();
    const [filter, setFilter] = useState<'upcoming' | 'completed'>('upcoming');

    // Fetch events
    const { data: eventsData, isLoading } = useEvents({ limit: 50 });
    const events = eventsData?.events || [];
    const { data: currentUser } = useCurrentUser();

    // Sort and categorise events
    // Assumes events are returned sorted by date? Usually they are. If not, sort them.
    // Use a copy to sort
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const upcomingEventsAll = sortedEvents.filter(e => e.status === 'scheduled');
    const completedEventsAll = sortedEvents.filter(e => e.status === 'completed' || e.status === 'cancelled').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest completed first

    // Featured event is the FIRST upcoming event
    const featuredEvent = upcomingEventsAll[0];
    const otherUpcomingEvents = upcomingEventsAll.slice(1);

    // Filter logic for display
    const showUpcoming = filter === 'upcoming';
    const showCompleted = filter === 'completed';

    const getDaysLeft = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? `${days}D` : 'TODAY';
    };

    const formatDate = (dateStr: string) => {
        // Parse date as UTC to avoid timezone conversion issues
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC'
        }).toUpperCase();
    };

    return (
        <V2Layout>
            <NavBarV2 activePage="events" />

            <div className="main">
                <header className="page-header">
                    <div>
                        <h1 className="page-header__title">EVENTS</h1>
                        <p className="page-header__subtitle">UFC Fight Calendar // Make Your Predictions</p>
                    </div>
                    <div className="page-header__filters">
                        <button
                            className={`filter-btn ${filter === 'upcoming' ? 'filter-btn--active' : ''}`}
                            onClick={() => setFilter('upcoming')}
                        >
                            UPCOMING
                        </button>
                        <button
                            className={`filter-btn ${filter === 'completed' ? 'filter-btn--active' : ''}`}
                            onClick={() => setFilter('completed')}
                        >
                            COMPLETED
                        </button>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-white" /></div>
                ) : (
                    <>
                        <div className="events-grid">
                            {/* FEATURED EVENT */}
                            {showUpcoming && featuredEvent && (
                                <a href={`/events/${featuredEvent.id}`} className="event-card event-card--featured">
                                    <div className="event-card__image" style={{
                                        backgroundImage: `url(${getEventPosterUrl(featuredEvent)})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}>
                                        {!getEventPosterUrl(featuredEvent) && <span className="event-card__image-text">UFC<br />{featuredEvent.id}</span>}
                                        <span className="event-card__badge event-card__badge--open">OPEN</span>
                                    </div>
                                    <div className="event-card__content">
                                        <div className="event-card__date">{formatDate(featuredEvent.date)}</div>
                                        <h2 className="event-card__title">{featuredEvent.name}</h2>
                                        <p className="event-card__location">{featuredEvent.location?.venue || 'Location TBD'}, {featuredEvent.location?.city || ''}</p>
                                        <div className="event-card__meta">
                                            <div className="event-card__stat">
                                                <span className="event-card__stat-value">{featuredEvent.total_bouts}</span>
                                                <span className="event-card__stat-label">FIGHTS</span>
                                            </div>
                                            {/* We don't have title bout count easily without fetching bouts, omitting for now or calculating if we had bouts */}
                                            <div className="event-card__stat">
                                                <span className="event-card__stat-value">{getDaysLeft(featuredEvent.date)}</span>
                                                <span className="event-card__stat-label">LEFT</span>
                                            </div>
                                        </div>
                                        <div className="event-card__main-event">
                                            <div className="event-card__main-event-label">CLICK FOR DETAILS</div>
                                            <div className="event-card__main-event-fighters">
                                                MAKE <span>YOUR</span> PICKS
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            )}

                            {/* UPCOMING EVENTS */}
                            {showUpcoming && otherUpcomingEvents.map(event => (
                                <a key={event.id} href={`/events/${event.id}`} className="event-card">
                                    <div className="event-card__image" style={{
                                        backgroundImage: `url(${getEventPosterUrl(event)})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}>
                                        {!getEventPosterUrl(event) && <span className="event-card__image-text">EVENT</span>}
                                        <span className="event-card__badge">UPCOMING</span>
                                    </div>
                                    <div className="event-card__content">
                                        <div className="event-card__date">{formatDate(event.date)}</div>
                                        <h2 className="event-card__title">{event.name}</h2>
                                        <p className="event-card__location">{event.location?.venue}, {event.location?.city}</p>
                                        <div className="event-card__meta">
                                            <div className="event-card__stat">
                                                <span className="event-card__stat-value">{event.total_bouts}</span>
                                                <span className="event-card__stat-label">FIGHTS</span>
                                            </div>
                                            <div className="event-card__stat">
                                                <span className="event-card__stat-value">{getDaysLeft(event.date)}</span>
                                                <span className="event-card__stat-label">LEFT</span>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>

                        {/* COMPLETED EVENTS SECTION */}
                        {showCompleted && completedEventsAll.length > 0 && (
                            <>
                                <div className="section-divider">
                                    <div className="section-divider__line"></div>
                                    <span className="section-divider__text">COMPLETED EVENTS</span>
                                    <div className="section-divider__line"></div>
                                </div>

                                <div className="events-grid">
                                    {completedEventsAll.map(event => (
                                        <a key={event.id} href={`/events/${event.id}`} className="event-card">
                                            <div className="event-card__image" style={{
                                                backgroundImage: `url(${getEventPosterUrl(event)})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}>
                                                {!getEventPosterUrl(event) && <span className="event-card__image-text">UFC</span>}
                                                <span className="event-card__badge event-card__badge--completed">COMPLETED</span>
                                            </div>
                                            <div className="event-card__content">
                                                <div className="event-card__date">{formatDate(event.date)}</div>
                                                <h2 className="event-card__title">{event.name}</h2>
                                                <p className="event-card__location">{event.location?.venue}, {event.location?.city}</p>
                                                <div className="event-card__meta">
                                                    {/* Placeholder for user stats per event - data not available in list view yet */}
                                                    <div className="event-card__stat">
                                                        <span className="event-card__stat-value">-</span>
                                                        <span className="event-card__stat-label">YOUR PICKS</span>
                                                    </div>
                                                    <div className="event-card__stat">
                                                        <span className="event-card__stat-value">-</span>
                                                        <span className="event-card__stat-label">ACCURACY</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </>
                        )}

                        {events.length === 0 && (
                            <div className="text-center py-10">No events found.</div>
                        )}
                    </>
                )}
            </div>

            <footer className="footer">
                <div className="footer__grid">
                    <div className="footer__block">
                        <div className="footer__label">SYSTEM</div>
                        <div className="footer__text">UFC PICKS v2.0</div>
                    </div>
                </div>
            </footer>
        </V2Layout>
    );
};
