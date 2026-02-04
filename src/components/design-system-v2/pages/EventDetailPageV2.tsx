'use client';

import React from 'react';
import Link from 'next/link';
import { V2Layout } from '../V2Layout';
import { NavBarV2 } from '../NavBarV2';
import { useEvent, useEventBouts, useMyPicks } from '@/lib/hooks';
import { getEventPosterUrl, getFighterImageUrl, getEventImageUrl } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface EventDetailPageV2Props {
    params: {
        id: string;
    }
}

export const EventDetailPageV2 = ({ params }: EventDetailPageV2Props) => {
    const eventId = parseInt(params.id, 10);

    const { data: event, isLoading: eventLoading } = useEvent(eventId);
    const { data: bouts, isLoading: boutsLoading } = useEventBouts(eventId);
    const { data: userPicks } = useMyPicks(eventId);

    // Create a map of picks by bout_id for quick lookup
    const picksByBout = React.useMemo(() => {
        const map: Record<number, { corner: 'red' | 'blue'; method?: string }> = {};
        userPicks?.forEach(pick => {
            map[pick.bout_id] = { corner: pick.picked_corner, method: pick.picked_method };
        });
        return map;
    }, [userPicks]);

    if (eventLoading || boutsLoading) {
        return (
            <V2Layout>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="animate-spin h-10 w-10 text-white" />
                </div>
            </V2Layout>
        );
    }

    if (!event || !bouts) return <V2Layout><div className="text-white text-center pt-40">Event not found</div></V2Layout>;

    // logic for categorizing bouts
    const mainEvent = bouts[0];
    const coMain = bouts[1];
    const mainCardRest = bouts.slice(2, 5);
    const prelims = bouts.slice(5);

    const totalFights = bouts.length;
    const titleBouts = bouts.filter(b => b.is_title_fight).length;
    const picksMadeCount = userPicks?.length || 0;

    const renderBout = (bout: any, type: 'main' | 'co-main' | 'standard') => {
        const pick = picksByBout[bout.id];
        const isRedSelected = pick?.corner === 'red';
        const isBlueSelected = pick?.corner === 'blue';
        const hasPick = !!pick;

        return (
            <Link 
                key={bout.id} 
                href={`/events/${eventId}/fights/${bout.id}`}
                className={`fight-card fight-card--clickable ${type === 'main' ? 'fight-card--main' : ''}`}
            >
                <div className="fight-card__header">
                    <span className="fight-card__weight">{bout.weight_class} BOUT</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {hasPick && (
                            <span className="fight-card__picked-badge">✓ PICKED</span>
                        )}
                        <span className="fight-card__rounds">{bout.rounds_scheduled} ROUNDS</span>
                    </div>
                </div>
                <div className="fight-card__content">
                    {/* RED CORNER */}
                    <div className={`fight-card__fighter fight-card__fighter--red ${isRedSelected ? 'fight-card__fighter--selected' : ''}`}>
                        <div className="fight-card__photo">
                            <img 
                                src={getFighterImageUrl(bout.fighters.red)}
                                alt={bout.fighters.red.fighter_name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    console.error('[Fighter Image Error]', { 
                                        fighter: bout.fighters.red.fighter_name,
                                        url: getFighterImageUrl(bout.fighters.red),
                                        profile_image_url: bout.fighters.red.profile_image_url 
                                    });
                                    e.currentTarget.src = '/placeholder-fighter.svg';
                                }}
                            />
                        </div>
                        <div className="fight-card__info">
                            <h3 className="fight-card__name">{bout.fighters.red.fighter_name}</h3>
                            <p className="fight-card__record">
                                {bout.fighters.red.record_at_fight ?
                                    `${bout.fighters.red.record_at_fight.wins}-${bout.fighters.red.record_at_fight.losses}-${bout.fighters.red.record_at_fight.draws}`
                                    : 'Rec N/A'}
                            </p>
                            <p className="fight-card__country">{bout.fighters.red.nationality || ' '}</p>
                        </div>
                    </div>

                    <div className="fight-card__vs">
                        <span className="fight-card__vs-text">VS</span>
                    </div>

                    {/* BLUE CORNER */}
                    <div className={`fight-card__fighter fight-card__fighter--blue ${isBlueSelected ? 'fight-card__fighter--selected' : ''}`}>
                        <div className="fight-card__photo">
                            <img 
                                src={getFighterImageUrl(bout.fighters.blue)}
                                alt={bout.fighters.blue.fighter_name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    console.error('[Fighter Image Error]', { 
                                        fighter: bout.fighters.blue.fighter_name,
                                        url: getFighterImageUrl(bout.fighters.blue),
                                        profile_image_url: bout.fighters.blue.profile_image_url 
                                    });
                                    e.currentTarget.src = '/placeholder-fighter.svg';
                                }}
                            />
                        </div>
                        <div className="fight-card__info">
                            <h3 className="fight-card__name">{bout.fighters.blue.fighter_name}</h3>
                            <p className="fight-card__record">
                                {bout.fighters.blue.record_at_fight ?
                                    `${bout.fighters.blue.record_at_fight.wins}-${bout.fighters.blue.record_at_fight.losses}-${bout.fighters.blue.record_at_fight.draws}`
                                    : 'Rec N/A'}
                            </p>
                            <p className="fight-card__country">{bout.fighters.blue.nationality || ' '}</p>
                        </div>
                    </div>
                </div>
                <div className="fight-card__click-hint">
                    CLICK TO {hasPick ? 'EDIT PICK' : 'MAKE PICK'} →
                </div>
            </Link>
        );
    };

    return (
        <V2Layout>
            <NavBarV2 activePage="events" />

            <div className="main" style={{ paddingTop: '70px', paddingBottom: '100px' }}>
                <section className="event-hero" style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${getEventImageUrl(event)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    <div className="event-hero__image">
                        <span className="event-hero__image-text">UFC</span>
                        <span className="event-hero__badge">{event.status === 'scheduled' ? 'OPEN FOR PICKS' : event.status}</span>
                    </div>
                    <div className="event-hero__content">
                        <div className="event-hero__date">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}</div>
                        <h1 className="event-hero__title">{event.name}</h1>
                        <p className="event-hero__location">{event.location?.venue}, {event.location?.city}</p>

                        {event.status === 'scheduled' && (
                            <div className="event-hero__countdown">
                                <div className="event-hero__countdown-label">DATE</div>
                                <div className="event-hero__countdown-time">{new Date(event.date).toLocaleDateString()}</div>
                            </div>
                        )}

                        <div className="event-hero__stats">
                            <div>
                                <div className="event-hero__stat-value">{totalFights}</div>
                                <div className="event-hero__stat-label">TOTAL FIGHTS</div>
                            </div>
                            <div>
                                <div className="event-hero__stat-value">{titleBouts}</div>
                                <div className="event-hero__stat-label">TITLE BOUTS</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="fights-section">
                    <div className="fights-header">
                        <h2 className="fights-header__title">FIGHT CARD</h2>
                        <div className="fights-header__progress"><span>{picksMadeCount}</span> / {totalFights} PICKS MADE</div>
                    </div>

                    {renderBout(mainEvent, 'main')}
                    {coMain && renderBout(coMain, 'co-main')}

                    {mainCardRest.length > 0 && (
                        <>
                            <div className="card-divider">
                                <div className="card-divider__line"></div>
                                <span className="card-divider__text">MAIN CARD</span>
                                <div className="card-divider__line"></div>
                            </div>
                            {mainCardRest.map(b => renderBout(b, 'standard'))}
                        </>
                    )}

                    {prelims.length > 0 && (
                        <>
                            <div className="card-divider">
                                <div className="card-divider__line"></div>
                                <span className="card-divider__text">PRELIMS</span>
                                <div className="card-divider__line"></div>
                            </div>
                            {prelims.map(b => renderBout(b, 'standard'))}
                        </>
                    )}

                </section>
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
