'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { V2Layout } from '../V2Layout';
import { NavBarV2 } from '../NavBarV2';
import { MobileNav } from '../MobileNav';
import { useEvent, useEventBouts, useMyPicks, useCreatePick, useCurrentUser } from '@/lib/hooks';
import {
    type Fighter,
    getBoutResultHeadline,
    getBoutResultOutcome,
    getFighterDisplayName,
    getFighterShortName,
    getEventDateTime,
    hasBoutResult,
    getNormalizedFighterName
} from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { FighterPhoto } from '@/components/FighterImage';
import { FlagBadge } from '@/components/FlagBadge';
import { getFlagCode } from '@/lib/countryCodeMapping';
import { CARD_SECTION_LABELS, formatSectionTime, isBoutEffectivelyLocked, normalizeCardSection } from '@/lib/eventTiming';

interface FightPickPageV2Props {
    params: {
        id: string;
        fightId: string;
    }
}

export const FightPickPageV2 = ({ params }: FightPickPageV2Props) => {
    const router = useRouter();
    const eventId = parseInt(params.id, 10);
    const boutId = parseInt(params.fightId, 10);

    const { data: event, isLoading: eventLoading } = useEvent(eventId);
    const { data: bouts, isLoading: boutsLoading } = useEventBouts(eventId);
    const { data: userPicks, refetch: refetchPicks } = useMyPicks(eventId);
    const { data: currentUser } = useCurrentUser();
    const createPickMutation = useCreatePick();

    // Find the specific bout
    const bout = bouts?.find(b => b.id === boutId);
    const existingPick = userPicks?.find(p => p.bout_id === boutId);

    // Local state for pick flow
    const [selectedFighter, setSelectedFighter] = useState<'red' | 'blue' | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<'DEC' | 'KO/TKO' | 'SUB' | null>(null);
    const [selectedRound, setSelectedRound] = useState<number | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initialize from existing pick
    useEffect(() => {
        if (existingPick && bout) {
            // Convert picked_fighter_name back to corner for UI state
            const redName = getNormalizedFighterName(bout.fighters.red);
            const blueName = getNormalizedFighterName(bout.fighters.blue);
            const pickedName = existingPick.picked_fighter_name?.toLowerCase().trim() || '';

            // Explicitly check both corners
            let corner: 'red' | 'blue' | null = null;
            if (pickedName === redName) {
                corner = 'red';
            } else if (pickedName === blueName) {
                corner = 'blue';
            }

            if (corner) {
                setSelectedFighter(corner);
                setSelectedMethod((existingPick.picked_method as 'DEC' | 'KO/TKO' | 'SUB') || 'DEC');
                setSelectedRound(existingPick.picked_round || null);
                setShowSuccess(true);
            }
        }
    }, [existingPick, bout]);

    const handleSelectFighter = (corner: 'red' | 'blue') => {
        if (!event || !bout || isBoutEffectivelyLocked(event, bout) || hasFightResult) return;
        setSelectedFighter(corner);
        setCurrentStep(1);
        setShowSuccess(false);
    };

    const handleSelectMethod = (method: 'DEC' | 'KO/TKO' | 'SUB') => {
        setSelectedMethod(method);
        if (method === 'DEC') {
            setSelectedRound(null);
            setCurrentStep(3);
        } else {
            setCurrentStep(2);
        }
    };

    const handleSelectRound = (round: number) => {
        setSelectedRound(round);
        setCurrentStep(3);
    };

    const handleConfirmPick = async () => {
        if (!currentUser || !selectedFighter || !selectedMethod) {
            if (!currentUser) router.push('/auth');
            return;
        }
        if (!event || !bout || isBoutEffectivelyLocked(event, bout)) return;

        setSaving(true);
        try {
            // Get fighter name from selected corner
            const selectedFighterName = selectedFighter === 'red'
                ? getFighterDisplayName(bout?.fighters.red)
                : getFighterDisplayName(bout?.fighters.blue);

            await createPickMutation.mutateAsync({
                event_id: eventId,
                bout_id: boutId,
                picked_fighter_name: selectedFighterName || '',
                picked_method: selectedMethod,
                picked_round: selectedRound || undefined
            });
            await refetchPicks();
            setShowSuccess(true);
        } catch (err) {
            console.error('Failed to save pick', err);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setSelectedFighter(null);
        setSelectedMethod(null);
        setSelectedRound(null);
        setCurrentStep(0);
        setShowSuccess(false);
    };

    const goToStep = (step: number) => {
        setCurrentStep(step);
        setShowSuccess(false);
    };

    if (eventLoading || boutsLoading) {
        return (
            <V2Layout>
                <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 className="animate-spin" style={{ width: '40px', height: '40px' }} />
                </div>
            <MobileNav activePage="events" />
        </V2Layout>
        );
    }

    if (!event || !bout) {
        return (
            <V2Layout>
                <NavBarV2 activePage="events" />
                <div className="main" style={{ paddingTop: '100px', textAlign: 'center' }}>
                    <h1>Fight not found</h1>
                </div>
            <MobileNav activePage="events" />
        </V2Layout>
        );
    }

    const redFighter = bout.fighters.red;
    const blueFighter = bout.fighters.blue;
    const redFighterName = getFighterDisplayName(redFighter);
    const blueFighterName = getFighterDisplayName(blueFighter);
    const isLocked = isBoutEffectivelyLocked(event, bout);
    const cardSection = normalizeCardSection(bout.card_section);
    const resultOutcome = getBoutResultOutcome(bout.result);
    const hasFightResult = hasBoutResult(bout.result);
    const hasWinningCorner = resultOutcome === 'red' || resultOutcome === 'blue';
    const fightResultDetail = [
        bout.result?.method,
        bout.result?.round ? `Round ${bout.result.round}` : null,
        bout.result?.time ?? null
    ].filter(Boolean).join(' · ');

    const formatRecord = (record: any) => {
        if (!record || (record.wins === undefined && record.losses === undefined)) return null;
        const wins = record.wins ?? 0;
        const losses = record.losses ?? 0;
        const draws = record.draws ?? 0;
        return `${wins} - ${losses} - ${draws}`;
    };

    const getMaxPoints = () => {
        if (selectedMethod === 'DEC') return 2;
        return 3;
    };

    // Get weight class display
    const getWeightDisplay = () => {
        if (!bout.weight_class || bout.weight_class === 'Unknown') return null;
        return bout.weight_class;
    };

    const getAgeAtFightYears = (fighter: Fighter) => {
        if ((fighter.age_at_fight_years ?? 0) > 0) {
            return fighter.age_at_fight_years ?? null;
        }

        if ((fighter.age_at_fight?.years ?? 0) > 0) {
            return fighter.age_at_fight?.years ?? null;
        }

        return null;
    };

    return (
        <V2Layout>
            <NavBarV2 activePage="events" />

            <main className="main" style={{ paddingTop: '70px', paddingBottom: '120px' }}>
                {/* FIGHT HEADER */}
                <header className="fight-header">
                    <div className="fight-header__info">
                        <div className="fight-header__event">
                            {event.name}
                        </div>
                        <div className="fight-header__meta">
                            {bout.weight_class && bout.weight_class !== 'Unknown' && (
                                <span className="fight-header__meta-item">{bout.weight_class}</span>
                            )}
                            <span className="fight-header__meta-item">{bout.rounds_scheduled} ROUNDS</span>
                            <span className="fight-header__meta-item">
                                {getEventDateTime(event).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <a href={`/events/${eventId}`} className="fight-header__back">← BACK TO CARD</a>
                </header>

                {/* FIGHTERS CONTAINER */}
                <div className="fighters-container">
                    {/* RED CORNER */}
                    <div
                        className={`fighter-card fighter-card--red ${selectedFighter === 'red' ? 'fighter-card--selected' : ''} ${resultOutcome === 'red' ? 'fighter-card--winner' : ''} ${hasWinningCorner && resultOutcome !== 'red' ? 'fighter-card--loser' : ''}`}
                        onClick={() => !isLocked && !hasFightResult && handleSelectFighter('red')}
                        style={{ cursor: isLocked || hasFightResult ? 'default' : 'pointer' }}
                    >
                        <span className="fighter-card__corner">RED CORNER</span>
                        <div className="fighter-card__content">
                            <FighterPhoto
                                className="fighter-card__photo"
                                fighter={redFighter}
                                backgroundPosition="top center"
                            >
                                {redFighter.ranking?.position && (
                                    <span className="fighter-card__rank">#{redFighter.ranking.position}</span>
                                )}
                            </FighterPhoto>
                            <h2 className="fighter-card__name">{redFighterName}</h2>
                            {formatRecord(redFighter.record_at_fight) ? (
                                <p className="fighter-card__record">{formatRecord(redFighter.record_at_fight)}</p>
                            ) : null}
                            <div className="fighter-card__country">
                                <FlagBadge
                                    country={redFighter.nationality || 'Unknown'}
                                    countryCode={getFlagCode(redFighter.nationality)}
                                    size="S"
                                    showCountryName={true}
                                />
                            </div>

                            <div className="fighter-card__stats">
                                {redFighter.height && (
                                    <div className="stat">
                                        <div className="stat__label">HEIGHT</div>
                                        <div className="stat__value">
                                            {redFighter.height.feet && redFighter.height.inches
                                                ? `${redFighter.height.feet}'${redFighter.height.inches}" (${redFighter.height.cm}cm)`
                                                : redFighter.height_cm ? `${redFighter.height_cm}cm` : '-'}
                                        </div>
                                    </div>
                                )}
                                {redFighter.reach && (
                                    <div className="stat">
                                        <div className="stat__label">REACH</div>
                                        <div className="stat__value">
                                            {redFighter.reach.inches
                                                ? `${redFighter.reach.inches}" (${redFighter.reach.cm}cm)`
                                                : redFighter.reach_cm ? `${redFighter.reach_cm}cm` : '-'}
                                        </div>
                                    </div>
                                )}
                                <div className="stat">
                                    <div className="stat__label">AGE</div>
                                    <div className="stat__value">{getAgeAtFightYears(redFighter) ?? '--'}</div>
                                </div>
                                {(redFighter.latest_weight?.lbs || getWeightDisplay()) && (
                                    <div className="stat">
                                        <div className="stat__label">WEIGHT</div>
                                        <div className="stat__value">
                                            {redFighter.latest_weight?.lbs
                                                ? `${Math.round(redFighter.latest_weight.lbs)} lbs`
                                                : getWeightDisplay()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {redFighter.last_5_fights && redFighter.last_5_fights.length > 0 && (
                                <div className="fighter-card__last5">
                                    <div className="fighter-card__last5-label">LAST 5 FIGHTS</div>
                                    <div className="fighter-card__last5-results">
                                        {redFighter.last_5_fights.slice(0, 5).map((result: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className={`last5-badge ${result === 'W' ? 'last5-badge--win' : 'last5-badge--loss'}`}
                                            >
                                                {result}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {resultOutcome === 'red' ? (
                                <div className="fighter-card__result-badge fighter-card__result-badge--win">
                                    WINNER
                                </div>
                            ) : !hasFightResult && !isLocked && (
                                <button
                                    className="fighter-card__pick-btn"
                                    onClick={(e) => { e.stopPropagation(); handleSelectFighter('red'); }}
                                >
                                    PICK {getFighterShortName(redFighter)}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* VS DIVIDER */}
                    <div className="vs-divider">
                        <span className="vs-divider__text">VS</span>
                        <span className="vs-divider__rounds">{bout.rounds_scheduled} RDS</span>
                    </div>

                    {/* BLUE CORNER */}
                    <div
                        className={`fighter-card fighter-card--blue ${selectedFighter === 'blue' ? 'fighter-card--selected' : ''} ${resultOutcome === 'blue' ? 'fighter-card--winner' : ''} ${hasWinningCorner && resultOutcome !== 'blue' ? 'fighter-card--loser' : ''}`}
                        onClick={() => !isLocked && !hasFightResult && handleSelectFighter('blue')}
                        style={{ cursor: isLocked || hasFightResult ? 'default' : 'pointer' }}
                    >
                        <span className="fighter-card__corner">BLUE CORNER</span>
                        <div className="fighter-card__content">
                            <FighterPhoto
                                className="fighter-card__photo"
                                fighter={blueFighter}
                                backgroundPosition="top center"
                            >
                                {blueFighter.ranking?.position && (
                                    <span className="fighter-card__rank">#{blueFighter.ranking.position}</span>
                                )}
                            </FighterPhoto>
                            <h2 className="fighter-card__name">{blueFighterName}</h2>
                            {formatRecord(blueFighter.record_at_fight) ? (
                                <p className="fighter-card__record">{formatRecord(blueFighter.record_at_fight)}</p>
                            ) : null}
                            <div className="fighter-card__country">
                                <FlagBadge
                                    country={blueFighter.nationality || 'Unknown'}
                                    countryCode={getFlagCode(blueFighter.nationality)}
                                    size="S"
                                    showCountryName={true}
                                />
                            </div>

                            <div className="fighter-card__stats">
                                {blueFighter.height && (
                                    <div className="stat">
                                        <div className="stat__label">HEIGHT</div>
                                        <div className="stat__value">
                                            {blueFighter.height.feet && blueFighter.height.inches
                                                ? `${blueFighter.height.feet}'${blueFighter.height.inches}" (${blueFighter.height.cm}cm)`
                                                : blueFighter.height_cm ? `${blueFighter.height_cm}cm` : '-'}
                                        </div>
                                    </div>
                                )}
                                {blueFighter.reach && (
                                    <div className="stat">
                                        <div className="stat__label">REACH</div>
                                        <div className="stat__value">
                                            {blueFighter.reach.inches
                                                ? `${blueFighter.reach.inches}" (${blueFighter.reach.cm}cm)`
                                                : blueFighter.reach_cm ? `${blueFighter.reach_cm}cm` : '-'}
                                        </div>
                                    </div>
                                )}
                                <div className="stat">
                                    <div className="stat__label">AGE</div>
                                    <div className="stat__value">{getAgeAtFightYears(blueFighter) ?? '--'}</div>
                                </div>
                                {(blueFighter.latest_weight?.lbs || getWeightDisplay()) && (
                                    <div className="stat">
                                        <div className="stat__label">WEIGHT</div>
                                        <div className="stat__value">
                                            {blueFighter.latest_weight?.lbs
                                                ? `${Math.round(blueFighter.latest_weight.lbs)} lbs`
                                                : getWeightDisplay()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {blueFighter.last_5_fights && blueFighter.last_5_fights.length > 0 && (
                                <div className="fighter-card__last5">
                                    <div className="fighter-card__last5-label">LAST 5 FIGHTS</div>
                                    <div className="fighter-card__last5-results">
                                        {blueFighter.last_5_fights.slice(0, 5).map((result: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className={`last5-badge ${result === 'W' ? 'last5-badge--win' : 'last5-badge--loss'}`}
                                            >
                                                {result}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {resultOutcome === 'blue' ? (
                                <div className="fighter-card__result-badge fighter-card__result-badge--win">
                                    WINNER
                                </div>
                            ) : !hasFightResult && !isLocked && (
                                <button
                                    className="fighter-card__pick-btn"
                                    onClick={(e) => { e.stopPropagation(); handleSelectFighter('blue'); }}
                                >
                                    PICK {getFighterShortName(blueFighter)}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* RESULT BANNER */}
                {hasFightResult && (
                    <div className="fight-result-banner">
                        <div className="fight-result-banner__label">FIGHT RESULT</div>
                        <div className="fight-result-banner__winner">
                            {getBoutResultHeadline(bout.result, redFighterName, blueFighterName)}
                        </div>
                        <div className="fight-result-banner__detail">{fightResultDetail}</div>
                    </div>
                )}

                {/* PICK FLOW PANEL */}
                {!isLocked && !hasFightResult && (currentStep > 0 || showSuccess) && (
                    <div className={`pick-panel pick-panel--active`}>
                        <div className="pick-panel__content">
                            {/* STEP INDICATOR */}
                            <div className="step-indicator">
                                <div className={`step-indicator__step ${currentStep >= 1 ? 'step-indicator__step--complete' : ''} ${currentStep === 1 ? 'step-indicator__step--active' : ''}`}></div>
                                <div className={`step-indicator__step ${currentStep >= 2 ? 'step-indicator__step--complete' : ''} ${currentStep === 2 ? 'step-indicator__step--active' : ''}`}></div>
                                <div className={`step-indicator__step ${currentStep >= 3 || showSuccess ? 'step-indicator__step--complete' : ''} ${currentStep === 3 ? 'step-indicator__step--active' : ''}`}></div>
                            </div>

                            {/* STEP 1: METHOD SELECTION */}
                            {currentStep === 1 && !showSuccess && (
                                <div className="pick-step pick-step--active">
                                    <div className="pick-step__header">
                                        <h3 className="pick-step__title">STEP 2: SELECT METHOD</h3>
                                        <span className="pick-step__change" onClick={handleReset}>CHANGE FIGHTER</span>
                                    </div>
                                    <div className="method-grid">
                                        <div className={`method-btn ${selectedMethod === 'DEC' ? 'method-btn--selected' : ''}`} onClick={() => handleSelectMethod('DEC')}>
                                            <div className="method-btn__abbr">DEC</div>
                                            <div className="method-btn__label">DECISION</div>
                                        </div>
                                        <div className={`method-btn ${selectedMethod === 'KO/TKO' ? 'method-btn--selected' : ''}`} onClick={() => handleSelectMethod('KO/TKO')}>
                                            <div className="method-btn__abbr">KO/TKO</div>
                                            <div className="method-btn__label">KNOCKOUT</div>
                                        </div>
                                        <div className={`method-btn ${selectedMethod === 'SUB' ? 'method-btn--selected' : ''}`} onClick={() => handleSelectMethod('SUB')}>
                                            <div className="method-btn__abbr">SUB</div>
                                            <div className="method-btn__label">SUBMISSION</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: ROUND SELECTION */}
                            {currentStep === 2 && !showSuccess && (
                                <div className="pick-step pick-step--active">
                                    <div className="pick-step__header">
                                        <h3 className="pick-step__title">STEP 3: SELECT ROUND</h3>
                                        <span className="pick-step__change" onClick={() => goToStep(1)}>CHANGE METHOD</span>
                                    </div>
                                    <div className="round-grid">
                                        {Array.from({ length: bout.rounds_scheduled || 3 }, (_, i) => i + 1).map(round => (
                                            <div 
                                                key={round}
                                                className={`round-btn ${selectedRound === round ? 'round-btn--selected' : ''}`}
                                                onClick={() => handleSelectRound(round)}
                                            >
                                                <span className="round-btn__text">R{round}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: CONFIRM */}
                            {currentStep === 3 && !showSuccess && (
                                <div className="pick-step pick-step--active">
                                    <div className="confirm-panel">
                                        <div className="confirm-panel__preview">
                                            <span className="confirm-panel__fighter">
                                                {selectedFighter === 'red' ? redFighterName : blueFighterName}
                                            </span>
                                            <div className="confirm-panel__details">
                                                <span className="confirm-panel__badge">
                                                    {selectedMethod === 'DEC' ? 'DECISION' : selectedMethod === 'KO/TKO' ? 'KO/TKO' : 'SUBMISSION'}
                                                </span>
                                                {selectedRound && (
                                                    <span className="confirm-panel__badge">ROUND {selectedRound}</span>
                                                )}
                                            </div>
                                            <div className="confirm-panel__points">
                                                <span className="confirm-panel__points-value">{getMaxPoints()}</span>
                                                <span className="confirm-panel__points-label">MAX PTS</span>
                                            </div>
                                        </div>
                                        <div className="confirm-panel__actions">
                                            <button className="btn btn--secondary" onClick={handleReset}>RESET</button>
                                            <button className="btn btn--primary" onClick={handleConfirmPick} disabled={saving}>
                                                {saving ? 'SAVING...' : 'CONFIRM PICK'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SUCCESS STATE */}
                            {showSuccess && (
                                <div className="pick-success pick-success--active">
                                    <div className="pick-success__icon">✓</div>
                                    <div className="pick-success__title">PICK SAVED!</div>
                                    <div className="pick-success__details">
                                        {selectedFighter === 'red' ? redFighterName : blueFighterName} by {selectedMethod === 'DEC' ? 'DECISION' : selectedMethod === 'KO/TKO' ? 'KO/TKO' : 'SUBMISSION'}
                                        {selectedRound && ` in Round ${selectedRound}`}
                                    </div>
                                    <span className="pick-success__edit" onClick={handleReset}>EDIT PICK</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isLocked && !hasFightResult && (
                    <div className="pick-panel pick-panel--active" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="pick-panel__content" style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{ fontSize: '1.2rem', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '2px' }}>
                                PICKS LOCKED
                                {bout.picks_lock_reason
                                    ? ` · ${bout.picks_lock_reason.replace(/_/g, ' ').toUpperCase()}`
                                    : ''}
                                {bout.automatic_lock_time_utc
                                    ? ` · ${CARD_SECTION_LABELS[cardSection]} ${formatSectionTime(bout.automatic_lock_time_utc)}`
                                    : ''}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        <MobileNav activePage="events" />
        </V2Layout>
    );
};
