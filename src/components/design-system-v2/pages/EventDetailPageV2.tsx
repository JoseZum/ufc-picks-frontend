'use client';

import React from 'react';
import Link from 'next/link';
import { V2Layout } from '../V2Layout';
import { NavBarV2 } from '../NavBarV2';
import { MobileNav } from '../MobileNav';
import { useCurrentUser, useEvent, useEventBouts, useMyPicks } from '@/lib/hooks';
import {
    type Bout,
    getApiUrl,
    getAuthToken,
    getBoutResultLabel,
    getBoutResultOutcome,
    getEventDateTime,
    getEventImageUrl,
    getFighterDisplayName,
    hasBoutResult,
    getNormalizedFighterName,
    normalizeWeightClassLabel,
    lockBoutPicks,
    lockEventPicks,
    unlockBoutPicks,
    unlockEventPicks,
    updateEventTiming,
} from '@/lib/api';
import { Loader2, LockKeyhole, Save, Settings2, UnlockKeyhole } from 'lucide-react';
import { FighterImage } from '@/components/FighterImage';
import { FlagBadge } from '@/components/FlagBadge';
import { getFlagCode } from '@/lib/countryCodeMapping';
import { useCountdown } from '../hooks/useCountdown';
import { FastPicksPanel } from '../FastPicksPanel';
import { toast } from 'sonner';
import {
    CARD_SECTION_LABELS,
    CARD_SECTION_ORDER,
    formatSectionTime,
    getMostRecentlyLockedSection,
    getNextSectionLock,
    getSectionLockIso,
    getSectionStartIso,
    groupBoutsBySection,
    isoToLocalDateTimeInput,
    isBoutEffectivelyLocked,
    localDateTimeInputToUtcIso,
    shiftLocalDateTime,
} from '@/lib/eventTiming';

interface EventDetailPageV2Props {
    params: {
        id: string;
    }
}

export const EventDetailPageV2 = ({ params }: EventDetailPageV2Props) => {
    const eventId = parseInt(params.id, 10);

    const { data: event, isLoading: eventLoading, refetch: refetchEvent } = useEvent(eventId);
    const { data: bouts, isLoading: boutsLoading, refetch: refetchBouts } = useEventBouts(eventId);
    const { data: userPicks, refetch: refetchUserPicks } = useMyPicks(eventId);
    const { data: currentUser } = useCurrentUser();
    const [isFastPicksOpen, setIsFastPicksOpen] = React.useState(false);
    const [adminView, setAdminView] = React.useState(false);
    const [cardStartLocal, setCardStartLocal] = React.useState('');
    const [picksLockLocal, setPicksLockLocal] = React.useState('');
    const [adminBusy, setAdminBusy] = React.useState<string | null>(null);

    const eventDateTime = event ? getEventDateTime(event) : null;
    const nextSectionLock = event && bouts ? getNextSectionLock(event, bouts) : null;
    const mostRecentlyLockedSection =
        event && bouts ? getMostRecentlyLockedSection(event, bouts) : null;
    const { formatted } = useCountdown(nextSectionLock?.at ?? null);

    React.useEffect(() => {
        if (!event) return;
        const earliestSectionStart = Object.values(event.section_start_times_utc ?? {})
            .filter((value): value is string => !!value)
            .sort()[0];
        const earliestSectionLock = Object.values(event.section_lock_times_utc ?? {})
            .filter((value): value is string => !!value)
            .sort()[0];
        setCardStartLocal(
            isoToLocalDateTimeInput(event.card_start_time_utc ?? earliestSectionStart)
        );
        setPicksLockLocal(
            isoToLocalDateTimeInput(event.picks_lock_time_utc ?? earliestSectionLock)
        );
    }, [event]);

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

    const boutsBySection = groupBoutsBySection(bouts);

    const totalFights = bouts.length;
    const titleBouts = bouts.filter(b => b.is_title_fight).length;
    const picksMadeCount = userPicks?.length || 0;

    const refreshEventData = async () => {
        await Promise.all([refetchEvent(), refetchBouts()]);
    };

    const handleCardStartChange = (value: string) => {
        if (cardStartLocal && picksLockLocal) {
            const previous = new Date(cardStartLocal).getTime();
            const next = new Date(value).getTime();
            if (!Number.isNaN(previous) && !Number.isNaN(next)) {
                setPicksLockLocal(shiftLocalDateTime(picksLockLocal, next - previous));
            }
        }
        setCardStartLocal(value);
    };

    const handleSaveTiming = async () => {
        const cardStartUtc = localDateTimeInputToUtcIso(cardStartLocal);
        const picksLockUtc = localDateTimeInputToUtcIso(picksLockLocal);
        if (!cardStartUtc || !picksLockUtc) {
            toast.error('Choose valid card start and picks lock times.');
            return;
        }

        setAdminBusy('timing');
        try {
            await updateEventTiming(eventId, {
                card_start_time_utc: cardStartUtc,
                picks_lock_time_utc: picksLockUtc,
            });
            await refreshEventData();
            toast.success('Event timing updated.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not update event timing.');
        } finally {
            setAdminBusy(null);
        }
    };

    const handleToggleEventLock = async () => {
        const shouldUnlock =
            event.picks_lock_override === 'locked' ||
            bouts.every((bout) => isBoutEffectivelyLocked(event, bout));
        setAdminBusy('event');
        try {
            if (shouldUnlock) await unlockEventPicks(eventId);
            else await lockEventPicks(eventId);
            await refreshEventData();
            toast.success(shouldUnlock ? 'Full event unlocked.' : 'Full event locked.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not update event lock.');
        } finally {
            setAdminBusy(null);
        }
    };

    const handleToggleBoutLock = async (bout: Bout) => {
        const shouldUnlock = isBoutEffectivelyLocked(event, bout) && !hasBoutResult(bout.result);
        setAdminBusy(`bout-${bout.id}`);
        try {
            if (shouldUnlock) await unlockBoutPicks(bout.id);
            else await lockBoutPicks(bout.id);
            await refreshEventData();
            toast.success(shouldUnlock ? 'Fight picks unlocked.' : 'Fight picks locked.');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Could not update fight lock.');
        } finally {
            setAdminBusy(null);
        }
    };

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

    const renderBout = (bout: Bout, type: 'main' | 'co-main' | 'standard') => {
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
        const weightClass = normalizeWeightClassLabel(bout.weight_class);
        const isPicksLocked = isBoutEffectivelyLocked(event, bout);

        return (
            <div key={bout.id} className="fight-card-admin-wrap">
            <Link
                href={`/events/${eventId}/fights/${bout.id}`}
                className={`fight-card fight-card--clickable ${type === 'main' ? 'fight-card--main' : ''} ${bout.is_bmf_title_fight ? 'fight-card--bmf' : bout.is_title_fight ? 'fight-card--title' : ''} ${hasResult ? 'fight-card--completed' : ''} ${isPicksLocked ? 'fight-card--picks-locked' : ''}`}
            >
                <div className="fight-card__header">
                    <span className="fight-card__weight">{(bout.is_title_fight || bout.is_bmf_title_fight) && '★ '}{weightClass} {bout.is_bmf_title_fight ? 'BMF TITLE' : bout.is_title_fight ? 'TITLE' : 'BOUT'}</span>
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
                                <span className="fight-card__winner-text">W</span>
                            </div>
                        )}
                        <div className="fight-card__photo">
                            <FighterImage
                                fighter={bout.fighters.red}
                                alt={redFighterName}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom center' }}
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
                                <span className="fight-card__winner-text">W</span>
                            </div>
                        )}
                        <div className="fight-card__photo">
                            <FighterImage
                                fighter={bout.fighters.blue}
                                alt={blueFighterName}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'bottom center' }}
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
                    {isPicksLocked && !hasResult
                        ? 'PICKS LOCKED'
                        : `CLICK TO ${hasPick ? 'EDIT PICK' : 'MAKE PICK'} →`}
                </div>
            </Link>
            {adminView && currentUser?.is_admin && (
                <div className="bout-admin-control">
                    <div>
                        <strong>{isPicksLocked ? 'LOCKED' : 'OPEN'}</strong>
                        <span>{bout.picks_lock_reason?.replace(/_/g, ' ') || 'No active lock'}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleToggleBoutLock(bout)}
                        disabled={hasResult || adminBusy === `bout-${bout.id}`}
                    >
                        {adminBusy === `bout-${bout.id}` ? (
                            <Loader2 className="animate-spin" />
                        ) : isPicksLocked ? (
                            <UnlockKeyhole />
                        ) : (
                            <LockKeyhole />
                        )}
                        {hasResult ? 'RESULT FINAL' : isPicksLocked ? 'UNLOCK PICKS' : 'LOCK PICKS'}
                    </button>
                </div>
            )}
            </div>
        );
    };

    // Extract UFC number from event name (e.g., "UFC 315" -> "315", "UFC Fight Night" -> "FN")
    const getEventNumber = (name: string): string => {
        const match = name.match(/UFC\s*(\d+)/i);
        if (match) return match[1];
        if (name.toLowerCase().includes('fight night')) return 'FN';
        return 'UFC';
    };
    const displayEventDateTime = event.card_start_time_utc
        ? new Date(event.card_start_time_utc)
        : eventDateTime;
    const hasOpenPicks = bouts.some((bout) => !isBoutEffectivelyLocked(event, bout));
    const isCardStarted =
        !!event.card_start_time_utc &&
        new Date(event.card_start_time_utc).getTime() <= Date.now();
    const eventIsFullyLocked =
        event.picks_lock_override === 'locked' ||
        bouts.every((bout) => isBoutEffectivelyLocked(event, bout));
    const cardStartEt = formatSectionTime(
        localDateTimeInputToUtcIso(cardStartLocal),
        'en-US',
        'America/New_York'
    );
    const picksLockEt = formatSectionTime(
        localDateTimeInputToUtcIso(picksLockLocal),
        'en-US',
        'America/New_York'
    );

    return (
        <V2Layout>
            <NavBarV2 activePage="events" />

            <div className="main" style={{ paddingTop: '70px', paddingBottom: '100px' }}>
                {currentUser?.is_admin && (
                    <div className="admin-view-bar">
                        <div>
                            <Settings2 />
                            <span>ADMIN VIEW</span>
                            <small>{adminView ? 'Management controls visible' : 'Viewing exactly what users see'}</small>
                        </div>
                        <button
                            type="button"
                            className={adminView ? 'admin-view-toggle admin-view-toggle--on' : 'admin-view-toggle'}
                            onClick={() => setAdminView((current) => !current)}
                            aria-pressed={adminView}
                        >
                            {adminView ? 'ON' : 'OFF'}
                        </button>
                    </div>
                )}
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
                        <span className={`event-hero__badge ${isCardStarted && event.status === 'scheduled' ? 'event-hero__badge--live' : !hasOpenPicks ? 'event-hero__badge--locked' : ''}`}
                            style={isCardStarted && event.status === 'scheduled' ? { background: '#dc2626', color: '#fff' } : undefined}>
                            {isCardStarted && event.status === 'scheduled'
                                ? 'LIVE NOW'
                                : !hasOpenPicks
                                    ? 'LOCKED'
                                    : event.status === 'scheduled'
                                        ? 'OPEN FOR PICKS'
                                        : event.status.toUpperCase()}
                        </span>
                    </div>
                    
                    {/* RIGHT SIDE - Content */}
                    <div className="event-hero__content">
                        <div className="event-hero__date">
                            {displayEventDateTime ? displayEventDateTime.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }).toUpperCase() : ''}
                            {event.card_start_time_utc && ` // ${formatSectionTime(event.card_start_time_utc)}`}
                        </div>
                        <h1 className="event-hero__title">{event.name}</h1>
                        <p className="event-hero__location">
                            {event.location?.venue || 'Location TBD'}
                        </p>

                        {event.status === 'scheduled' && (
                            <div className="event-hero__countdown">
                                {!nextSectionLock ? (
                                    <>
                                        <div className="event-hero__countdown-label">
                                            {mostRecentlyLockedSection
                                                ? `${CARD_SECTION_LABELS[mostRecentlyLockedSection]} PICKS LOCKED`
                                                : 'PICKS LOCKED'}
                                        </div>
                                        <div className="event-hero__countdown-time" style={{ color: '#dc2626' }}>
                                            {hasOpenPicks ? 'MANUAL OVERRIDE ACTIVE' : 'LOCKED'}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="event-hero__countdown-label">
                                            {CARD_SECTION_LABELS[nextSectionLock.section]} PICKS LOCK IN
                                        </div>
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

                {adminView && currentUser?.is_admin && (
                    <section className="event-admin-panel" aria-label="Event administration">
                        <div className="event-admin-panel__heading">
                            <div>
                                <span className="event-admin-panel__eyebrow">ADMIN CONTROLS</span>
                                <h2>EVENT TIMING &amp; PICK LOCKS</h2>
                                <p>
                                    Times below use your browser timezone (
                                    {Intl.DateTimeFormat().resolvedOptions().timeZone}).
                                </p>
                            </div>
                            <button
                                type="button"
                                className={eventIsFullyLocked ? 'admin-lock-btn admin-lock-btn--unlock' : 'admin-lock-btn'}
                                onClick={handleToggleEventLock}
                                disabled={adminBusy === 'event'}
                            >
                                {adminBusy === 'event' ? (
                                    <Loader2 className="animate-spin" />
                                ) : eventIsFullyLocked ? (
                                    <UnlockKeyhole />
                                ) : (
                                    <LockKeyhole />
                                )}
                                {eventIsFullyLocked ? 'UNLOCK FULL EVENT' : 'LOCK FULL EVENT'}
                            </button>
                        </div>

                        <div className="event-admin-panel__form">
                            <label>
                                <span>CARD STARTS AT</span>
                                <input
                                    type="datetime-local"
                                    value={cardStartLocal}
                                    onChange={(inputEvent) => handleCardStartChange(inputEvent.target.value)}
                                />
                                <small>ET reference: {cardStartEt}</small>
                            </label>
                            <label>
                                <span>PICKS LOCK BASE TIME</span>
                                <input
                                    type="datetime-local"
                                    value={picksLockLocal}
                                    onChange={(inputEvent) => setPicksLockLocal(inputEvent.target.value)}
                                />
                                <small>ET reference: {picksLockEt}</small>
                            </label>
                            <button
                                type="button"
                                className="event-admin-panel__save"
                                onClick={handleSaveTiming}
                                disabled={adminBusy === 'timing'}
                            >
                                {adminBusy === 'timing' ? <Loader2 className="animate-spin" /> : <Save />}
                                SAVE TIMES
                            </button>
                        </div>
                        <p className="event-admin-panel__hint">
                            Moving card start shifts all section starts and locks. Moving the picks lock base
                            shifts lock times only. Scraped values remain protected after a manual edit.
                        </p>
                    </section>
                )}

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

                    {CARD_SECTION_ORDER.map((section) => {
                        const sectionBouts = boutsBySection[section];
                        if (sectionBouts.length === 0) return null;
                        const startIso = getSectionStartIso(event, section);
                        const lockIso = getSectionLockIso(event, section);
                        const lockDiffers = !!startIso && !!lockIso && startIso !== lockIso;
                        const sectionIsLocked = sectionBouts.every((bout) =>
                            isBoutEffectivelyLocked(event, bout)
                        );

                        return (
                            <div key={section} className={`fight-card-section fight-card-section--${section}`}>
                                <div className="card-divider">
                                    <div className="card-divider__line"></div>
                                    <div className="card-divider__identity">
                                        <span className="card-divider__text">
                                            {CARD_SECTION_LABELS[section]}
                                        </span>
                                        <span className="card-divider__time">
                                            START {formatSectionTime(startIso)}
                                            {' / '}
                                            {formatSectionTime(startIso, 'en-US', 'America/New_York')}
                                            {lockDiffers &&
                                                ` · PICKS LOCK ${formatSectionTime(lockIso)} / ${formatSectionTime(
                                                    lockIso,
                                                    'en-US',
                                                    'America/New_York'
                                                )}`}
                                        </span>
                                    </div>
                                    <span
                                        className={
                                            sectionIsLocked
                                                ? 'card-divider__status card-divider__status--locked'
                                                : 'card-divider__status'
                                        }
                                    >
                                        {sectionIsLocked ? 'PICKS LOCKED' : 'PICKS OPEN'}
                                    </span>
                                    <div className="card-divider__line"></div>
                                </div>
                                {sectionBouts.map((bout, index) =>
                                    renderBout(
                                        bout,
                                        section === 'main' && index === 0
                                            ? 'main'
                                            : section === 'main' && index === 1
                                              ? 'co-main'
                                              : 'standard'
                                    )
                                )}
                            </div>
                        );
                    })}

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
