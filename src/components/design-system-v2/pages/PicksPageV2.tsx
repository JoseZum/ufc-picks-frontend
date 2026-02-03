import React from 'react';
import { V2Layout } from '../V2Layout';

export const PicksPageV2 = () => {
    return (
        <V2Layout>
            <nav className="nav">
                <a href="/" className="nav__logo">UFC PICKS</a>
                <div className="nav__items">
                    <a href="/" className="nav__item">HOME</a>
                    <a href="/events" className="nav__item">EVENTS</a>
                    <a href="/picks" className="nav__item nav__item--active">MY PICKS</a>
                    <a href="/leaderboard" className="nav__item">LEADERBOARDS</a>
                    <a href="/profile" className="nav__item">PROFILE</a>
                    <a href="/admin" className="nav__item">ADMIN</a>
                </div>
                <div className="nav__user">
                    <div className="nav__avatar"></div>
                    <span>FIGHTER_FAN_99</span>
                </div>
            </nav>

            <div className="main">
                <header className="page-header">
                    <div>
                        <h1 className="page-header__title">MY PICKS</h1>
                        <p className="page-header__subtitle">Your Prediction History // Track Your Performance</p>
                    </div>
                </header>

                <div className="stats-overview">
                    <div className="stat-box">
                        <div className="stat-box__value">127</div>
                        <div className="stat-box__label">TOTAL PICKS</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-box__value stat-box__value--success">86</div>
                        <div className="stat-box__label">CORRECT</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-box__value stat-box__value--error">41</div>
                        <div className="stat-box__label">INCORRECT</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-box__value stat-box__value--accent">68%</div>
                        <div className="stat-box__label">ACCURACY</div>
                    </div>
                </div>

                <div className="event-tabs">
                    <a href="#" className="event-tab event-tab--active">ALL EVENTS</a>
                    <a href="#" className="event-tab">UFC 315 (PENDING)</a>
                    <a href="#" className="event-tab">UFC 314</a>
                    <a href="#" className="event-tab">UFC FN: PEREIRA</a>
                    <a href="#" className="event-tab">UFC 313</a>
                </div>

                {/* PENDING PICKS */}
                <div className="picks-event">
                    <div className="picks-event__header">
                        <div>
                            <h2 className="picks-event__title">UFC 315: ADESANYA VS. STRICKLAND 2</h2>
                            <p className="picks-event__date">SAT, FEB 15, 2026 // PENDING</p>
                        </div>
                        <div className="picks-event__score">
                            <div className="picks-event__score-value">8/13</div>
                            <div className="picks-event__score-label">PICKS MADE</div>
                        </div>
                    </div>

                    <div className="pick-row pick-row--pending">
                        <div className="pick-row__fighter pick-row__fighter--red pick-row__fighter--selected">
                            <div className="pick-row__photo">&#9733;</div>
                            <div className="pick-row__info">
                                <div className="pick-row__name">ISRAEL ADESANYA</div>
                                <div className="pick-row__record">24-3-0</div>
                                <div className="pick-row__your-pick">YOUR PICK</div>
                            </div>
                        </div>
                        <div className="pick-row__vs">VS</div>
                        <div className="pick-row__fighter pick-row__fighter--blue">
                            <div className="pick-row__photo">&#9733;</div>
                            <div className="pick-row__info">
                                <div className="pick-row__name">SEAN STRICKLAND</div>
                                <div className="pick-row__record">29-6-0</div>
                            </div>
                        </div>
                        <div className="pick-row__result">
                            <span className="pick-row__result-badge pick-row__result-badge--pending">PENDING</span>
                        </div>
                    </div>

                    <div className="pick-row pick-row--pending">
                        <div className="pick-row__fighter pick-row__fighter--red">
                            <div className="pick-row__photo">&#9733;</div>
                            <div className="pick-row__info">
                                <div className="pick-row__name">DUSTIN POIRIER</div>
                                <div className="pick-row__record">30-8-0</div>
                            </div>
                        </div>
                        <div className="pick-row__vs">VS</div>
                        <div className="pick-row__fighter pick-row__fighter--blue pick-row__fighter--selected">
                            <div className="pick-row__photo">&#9733;</div>
                            <div className="pick-row__info">
                                <div className="pick-row__name">MICHAEL CHANDLER</div>
                                <div className="pick-row__record">23-8-0</div>
                                <div className="pick-row__your-pick">YOUR PICK</div>
                            </div>
                        </div>
                        <div className="pick-row__result">
                            <span className="pick-row__result-badge pick-row__result-badge--pending">PENDING</span>
                        </div>
                    </div>
                </div>

                <div className="section-divider">
                    <div className="section-divider__line"></div>
                    <span className="section-divider__text">COMPLETED EVENTS</span>
                    <div className="section-divider__line"></div>
                </div>

                {/* COMPLETED PICKS */}
                <div className="picks-event">
                    <div className="picks-event__header">
                        <div>
                            <h2 className="picks-event__title">UFC 314: MAKHACHEV VS. OLIVEIRA 2</h2>
                            <p className="picks-event__date">SAT, JAN 25, 2026</p>
                        </div>
                        <div className="picks-event__score">
                            <div className="picks-event__score-value">10/13</div>
                            <div className="picks-event__score-label">77% ACCURACY</div>
                        </div>
                    </div>

                    <div className="pick-row pick-row--correct">
                        <div className="pick-row__fighter pick-row__fighter--red pick-row__fighter--selected">
                            <div className="pick-row__photo">&#9733;</div>
                            <div className="pick-row__info">
                                <div className="pick-row__name">ISLAM MAKHACHEV</div>
                                <div className="pick-row__record">26-1-0</div>
                                <div className="pick-row__your-pick">YOUR PICK</div>
                            </div>
                        </div>
                        <div className="pick-row__vs">VS</div>
                        <div className="pick-row__fighter pick-row__fighter--blue">
                            <div className="pick-row__photo">&#9733;</div>
                            <div className="pick-row__info">
                                <div className="pick-row__name">CHARLES OLIVEIRA</div>
                                <div className="pick-row__record">34-10-0</div>
                            </div>
                        </div>
                        <div className="pick-row__result">
                            <span className="pick-row__result-badge pick-row__result-badge--correct">CORRECT</span>
                            <span className="pick-row__points pick-row__points--positive">+10</span>
                        </div>
                    </div>

                    <div className="pick-row pick-row--incorrect">
                        <div className="pick-row__fighter pick-row__fighter--red">
                            <div className="pick-row__photo">&#9733;</div>
                            <div className="pick-row__info">
                                <div className="pick-row__name">KHAMZAT CHIMAEV</div>
                                <div className="pick-row__record">14-0-0</div>
                            </div>
                        </div>
                        <div className="pick-row__vs">VS</div>
                        <div className="pick-row__fighter pick-row__fighter--blue pick-row__fighter--selected">
                            <div className="pick-row__photo">&#9733;</div>
                            <div className="pick-row__info">
                                <div className="pick-row__name">ROBERT WHITTAKER</div>
                                <div className="pick-row__record">25-8-0</div>
                                <div className="pick-row__your-pick">YOUR PICK</div>
                            </div>
                        </div>
                        <div className="pick-row__result">
                            <span className="pick-row__result-badge pick-row__result-badge--incorrect">WRONG</span>
                            <span className="pick-row__points pick-row__points--negative">0</span>
                        </div>
                    </div>

                    <div className="pick-row pick-row--correct">
                        <div className="pick-row__fighter pick-row__fighter--red pick-row__fighter--selected">
                            <div className="pick-row__photo">&#9733;</div>
                            <div className="pick-row__info">
                                <div className="pick-row__name">MERAB DVALISHVILI</div>
                                <div className="pick-row__record">18-4-0</div>
                                <div className="pick-row__your-pick">YOUR PICK</div>
                            </div>
                        </div>
                        <div className="pick-row__vs">VS</div>
                        <div className="pick-row__fighter pick-row__fighter--blue">
                            <div className="pick-row__photo">&#9733;</div>
                            <div className="pick-row__info">
                                <div className="pick-row__name">PETR YAN</div>
                                <div className="pick-row__record">17-5-0</div>
                            </div>
                        </div>
                        <div className="pick-row__result">
                            <span className="pick-row__result-badge pick-row__result-badge--correct">CORRECT</span>
                            <span className="pick-row__points pick-row__points--positive">+10</span>
                        </div>
                    </div>

                    <div className="pick-row pick-row--correct">
                        <div className="pick-row__fighter pick-row__fighter--red">
                            <div className="pick-row__photo">&#9733;</div>
                            <div className="pick-row__info">
                                <div className="pick-row__name">ALJAMAIN STERLING</div>
                                <div className="pick-row__record">24-4-0</div>
                            </div>
                        </div>
                        <div className="pick-row__vs">VS</div>
                        <div className="pick-row__fighter pick-row__fighter--blue pick-row__fighter--selected">
                            <div className="pick-row__photo">&#9733;</div>
                            <div className="pick-row__info">
                                <div className="pick-row__name">MOVSAR EVLOEV</div>
                                <div className="pick-row__record">19-0-0</div>
                                <div className="pick-row__your-pick">YOUR PICK</div>
                            </div>
                        </div>
                        <div className="pick-row__result">
                            <span className="pick-row__result-badge pick-row__result-badge--correct">CORRECT</span>
                            <span className="pick-row__points pick-row__points--positive">+10</span>
                        </div>
                    </div>
                </div>
            </div>
        </V2Layout>
    );
};
