'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { V2Layout } from '../V2Layout';
import { useEvent, useEventBouts, useMyPicks, useCreatePick, useCurrentUser } from '@/lib/hooks';
import { getEventPosterUrl, getFighterImageUrl } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface EventDetailPageV2Props {
    params: {
        id: string;
    }
}

export const EventDetailPageV2 = ({ params }: EventDetailPageV2Props) => {
    const router = useRouter();
    const eventId = parseInt(params.id, 10);

    const { data: event, isLoading: eventLoading } = useEvent(eventId);
    const { data: bouts, isLoading: boutsLoading } = useEventBouts(eventId);
    const { data: userPicks, refetch: refetchPicks } = useMyPicks(eventId);
    const { data: currentUser } = useCurrentUser();
    const createPickMutation = useCreatePick();

    // Local state for pending picks
    const [selectedPicks, setSelectedPicks] = useState<Record<number, 'red' | 'blue'>>({});
    const [saving, setSaving] = useState(false);

    // Initialize/sync local state with fetched picks
    useEffect(() => {
        if (userPicks) {
            const initialPicks: Record<number, 'red' | 'blue'> = {};
            userPicks.forEach(pick => {
                initialPicks[pick.bout_id] = pick.picked_corner;
            });
            setSelectedPicks(prev => ({ ...prev, ...initialPicks }));
        }
    }, [userPicks]);

    const handlePickSelection = (boutId: number, corner: 'red' | 'blue') => {
        // Prevent picking if event is completed or locked (logic to be enhanced)
        if (event?.status !== 'scheduled') return;

        setSelectedPicks(prev => ({
            ...prev,
            [boutId]: corner
        }));
    };

    const handleSavePicks = async () => {
        if (!currentUser) {
            router.push('/login'); // Or whatever auth flow
            return;
        }

        setSaving(true);
        try {
            // Identify changed or new picks to save
            const savePromises = Object.entries(selectedPicks).map(async ([boutIdStr, corner]) => {
                const boutId = parseInt(boutIdStr, 10);
                const originalPick = userPicks?.find(p => p.bout_id === boutId);

                // Only save if it's a new pick or changed pick
                if (!originalPick || originalPick.picked_corner !== corner) {
                    await createPickMutation.mutateAsync({
                        event_id: eventId,
                        bout_id: boutId,
                        picked_corner: corner,
                        picked_method: 'DEC' // Default for now as V2 UI simplified
                    });
                }
            });

            await Promise.all(savePromises);
            await refetchPicks();
            // Optional: simple alert or toast here
        } catch (err) {
            console.error('Failed to save picks', err);
        } finally {
            setSaving(false);
        }
    };

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
    // Assuming API returns bouts in order. We'll take index 0, 1 as Main/Co-Main
    // and split remaining.
    const mainEvent = bouts[0];
    const coMain = bouts[1];
    const mainCardRest = bouts.slice(2, 5); // Next 3
    const prelims = bouts.slice(5);

    const totalFights = bouts.length;
    const titleBouts = bouts.filter(b => b.is_title_fight).length;
    const picksMadeCount = Object.keys(selectedPicks).length;

    // Countdown logic
    const timeUntil = new Date(event.date); // Need a real hook for countdown, static for now or use library

    const renderBout = (bout: any, type: 'main' | 'co-main' | 'standard', idx?: number) => {
        const isRedSelected = selectedPicks[bout.id] === 'red';
        const isBlueSelected = selectedPicks[bout.id] === 'blue';

        return (
            <div key={bout.id} className={`fight-card ${type === 'main' ? 'fight-card--main' : ''}`}>
                <div className="fight-card__header">
                    <span className="fight-card__weight">{bout.weight_class} BOUT</span>
                    <span className="fight-card__rounds">{bout.rounds_scheduled} ROUNDS</span>
                </div>
                <div className="fight-card__content">
                    {/* RED CORNER */}
                    <div
                        className={`fight-card__fighter fight-card__fighter--red ${isRedSelected ? 'fight-card__fighter--selected' : ''}`}
                        onClick={() => handlePickSelection(bout.id, 'red')}
                    >
                        <div className="fight-card__photo" style={{
                            backgroundImage: `url(${getFighterImageUrl(bout.fighters.red)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'top center'
                        }}></div>
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
                    <div
                        className={`fight-card__fighter fight-card__fighter--blue ${isBlueSelected ? 'fight-card__fighter--selected' : ''}`}
                        onClick={() => handlePickSelection(bout.id, 'blue')}
                    >
                        <div className="fight-card__photo" style={{
                            backgroundImage: `url(${getFighterImageUrl(bout.fighters.blue)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'top center'
                        }}></div>
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
            </div>
        );
    };

    return (
        <V2Layout>
            <nav className="nav">
                <a href="/" className="nav__logo">UFC PICKS</a>
                <div className="nav__items">
                    <a href="/" className="nav__item">HOME</a>
                    <a href="/events" className="nav__item nav__item--active">EVENTS</a>
                    <a href="/leaderboards" className="nav__item">LEADERBOARD</a>
                    <a href="/picks" className="nav__item">MY PICKS</a>
                </div>
                <div className="nav__user">
                    <div className="nav__avatar" style={{ backgroundImage: `url(${currentUser?.profile_picture || ''})`, backgroundSize: 'cover' }}></div>
                    <span>{currentUser?.name || 'GUEST'}</span>
                </div>
            </nav>

            <div className="main" style={{ paddingTop: '70px', paddingBottom: '100px' }}>
                <section className="event-hero" style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${getEventPosterUrl(event)})`,
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

                {event.status === 'scheduled' && (
                    <div className="submit-bar">
                        <div className="submit-bar__info">
                            <div>
                                <div className="submit-bar__stat-value">{picksMadeCount} / {totalFights}</div>
                                <div className="submit-bar__stat-label">PICKS MADE</div>
                            </div>
                            <div>
                                <div className="submit-bar__stat-value">{totalFights - picksMadeCount}</div>
                                <div className="submit-bar__stat-label">REMAINING</div>
                            </div>
                        </div>
                        <button
                            className="submit-bar__btn"
                            onClick={handleSavePicks}
                            disabled={saving}
                        >
                            {saving ? 'SAVING...' : 'SAVE PICKS'} &rarr;
                        </button>
                    </div>
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
