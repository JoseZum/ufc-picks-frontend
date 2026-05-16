'use client';

import React from 'react';
import Link from 'next/link';
import { V2Layout } from '../V2Layout';
import { NavBarV2 } from '../NavBarV2';
import { MobileNav } from '../MobileNav';
import { useEvent, useEventBouts, useMyPicks } from '@/lib/hooks';
import {
    getApiUrl,
    getAuthToken,
    getBoutResultLabel,
    getBoutResultOutcome,
    getEventDateTime,
    getEventImageUrl,
    getFighterDisplayName,
    getFighterImageUrl,
    hasBoutResult,
    getNormalizedFighterName
} from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { FlagBadge } from '@/components/FlagBadge';
import { getFlagCode } from '@/lib/countryCodeMapping';
import { useCountdown } from '../hooks/useCountdown';
import { FastPicksPanel } from '../FastPicksPanel';

interface EventDetailPageV2Props {
    params: {
        id: string;
    }
}

export const EventDetailPageV2 = ({ params }: EventDetailPageV2Props) => {
    const eventId = parseInt(params.id, 10);

    const { data: event, isLoading: eventLoading } = useEvent(eventId);
    const { data: bouts, isLoading: boutsLoading } = useEventBouts(eventId);
    const { data: userPicks, refetch: refetchUserPicks } = useMyPicks(eventId);
    const [isFastPicksOpen, setIsFastPicksOpen] = React.useState(false);

    // Countdown timer
    const eventDateTime = event ? getEventDateTime(event) : null;
    const { formatted, isExpired } = useCountdown(eventDateTime);

    // Create a map of picks by bout_id for quick lookup
    const picksByBout = React.useMemo(() => {
        const map: Record<number, { corner: 'red' | 'blue'; method?: string; fighterName: string }> = {};
        userPicks?.forEach(pick => {
            // We'll determine corner later when we have bout context
            // For now, store the fighter name and determine corner at render time
            map[pick.bout_id] = {
                corner: 'red', // placeholder, will be determined at render
                method: pick.picked_method,
                fighterName: pick.picked_fighter_name
            };
        });
        return map;
    }, [userPicks]);

    if (eventLoading || boutsLoading) {
        return (
            <V2Layout>
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="animate-spin h-10 w-10 text-white" />
                </div>
            <MobileNav activePage="events" />
        </V2Layout>
        );
    }

    if (!event || !bouts) return <V2Layout><div className="text-white text-center pt-40">Event not found</div><MobileNav activePage="events" />
        </V2Layout>;

    // logic for categorizing bouts
    const mainEvent = bouts[0];
    const coMain = bouts[1];
    const mainCardRest = bouts.slice(2, 5);
    const prelims = bouts.slice(5);

    const totalFights = bouts.length;
    const titleBouts = bouts.filter(b => b.is_title_fight).length;
    const picksMadeCount = userPicks?.length || 0;

    const handleExportPicks = async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const resp = await fetch(`${getApiUrl()}/events/${eventId}/fight-card-image`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!resp.ok) throw new Error('Failed to generate fight card');

            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fight-card-${event.name?.replace(/\s+/g, '-').toLowerCase() || eventId}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            // silenciar error
        }
    };

    const renderBout = (bout: any, type: 'main' | 'co-main' | 'standard') => {
        const pick = picksByBout[bout.id];
        const redFighterName = getFighterDisplayName(bout.fighters.red);
        const blueFighterName = getFighterDisplayName(bout.fighters.blue);

        // Determine which corner was actually picked by comparing fighter names
        let isRedSelected = false;
        let isBlueSelected = false;
        if (pick) {
            const pickedName = pick.fighterName?.toLowerCase().trim();
            const redName = getNormalizedFighterName(bout.fighters.red);
            const blueName = getNormalizedFighterName(bout.fighters.blue);

            if (pickedName === redName) {
                isRedSelected = true;
            } else if (pickedName === blueName) {
                isBlueSelected = true;
            }
        }
        const hasPick = !!pick;

        // Check if bout has result
        const resultOutcome = getBoutResultOutcome(bout.result);
        const hasResult = hasBoutResult(bout.result);
        const isRedWinner = resultOutcome === 'red';
        const isBlueWinner = resultOutcome === 'blue';
        const isDrawResult = resultOutcome === 'draw';
        const hasWinningCorner = isRedWinner || isBlueWinner;
        const resultMethod = hasResult ? (bout.result?.method ?? '') : '';
        const resultRound = hasResult ? bout.result?.round : null;

        return (
            <Link
                key={bout.id}
                href={`/events/${eventId}/fights/${bout.id}`}
                className={`fight-card fight-card--clickable ${type === 'main' ? 'fight-card--main' : ''} ${hasResult ? 'fight-card--completed' : ''}`}
            >
                <div className="fight-card__header">
                    <span className="fight-card__weight">{bout.weight_class} BOUT</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {hasResult && (
                            <span className="fight-card__result-badge">
                                {hasWinningCorner
                                    ? (resultMethod ? `${resultMethod}${resultRound ? ` R${resultRound}` : ''}` : getBoutResultLabel(bout.result))
                                    : getBoutResultLabel(bout.result)}
                            </span>
                        )}
                        {hasPick && !hasResult && (
                            <span className="fight-card__picked-badge">✓ PICKED</span>
                        )}
                        <span className="fight-card__rounds">{bout.rounds_scheduled} ROUNDS</span>
                    </div>
                </div>
                <div className="fight-card__content">
                    {/* RED CORNER */}
                    <div className={`fight-card__fighter fight-card__fighter--red ${isRedSelected ? 'fight-card__fighter--selected' : ''} ${isDrawResult ? 'fight-card__fighter--draw' : ''} ${isRedWinner ? 'fight-card__fighter--winner' : hasWinningCorner ? 'fight-card__fighter--loser' : ''}`}>
                        {isDrawResult ? (
                            <div className="fight-card__winner-badge fight-card__winner-badge--draw">
                                <span className="fight-card__winner-text">DRAW</span>
                            </div>
                        ) : isRedWinner && (
                            <div className="fight-card__winner-badge">
                                <span className="fight-card__winner-icon">👑</span>
                                <span className="fight-card__winner-text">WINNER</span>
                            </div>
                        )}
                        <div className="fight-card__photo">
                            <img
                                src={getFighterImageUrl(bout.fighters.red)}
                                alt={redFighterName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.currentTarget.src = '/placeholder-fighter.svg';
                                }}
                            />
                        </div>
                        <div className="fight-card__info">
                            <h3 className="fight-card__name">{redFighterName}</h3>
                            <p className="fight-card__record">
                                {bout.fighters.red.record_at_fight ?
                                    `${bout.fighters.red.record_at_fight.wins}-${bout.fighters.red.record_at_fight.losses}-${bout.fighters.red.record_at_fight.draws}`
                                    : 'Rec N/A'}
                            </p>
                            <div className="fight-card__country">
                                {bout.fighters.red.nationality && (
                                    <FlagBadge
                                        country={bout.fighters.red.nationality}
                                        countryCode={getFlagCode(bout.fighters.red.nationality)}
                                        size="S"
                                        showCountryName={true}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="fight-card__vs">
                        <span className="fight-card__vs-text">VS</span>
                    </div>

                    {/* BLUE CORNER */}
                    <div className={`fight-card__fighter fight-card__fighter--blue ${isBlueSelected ? 'fight-card__fighter--selected' : ''} ${isDrawResult ? 'fight-card__fighter--draw' : ''} ${isBlueWinner ? 'fight-card__fighter--winner' : hasWinningCorner ? 'fight-card__fighter--loser' : ''}`}>
                        {isDrawResult ? (
                            <div className="fight-card__winner-badge fight-card__winner-badge--draw">
                                <span className="fight-card__winner-text">DRAW</span>
                            </div>
                        ) : isBlueWinner && (
                            <div className="fight-card__winner-badge">
                                <span className="fight-card__winner-icon">👑</span>
                                <span className="fight-card__winner-text">WINNER</span>
                            </div>
                        )}
                        <div className="fight-card__photo">
                            <img
                                src={getFighterImageUrl(bout.fighters.blue)}
                                alt={blueFighterName}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.currentTarget.src = '/placeholder-fighter.svg';
                                }}
                            />
                        </div>
                        <div className="fight-card__info">
                            <h3 className="fight-card__name">{blueFighterName}</h3>
                            <p className="fight-card__record">
                                {bout.fighters.blue.record_at_fight ?
                                    `${bout.fighters.blue.record_at_fight.wins}-${bout.fighters.blue.record_at_fight.losses}-${bout.fighters.blue.record_at_fight.draws}`
                                    : 'Rec N/A'}
                            </p>
                            <div className="fight-card__country">
                                {bout.fighters.blue.nationality && (
                                    <FlagBadge
                                        country={bout.fighters.blue.nationality}
                                        countryCode={getFlagCode(bout.fighters.blue.nationality)}
                                        size="S"
                                        showCountryName={true}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="fight-card__click-hint">
                    CLICK TO {hasPick ? 'EDIT PICK' : 'MAKE PICK'} →
                </div>
            </Link>
        );
    };

    // Extract UFC number from event name (e.g., "UFC 315" -> "315", "UFC Fight Night" -> "FN")
    const getEventNumber = (name: string): string => {
        const match = name.match(/UFC\s*(\d+)/i);
        if (match) return match[1];
        if (name.toLowerCase().includes('fight night')) return 'FN';
        return 'UFC';
    };

    return (
        <V2Layout>
            <NavBarV2 activePage="events" />

            <div className="main" style={{ paddingTop: '70px', paddingBottom: '100px' }}>
                {/* EVENT HERO - 2 COLUMN GRID MATCHING DESIGN-LAB */}
                <section className="event-hero">
                    {/* LEFT SIDE - Image with number watermark */}
                    <div 
                        className="event-hero__image"
                        style={{
                            backgroundImage: `url(${getEventImageUrl(event)})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        <span className="event-hero__image-text">{getEventNumber(event.name)}</span>
                        <span className={`event-hero__badge ${isExpired && event.status === 'scheduled' ? 'event-hero__badge--live' : event.picks_locked ? 'event-hero__badge--locked' : ''}`}
                            style={isExpired && event.status === 'scheduled' ? { background: '#dc2626', color: '#fff' } : undefined}>
                            {isExpired && event.status === 'scheduled'
                                ? 'LIVE NOW'
                                : event.picks_locked
                                    ? 'LOCKED'
                                    : event.status === 'scheduled'
                                        ? 'OPEN FOR PICKS'
                                        : event.status.toUpperCase()}
                        </span>
                    </div>
                    
                    {/* RIGHT SIDE - Content */}
                    <div className="event-hero__content">
                        <div className="event-hero__date">
                            {eventDateTime ? eventDateTime.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }).toUpperCase() : ''}
                            {event.start_time_et && ` // ${event.start_time_et} ET`}
                        </div>
                        <h1 className="event-hero__title">{event.name}</h1>
                        <p className="event-hero__location">
                            {event.location?.venue || 'Location TBD'}
                        </p>

                        {event.status === 'scheduled' && (
                            <div className="event-hero__countdown">
                                {isExpired ? (
                                    <>
                                        <div className="event-hero__countdown-label">EVENT IN PROGRESS</div>
                                        <div className="event-hero__countdown-time" style={{ color: '#dc2626' }}>
                                            LIVE NOW
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="event-hero__countdown-label">TIME UNTIL EVENT</div>
                                        <div className="event-hero__countdown-time">
                                            {formatted.days}D : {formatted.hours}H : {formatted.minutes}M : {formatted.seconds}S
                                        </div>
                                    </>
                                )}
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
                        <div className="fights-header__actions">
                            <button
                                type="button"
                                className={`fast-picks-toggle ${isFastPicksOpen ? 'fast-picks-toggle--active' : ''}`}
                                onClick={() => setIsFastPicksOpen((current) => !current)}
                                aria-expanded={isFastPicksOpen}
                            >
                                <span className="fast-picks-toggle__label">FAST PICKS</span>
                                <span className="fast-picks-toggle__state">
                                    {isFastPicksOpen ? 'HIDE FORM' : 'OPEN FORM'}
                                </span>
                            </button>
                            {picksMadeCount > 0 && (
                                <button
                                    onClick={handleExportPicks}
                                    className="export-picks-btn"
                                >
                                    EXPORT PICKS
                                </button>
                            )}
                            <div className="fights-header__progress"><span>{picksMadeCount}</span> / {totalFights} PICKS MADE</div>
                        </div>
                    </div>

                    {isFastPicksOpen && (
                        <FastPicksPanel
                            event={event}
                            bouts={bouts}
                            userPicks={userPicks}
                            onPicksSaved={refetchUserPicks}
                        />
                    )}

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
        <MobileNav activePage="events" />
        </V2Layout>
    );
};
