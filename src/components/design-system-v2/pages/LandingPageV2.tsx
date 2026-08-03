'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { V2Layout } from '../V2Layout';
import { UserTapeCard } from '../UserTapeCard';
import { NavBarV2 } from '../NavBarV2';
import { MobileNav } from '../MobileNav';
import { useCountdown } from '../hooks/useCountdown';
import { useEvents, useGlobalLeaderboard, useEventBouts, useCurrentUser, useMyLeaderboardPosition } from '@/lib/hooks';
import { getFighterDisplayName, getEventImageUrl, getEventDateTime, type Bout } from '@/lib/api';
import { FighterImage } from '@/components/FighterImage';
import { Loader2 } from 'lucide-react';
import { FlagBadge } from '@/components/FlagBadge';
import { getFlagCode } from '@/lib/countryCodeMapping';
import { isEventStillVisible, getDaysUntilEvent } from '@/lib/dateUtils';
import { HomeMissionsSection } from '@/features/missions/surfaces/home-missions-section';

// Tarjeta VS estilo "split diagonal" (fight poster). Reutilizada para el main
// event y el co-main (este último sólo en la home cuando es pelea de título).
const EventVsCard = ({ bout, label, eventId }: { bout: Bout; label: string; eventId?: number }) => {
    const red = bout.fighters.red;
    const blue = bout.fighters.blue;
    const redName = getFighterDisplayName(red);
    const blueName = getFighterDisplayName(blue);

    // BMF (plateado) tiene prioridad sobre título normal (dorado)
    const variant = bout.is_bmf_title_fight ? 'bmf' : bout.is_title_fight ? 'title' : null;
    const variantClass = variant === 'bmf' ? 'split--bmf' : variant === 'title' ? 'split--title' : '';
    const fightLabel = variant === 'bmf' ? 'BMF Title Fight' : variant === 'title' ? 'Title Fight' : 'Bout';

    const formatRecord = (f: typeof red) =>
        f.record_at_fight
            ? `${f.record_at_fight.wins} – ${f.record_at_fight.losses} – ${f.record_at_fight.draws}`
            : 'Record N/A';

    // Nombre siempre en dos líneas: nombre arriba, apellido(s) abajo
    const splitFighterName = (name: string) => {
        const idx = name.indexOf(' ');
        if (idx === -1) return name;
        return (<>{name.slice(0, idx)}<br />{name.slice(idx + 1)}</>);
    };

    return (
        <section className={`split-block ${variant ? `split-block--${variant}` : ''}`}>
            <div className="split-block__header">
                <h2 className="split-block__title">{label}</h2>
                {eventId && <a href={`/events/${eventId}`} className="split-block__link">FULL CARD →</a>}
            </div>
            <div className={`split ${variantClass}`}>
                {/* el body agrupa sólo a los peleadores: el VS y la diagonal
                    se centran respecto a ellos, sin contar el ribbon */}
                <div className="split__body">
                    <div className="split__line" aria-hidden="true"></div>
                    <div className="split__vs" aria-hidden="true">VS</div>

                    <div className="split__side split__side--red">
                        {/* headshot en columna propia: nunca se superpone al texto */}
                        <div className="split__photo" aria-hidden="true">
                            <FighterImage fighter={red} alt="" size="medium" />
                        </div>
                        <div className="split__info">
                        <span className="split__tag">Red Corner</span>
                        <div className="split__name">
                            {/* línea de apodo siempre presente para alinear ambos nombres */}
                            <small className="split__nick">{red.nickname ? `"${red.nickname}"` : ' '}</small>
                            {splitFighterName(redName)}
                        </div>
                        <div className="split__record">{formatRecord(red)}</div>
                        <div className="split__country">
                            <FlagBadge
                                country={red.nationality || 'Unknown'}
                                countryCode={getFlagCode(red.nationality)}
                                size="S"
                                showCountryName={true}
                            />
                        </div>
                        </div>
                    </div>

                    <div className="split__side split__side--blue">
                        <div className="split__photo" aria-hidden="true">
                            <FighterImage fighter={blue} alt="" size="medium" />
                        </div>
                        <div className="split__info">
                        <span className="split__tag">Blue Corner</span>
                        <div className="split__name">
                            <small className="split__nick">{blue.nickname ? `"${blue.nickname}"` : ' '}</small>
                            {splitFighterName(blueName)}
                        </div>
                        <div className="split__record">{formatRecord(blue)}</div>
                        <div className="split__country">
                            <FlagBadge
                                country={blue.nationality || 'Unknown'}
                                countryCode={getFlagCode(blue.nationality)}
                                size="S"
                                showCountryName={true}
                            />
                        </div>
                        </div>
                    </div>
                </div>

                <div className="split__ribbon">
                    <span><b>{variant && '★ '}{bout.weight_class} {fightLabel}</b></span>
                    <span>{bout.rounds_scheduled ? `${bout.rounds_scheduled} Rounds` : ''}</span>
                </div>
            </div>
        </section>
    );
};

// Divide el nombre del evento en dos líneas y resalta al primer peleador en
// rojo: "UFC Fight Night: Medic vs Rodriguez" → UFC FIGHT NIGHT / *MEDIC* VS RODRIGUEZ
const renderEventTitle = (name: string) => {
    const [main, ...rest] = name.split(':');
    const sub = rest.join(':').trim();
    const line = sub || main.trim();
    const vsMatch = line.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
    const styledLine = vsMatch
        ? (<><em>{vsMatch[1].trim()}</em> VS {vsMatch[2].trim()}</>)
        : line;
    return sub ? (<>{main.trim()}<br />{styledLine}</>) : styledLine;
};

export const LandingPageV2 = () => {
    const router = useRouter();
    // Clicking a predictor opens their card here rather than navigating away:
    // you are usually mid-scroll on Home and do not want to lose your place.
    const [tapeUserId, setTapeUserId] = React.useState<string | null>(null);

    // 1. Get Next Event
    const { data: eventsData, isLoading: eventsLoading } = useEvents({
        status: 'scheduled',
        limit: 10
    });
    // Filtrar: visible hasta medianoche CR, y ocultar eventos lejanos (>30 días) sin subtítulo
    const nextEvent = eventsData?.events?.find(e => {
        if (!isEventStillVisible(e)) return false;
        if (getDaysUntilEvent(e) > 30 && !e.name.includes(':')) return false;
        return true;
    });

    // 2. Get Main Event Bout (y el co-main, que va ordenado en el índice 1)
    const { data: bouts } = useEventBouts(nextEvent?.id || 0);
    const mainEventBout = bouts?.[0];
    const coMainBout = bouts?.[1];

    // 3. Get Leaderboard
    const { data: leaderboard, isLoading: leaderboardLoading } = useGlobalLeaderboard({
        limit: 5
    });

    // 4. Get User Stats
    const { data: currentUser } = useCurrentUser();
    const { data: myPosition } = useMyLeaderboardPosition('global');

    // Countdown timer - use proper datetime with ET timezone
    const eventDate = nextEvent ? getEventDateTime(nextEvent) : null;
    const { formatted, isExpired } = useCountdown(eventDate);

    // Format date and venue
    const formatEventDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        }).toUpperCase();
    };

    return (
        <V2Layout>
            <NavBarV2 activePage="home" />

            <main className="main">
                {/* HERO SECTION - BROKEN GRID */}
                <section className="hero">
                    <div className="hero__event">
                        <div className={`hero__event-image ${nextEvent ? 'hero__event-image--loaded' : ''}`} style={{
                            backgroundImage: nextEvent ? `url(${getEventImageUrl(nextEvent)})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}>
                            {eventsLoading && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    <Loader2 className="animate-spin" style={{ width: '40px', height: '40px' }} />
                                </div>
                            )}
                            <span className={`hero__event-badge ${isExpired || nextEvent?.picks_locked ? 'hero__event-badge--locked' : ''}`}>
                                {isExpired || nextEvent?.picks_locked ? 'LOCKED' : 'OPEN FOR PICKS'}
                            </span>
                            {/* título + fecha superpuestos sobre el póster, como en UFC.com */}
                            {nextEvent && (
                                <div className="hero__event-overlay">
                                    <h1 className="hero__event-title">{renderEventTitle(nextEvent.name)}</h1>
                                    <p className="hero__event-sub">
                                        {formatEventDate(nextEvent.date)} // {nextEvent.location?.venue || 'VENUE TBA'}
                                    </p>
                                </div>
                            )}
                        </div>
                        {!nextEvent && (
                            <div className="hero__event-content">
                                <h1 className="hero__event-title">No Upcoming Events</h1>
                            </div>
                        )}
                    </div>

                    <div className="hero__stats">
                        <div className="hero__stats-title">EVENT STATS</div>
                        <div className="hero__stats-grid">
                            <div className="hero__stat">
                                <div className="hero__stat-value">{nextEvent?.total_bouts || 0}</div>
                                <div className="hero__stat-label">TOTAL FIGHTS</div>
                            </div>
                            <div className="hero__stat">
                                <div className="hero__stat-value">{bouts?.filter(b => b.is_title_fight).length || 0}</div>
                                <div className="hero__stat-label">TITLE FIGHTS</div>
                            </div>
                        </div>
                    </div>

                    {/* FLIP CLOCK - countdown estilo HUD (el key remonta el
                        dígito en cada cambio y dispara la animación de flip) */}
                    <div className="hero__clock">
                        <div className="clock" role="timer" aria-label="Time until event">
                            <div className="clock__cell">
                                <div className="clock__value" key={`d${formatted.days}`}>{formatted.days}</div>
                                <div className="clock__unit">Days</div>
                            </div>
                            <div className="clock__cell">
                                <div className="clock__value" key={`h${formatted.hours}`}>{formatted.hours}</div>
                                <div className="clock__unit">Hours</div>
                            </div>
                            <div className="clock__cell">
                                <div className="clock__value" key={`m${formatted.minutes}`}>{formatted.minutes}</div>
                                <div className="clock__unit">Min</div>
                            </div>
                            <div className="clock__cell">
                                <div className="clock__value" key={`s${formatted.seconds}`}>{formatted.seconds}</div>
                                <div className="clock__unit">Sec</div>
                            </div>
                        </div>
                    </div>

                    {currentUser ? (
                        <a href={nextEvent ? `/events/${nextEvent.id}` : '#'} className="hero__action glitch">
                            <span className="hero__action-text">MAKE YOUR PICKS</span>
                            <span className="hero__action-arrow">→</span>
                        </a>
                    ) : (
                        <a href="/auth" className="hero__action hero__action--login glitch">
                            <span className="hero__action-text">SIGN IN TO PICK</span>
                            <span className="hero__action-arrow">→</span>
                        </a>
                    )}
                </section>

                {/* MAIN EVENT - SPLIT DIAGONAL VS CARD */}
                {mainEventBout && <EventVsCard bout={mainEventBout} label="Main Event" eventId={nextEvent?.id} />}

                {/* CO-MAIN: sólo se muestra en la home si es pelea de título (normal o BMF) */}
                {(coMainBout?.is_title_fight || coMainBout?.is_bmf_title_fight) &&
                    <EventVsCard bout={coMainBout} label="Co-Main Event" />}

                {/* USER STATS - CINEMATIC CARDS (esquina recortada + número fantasma) */}
                <section className="stats-section">
                    <h2 className="stats-section__title">YOUR STATS</h2>
                    <div className="stats-grid stats-grid--cine">
                        <div className="stat-card stat-card--cine" data-num="01">
                            <div className="stat-card__label">PICKS MADE</div>
                            <div className="stat-card__value">{currentUser?.picks_total || 0}</div>
                        </div>
                        <div className="stat-card stat-card--cine" data-num="02">
                            <div className="stat-card__label">GLOBAL RANK</div>
                            <div className="stat-card__value">#{myPosition?.rank || '-'}</div>
                        </div>
                        <div className="stat-card stat-card--cine" data-num="03">
                            <div className="stat-card__label">ACCURACY</div>
                            <div className="stat-card__value">
                                {currentUser?.picks_total ? Math.round((currentUser.picks_correct || 0) / currentUser.picks_total * 100) : 0}
                                <span className="stat-card__suffix">%</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* LEADERBOARD - RAW TABLE */}
                <section className="leaderboard">
                    <div className="leaderboard__header">
                        <h2 className="leaderboard__title">TOP PREDICTORS</h2>
                        <a href="/leaderboards" className="leaderboard__link">VIEW ALL →</a>
                    </div>
                    <table className="leaderboard__table">
                        <tbody>
                            {leaderboardLoading ? (
                                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>Loading Leaderboard...</td></tr>
                            ) : (leaderboard || []).map((user, index) => (
                                <tr
                                    key={user.user_id}
                                    className={`leaderboard__row ${index === 0 ? 'leaderboard__row--highlight' : ''}`}
                                    onClick={() => setTapeUserId(user.user_id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td className={`leaderboard__cell leaderboard__rank leaderboard__rank--${index + 1}`}>
                                        {String(user.rank).padStart(2, '0')}
                                    </td>
                                    <td className="leaderboard__cell">
                                        <div className="leaderboard__user">
                                            <div className="leaderboard__avatar" style={{
                                                backgroundImage: `url(${user.avatar_url || ''})`,
                                                backgroundSize: 'cover',
                                                backgroundColor: 'var(--bg-elevated)'
                                            }}>
                                                {!user.avatar_url && user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="leaderboard__name">{user.username}</span>
                                        </div>
                                    </td>
                                    <td className="leaderboard__cell leaderboard__points">{user.total_points}</td>
                                    <td className="leaderboard__cell leaderboard__accuracy">
                                        {user.picks_total ? Math.round(user.picks_correct / user.picks_total * 100) : 0}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* MISSIONS - additive block, same V2 language */}
                <HomeMissionsSection eventId={nextEvent?.id} />

                {/* FOOTER - EXPOSED STRUCTURE */}
                <footer className="footer">
                    <div className="footer__grid">
                        <div className="footer__block">
                            <div className="footer__label">System Status</div>
                            <div className="footer__text mono">ALL SYSTEMS OPERATIONAL</div>
                        </div>
                        <div className="footer__block">
                            <div className="footer__label">Version</div>
                            <div className="footer__text mono">V3.0.0</div>
                        </div>
                        <div className="footer__block">
                            <div className="footer__label">Legal</div>
                            <div className="footer__text">TERMS // PRIVACY</div>
                        </div>
                        <div className="footer__block">
                            <div className="footer__label">Contact</div>
                            <div className="footer__text">JOSEZUMBRU@GMAIL.COM</div>
                        </div>
                    </div>
                </footer>
            </main>
            <MobileNav activePage="home" />
            <UserTapeCard userId={tapeUserId} onClose={() => setTapeUserId(null)} />
        </V2Layout>
    );
};
