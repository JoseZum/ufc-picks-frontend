'use client';

import React from 'react';
import { useEventBouts } from '@/lib/hooks';
import { getBoutResultOutcome, getFighterDisplayName, getNormalizedFighterName } from '@/lib/api';
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

                const pickedFighterName = (pick.picked_fighter_name || pick.predicted_winner || '').toLowerCase().trim();
                const redFighterName = getFighterDisplayName(bout.fighters.red);
                const blueFighterName = getFighterDisplayName(bout.fighters.blue);

                const isPicked1 = pickedFighterName === getNormalizedFighterName(bout.fighters.red);
                const isPicked2 = pickedFighterName === getNormalizedFighterName(bout.fighters.blue);
                const isCorrect = pick.is_correct === true;
                const isIncorrect = pick.is_correct === false;
                const isPendingPick = pick.is_correct === null;
                const isDrawResult = getBoutResultOutcome(bout.result) === 'draw';

                const pts = isCorrect && bout ? computePoints(pick, bout) : 0;
                const isPerfect = isCorrect && pts === 3;

                // Mi pick: método (DEC / KO/TKO / SUB) + round, y qué pasó realmente
                const normalizeMethod = (m: string | undefined) => {
                    if (!m) return '';
                    const u = m.toUpperCase();
                    if (['KO', 'TKO', 'KO/TKO'].includes(u)) return 'KO/TKO';
                    if (['SUB', 'SUBMISSION'].includes(u)) return 'SUB';
                    if (['DEC', 'DECISION'].includes(u)) return 'DEC';
                    return u;
                };
                const pickedMethod = normalizeMethod(pick.picked_method);
                const resultMethod = bout.result ? normalizeMethod(bout.result.method) : '';
                const pickedRound = pick.picked_round;
                const resultRound = bout.result?.round;
                const roundApplies = pickedMethod !== '' && pickedMethod !== 'DEC';
                const hasResult = !isPendingPick && !!bout.result;
                const methodHit = hasResult && isCorrect && !!resultMethod && pickedMethod === resultMethod;
                const roundHit = methodHit && roundApplies && !!pickedRound && !!resultRound && pickedRound === resultRound;
                // Flecha al resultado real sólo si mi call no fue exacto
                const showActual = hasResult && !!resultMethod &&
                    (!methodHit || (roundApplies && !!resultRound && pickedRound !== resultRound));
                const actualText = `${resultMethod}${resultMethod !== 'DEC' && resultRound ? ` RD${resultRound}` : ''}`;

                const rowClass = isPendingPick
                    ? 'pick-row pick-row--pending'
                    : isPerfect
                        ? 'pick-row pick-row--perfect'
                        : isCorrect
                            ? 'pick-row pick-row--correct'
                            : isDrawResult
                                ? 'pick-row pick-row--draw'
                                : 'pick-row pick-row--incorrect';

                return (
                    <div key={pick.id} className={rowClass}>
                        <div className={`pick-row__fighter pick-row__fighter--red ${isPicked1 ? 'pick-row__fighter--selected' : ''}`}>
                            {bout.fighters.red.profile_image_url && (
                                <FighterPhoto className="pick-row__photo" fighter={bout.fighters.red} />
                            )}
                            <div className="pick-row__info">
                                <div className="pick-row__name">{redFighterName.toUpperCase()}</div>
                                <div className="pick-row__record">
                                    {bout.fighters.red.record_at_fight
                                        ? `${bout.fighters.red.record_at_fight.wins}-${bout.fighters.red.record_at_fight.losses}-${bout.fighters.red.record_at_fight.draws}`
                                        : '-'}
                                </div>
                                {isPicked1 && <div className="pick-row__your-pick">YOUR PICK</div>}
                            </div>
                        </div>
                        <div className="pick-row__vs">VS</div>
                        <div className={`pick-row__fighter pick-row__fighter--blue ${isPicked2 ? 'pick-row__fighter--selected' : ''}`}>
                            {bout.fighters.blue.profile_image_url && (
                                <FighterPhoto className="pick-row__photo" fighter={bout.fighters.blue} />
                            )}
                            <div className="pick-row__info">
                                <div className="pick-row__name">{blueFighterName.toUpperCase()}</div>
                                <div className="pick-row__record">
                                    {bout.fighters.blue.record_at_fight
                                        ? `${bout.fighters.blue.record_at_fight.wins}-${bout.fighters.blue.record_at_fight.losses}-${bout.fighters.blue.record_at_fight.draws}`
                                        : '-'}
                                </div>
                                {isPicked2 && <div className="pick-row__your-pick">YOUR PICK</div>}
                            </div>
                        </div>
                        {/* MI CALL: round arriba, método en grande, flecha a lo que pasó */}
                        <div className="pick-row__call">
                            {roundApplies && pickedRound ? (
                                <div className={`pick-row__call-round ${roundHit ? 'pick-row__call-round--hit' : ''}`}>
                                    RD {pickedRound}
                                </div>
                            ) : null}
                            <div className={`pick-row__call-method ${methodHit ? 'pick-row__call-method--hit' : ''}`}>
                                {pickedMethod || '—'}
                            </div>
                            {showActual && (
                                <div className="pick-row__call-actual">→ {actualText}</div>
                            )}
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
