'use client';

import React from 'react';
import { useEventBouts } from '@/lib/hooks';
import { getBoutResultOutcome, getFighterDisplayName } from '@/lib/api';
import { FighterPhoto } from '@/components/FighterImage';
import { formatEventDate } from '@/lib/dateUtils';

// Calcula puntos basado en el pick y el resultado de la pelea.
// 1 punto por acertar el ganador, +1 por el método, +1 por el round (no aplica a decisión).
export function computePoints(pick: any, bout: any): number {
    if (pick.is_correct !== true || !bout?.result) return 0;

    let points = 1; // Acertó el ganador

    const normalize = (m: string | undefined) => {
        if (!m) return '';
        const u = m.toUpperCase();
        if (['KO', 'TKO', 'KO/TKO'].includes(u)) return 'KO/TKO';
        if (['SUB', 'SUBMISSION'].includes(u)) return 'SUB';
        if (['DEC', 'DECISION'].includes(u)) return 'DEC';
        return u;
    };

    const pickMethod = normalize(pick.picked_method);
    const resultMethod = normalize(bout.result.method);

    if (pickMethod && resultMethod && pickMethod === resultMethod) {
        points += 1;
        if (pickMethod !== 'DEC' && pick.picked_round && bout.result.round) {
            if (pick.picked_round === bout.result.round) {
                points += 1;
            }
        }
    }

    return points;
}

interface EventPicksSectionProps {
    event: any;
    picks: Array<{ pick: any; event: any }>;
}

/**
 * Renderiza los picks de un usuario para un evento concreto, con resultado y puntos.
 * Mismo estilo de "MY PICKS"; reutilizado en My Picks y en el perfil.
 */
export const EventPicksSection = ({ event, picks }: EventPicksSectionProps) => {
    const { data: bouts } = useEventBouts(event.id);

    const picksWithBouts = picks.map(p => ({
        ...p,
        bout: bouts?.find(b => b.id === p.pick.bout_id),
    }));

    const eventPicks = picksWithBouts.filter(p => p.bout);
    const decidedPicks = eventPicks.filter(p => p.pick.is_correct !== null);
    const correctPicks = decidedPicks.filter(p => p.pick.is_correct === true).length;
    const eventAccuracy = decidedPicks.length > 0
        ? Math.round((correctPicks / decidedPicks.length) * 100)
        : null;
    const isPending = event.status === 'scheduled';

    return (
        <div className="picks-event">
            <div className="picks-event__header">
                <div>
                    <h2 className="picks-event__title">{event.name}</h2>
                    <p className="picks-event__date">{formatEventDate(event)} {isPending && '// PENDING'}</p>
                </div>
                <div className="picks-event__score">
                    <div className="picks-event__score-value">
                        {isPending ? `${eventPicks.length}` : `${correctPicks}/${decidedPicks.length}`}
                    </div>
                    <div className="picks-event__score-label">
                        {isPending ? 'PICKS MADE' : eventAccuracy !== null ? `${eventAccuracy}% ACCURACY` : 'NO RESULTS'}
                    </div>
                </div>
            </div>

            {eventPicks.map(({ pick, bout }) => {
                if (!bout) return null;

                const redFighterName = getFighterDisplayName(bout.fighters.red);
                const blueFighterName = getFighterDisplayName(bout.fighters.blue);

                const isCorrect = pick.is_correct === true;
                const isIncorrect = pick.is_correct === false;
                const isPendingPick = pick.is_correct === null;
                const outcome = getBoutResultOutcome(bout.result);
                const isDrawResult = outcome === 'draw';

                const pts = isCorrect && bout ? computePoints(pick, bout) : 0;
                const isPerfect = isCorrect && pts === 3;

                // Se muestra SIEMPRE el resultado real de la pelea; el color
                // indica si el pick del usuario acertó (verde/amarillo) o no (rojo).
                const normalizeMethod = (m: string | undefined) => {
                    if (!m) return '';
                    const u = m.toUpperCase();
                    if (['KO', 'TKO', 'KO/TKO'].includes(u)) return 'KO/TKO';
                    if (['SUB', 'SUBMISSION'].includes(u)) return 'SUB';
                    if (['DEC', 'DECISION'].includes(u)) return 'DEC';
                    return u;
                };
                const resultMethod = bout.result ? normalizeMethod(bout.result.method) : '';
                const resultRound = bout.result?.round;
                const showRound = !!resultRound && resultMethod !== 'DEC';

                // Ganador real de la pelea: se resalta y el otro se atenúa
                const redState = outcome === 'red' ? 'winner' : outcome === 'blue' ? 'loser' : '';
                const blueState = outcome === 'blue' ? 'winner' : outcome === 'red' ? 'loser' : '';

                const state = isPendingPick
                    ? 'pending'
                    : isPerfect
                        ? 'perfect'
                        : isCorrect
                            ? 'correct'
                            : isDrawResult
                                ? 'draw'
                                : 'incorrect';
                const rowClass = `pick-row pick-row--${state}`;

                const photoProps = {
                    className: 'pick-row__photo',
                    backgroundPosition: 'bottom center',
                    style: { backgroundSize: 'contain', backgroundRepeat: 'no-repeat' as const },
                };

                return (
                    <div key={pick.id} className={rowClass}>
                        <div className={`pick-row__fighter pick-row__fighter--red ${redState ? `pick-row__fighter--${redState}` : ''}`}>
                            <div className="pick-row__photo-slot">
                                {bout.fighters.red.profile_image_url && (
                                    <FighterPhoto {...photoProps} fighter={bout.fighters.red} />
                                )}
                            </div>
                            <div className="pick-row__info">
                                <div className="pick-row__name">{redFighterName.toUpperCase()}</div>
                                <div className="pick-row__record">
                                    {bout.fighters.red.record_at_fight
                                        ? `${bout.fighters.red.record_at_fight.wins}-${bout.fighters.red.record_at_fight.losses}-${bout.fighters.red.record_at_fight.draws}`
                                        : '-'}
                                </div>
                            </div>
                        </div>
                        <div className="pick-row__vs">VS</div>
                        <div className={`pick-row__fighter pick-row__fighter--blue ${blueState ? `pick-row__fighter--${blueState}` : ''}`}>
                            <div className="pick-row__photo-slot">
                                {bout.fighters.blue.profile_image_url && (
                                    <FighterPhoto {...photoProps} fighter={bout.fighters.blue} />
                                )}
                            </div>
                            <div className="pick-row__info">
                                <div className="pick-row__name">{blueFighterName.toUpperCase()}</div>
                                <div className="pick-row__record">
                                    {bout.fighters.blue.record_at_fight
                                        ? `${bout.fighters.blue.record_at_fight.wins}-${bout.fighters.blue.record_at_fight.losses}-${bout.fighters.blue.record_at_fight.draws}`
                                        : '-'}
                                </div>
                            </div>
                        </div>
                        {/* RESULTADO REAL DE LA PELEA */}
                        <div className={`pick-row__outcome pick-row__outcome--${state}`}>
                            {showRound && <div className="pick-row__outcome-round">RD {resultRound}</div>}
                            <div className="pick-row__outcome-method">{resultMethod || '—'}</div>
                        </div>
                        <div className="pick-row__result">
                            {isPendingPick && (
                                <span className="pick-row__result-badge pick-row__result-badge--pending">PENDING</span>
                            )}
                            {isCorrect && (
                                <>
                                    <span className={`pick-row__result-badge ${isPerfect ? 'pick-row__result-badge--perfect' : 'pick-row__result-badge--correct'}`}>
                                        {isPerfect ? 'PERFECT' : 'CORRECT'}
                                    </span>
                                    <span className={`pick-row__points ${isPerfect ? 'pick-row__points--perfect' : 'pick-row__points--positive'}`}>+{pts}</span>
                                </>
                            )}
                            {isIncorrect && (
                                <>
                                    <span className={`pick-row__result-badge ${isDrawResult ? 'pick-row__result-badge--draw' : 'pick-row__result-badge--incorrect'}`}>WRONG</span>
                                    <span className={`pick-row__points ${isDrawResult ? 'pick-row__points--draw' : 'pick-row__points--negative'}`}>0</span>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
