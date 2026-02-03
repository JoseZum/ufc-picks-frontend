import React from 'react';
import { V2Layout } from '../V2Layout';

export const LeaderboardPageV2 = () => {
    return (
        <V2Layout>
            <nav className="nav">
                <a href="/" className="nav__logo">UFC PICKS</a>
                <div className="nav__items">
                    <a href="/" className="nav__item">HOME</a>
                    <a href="/events" className="nav__item">EVENTS</a>
                    <a href="/picks" className="nav__item">MY PICKS</a>
                    <a href="/leaderboards" className="nav__item nav__item--active">LEADERBOARDS</a>
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
                        <h1 className="page-header__title">LEADERBOARDS</h1>
                        <p className="page-header__subtitle">Global Rankings // Top Predictors</p>
                    </div>
                    <div className="page-header__filters">
                        <button className="filter-btn filter-btn--active">ALL TIME</button>
                        <button className="filter-btn">THIS MONTH</button>
                        <button className="filter-btn">THIS WEEK</button>
                    </div>
                </header>

                <div className="podium">
                    <div className="podium__place podium__place--2">
                        <span className="podium__rank">2</span>
                        <div className="podium__avatar">&#9827;</div>
                        <h3 className="podium__name">MMA_PROPHET</h3>
                        <div className="podium__stats">
                            <div>
                                <div className="podium__stat-value">2,380</div>
                                <div className="podium__stat-label">POINTS</div>
                            </div>
                            <div>
                                <div className="podium__stat-value">75%</div>
                                <div className="podium__stat-label">ACCURACY</div>
                            </div>
                        </div>
                    </div>

                    <div className="podium__place podium__place--1">
                        <span className="podium__rank">1</span>
                        <div className="podium__avatar">&#9733;</div>
                        <h3 className="podium__name">OCTAGON_ORACLE</h3>
                        <div className="podium__stats">
                            <div>
                                <div className="podium__stat-value">2,450</div>
                                <div className="podium__stat-label">POINTS</div>
                            </div>
                            <div>
                                <div className="podium__stat-value">78%</div>
                                <div className="podium__stat-label">ACCURACY</div>
                            </div>
                        </div>
                    </div>

                    <div className="podium__place podium__place--3">
                        <span className="podium__rank">3</span>
                        <div className="podium__avatar">&#9830;</div>
                        <h3 className="podium__name">FIGHT_ANALYST</h3>
                        <div className="podium__stats">
                            <div>
                                <div className="podium__stat-value">2,290</div>
                                <div className="podium__stat-label">POINTS</div>
                            </div>
                            <div>
                                <div className="podium__stat-value">73%</div>
                                <div className="podium__stat-label">ACCURACY</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* YOUR POSITION */}
                <div className="your-position">
                    <div className="your-position__rank">#42</div>
                    <div className="your-position__user">
                        <div className="your-position__avatar">YOU</div>
                        <div>
                            <div className="your-position__name">FIGHTER_FAN_99</div>
                            <div className="your-position__label">YOUR POSITION</div>
                        </div>
                    </div>
                    <div className="your-position__stat">
                        <div className="your-position__stat-value">1,240</div>
                        <div className="your-position__stat-label">POINTS</div>
                    </div>
                    <div className="your-position__stat">
                        <div className="your-position__stat-value">68%</div>
                        <div className="your-position__stat-label">ACCURACY</div>
                    </div>
                    <div className="your-position__stat">
                        <div className="your-position__stat-value">127</div>
                        <div className="your-position__stat-label">PICKS</div>
                    </div>
                </div>

                {/* FULL LEADERBOARD */}
                <div className="leaderboard-full">
                    <div className="leaderboard-full__header">
                        <span>RANK</span>
                        <span>USER</span>
                        <span style={{ textAlign: 'right' }}>POINTS</span>
                        <span style={{ textAlign: 'right' }}>ACCURACY</span>
                        <span style={{ textAlign: 'right' }}>PICKS</span>
                    </div>

                    <a href="/profile" className="leaderboard-full__row">
                        <span className="leaderboard-full__rank">04</span>
                        <div className="leaderboard-full__user">
                            <div className="leaderboard-full__avatar">&#9824;</div>
                            <span className="leaderboard-full__name">CAGE_MASTER</span>
                        </div>
                        <span className="leaderboard-full__points">
                            2,150 <span className="change change--up">&uarr;2</span>
                        </span>
                        <span className="leaderboard-full__accuracy">71%</span>
                        <span className="leaderboard-full__picks">203</span>
                    </a>

                    <a href="#" className="leaderboard-full__row">
                        <span className="leaderboard-full__rank">05</span>
                        <div className="leaderboard-full__user">
                            <div className="leaderboard-full__avatar">&#9829;</div>
                            <span className="leaderboard-full__name">UFC_INSIDER</span>
                        </div>
                        <span className="leaderboard-full__points">
                            2,080 <span className="change change--down">&darr;1</span>
                        </span>
                        <span className="leaderboard-full__accuracy">70%</span>
                        <span className="leaderboard-full__picks">189</span>
                    </a>

                    <a href="#" className="leaderboard-full__row">
                        <span className="leaderboard-full__rank">06</span>
                        <div className="leaderboard-full__user">
                            <div className="leaderboard-full__avatar">&#9733;</div>
                            <span className="leaderboard-full__name">TAPOUT_KING</span>
                        </div>
                        <span className="leaderboard-full__points">
                            1,990 <span className="change change--same">=</span>
                        </span>
                        <span className="leaderboard-full__accuracy">69%</span>
                        <span className="leaderboard-full__picks">178</span>
                    </a>

                    <a href="#" className="leaderboard-full__row">
                        <span className="leaderboard-full__rank">07</span>
                        <div className="leaderboard-full__user">
                            <div className="leaderboard-full__avatar">&#9827;</div>
                            <span className="leaderboard-full__name">KNOCKOUT_ARTIST</span>
                        </div>
                        <span className="leaderboard-full__points">
                            1,920 <span className="change change--up">&uarr;5</span>
                        </span>
                        <span className="leaderboard-full__accuracy">72%</span>
                        <span className="leaderboard-full__picks">156</span>
                    </a>

                    <a href="#" className="leaderboard-full__row">
                        <span className="leaderboard-full__rank">08</span>
                        <div className="leaderboard-full__user">
                            <div className="leaderboard-full__avatar">&#9830;</div>
                            <span className="leaderboard-full__name">GROUND_GAME</span>
                        </div>
                        <span className="leaderboard-full__points">
                            1,850 <span className="change change--down">&darr;2</span>
                        </span>
                        <span className="leaderboard-full__accuracy">67%</span>
                        <span className="leaderboard-full__picks">201</span>
                    </a>

                    <a href="#" className="leaderboard-full__row">
                        <span className="leaderboard-full__rank">09</span>
                        <div className="leaderboard-full__user">
                            <div className="leaderboard-full__avatar">&#9824;</div>
                            <span className="leaderboard-full__name">STRIKER_ELITE</span>
                        </div>
                        <span className="leaderboard-full__points">
                            1,780 <span className="change change--up">&uarr;1</span>
                        </span>
                        <span className="leaderboard-full__accuracy">66%</span>
                        <span className="leaderboard-full__picks">195</span>
                    </a>

                    <a href="#" className="leaderboard-full__row">
                        <span className="leaderboard-full__rank">10</span>
                        <div className="leaderboard-full__user">
                            <div className="leaderboard-full__avatar">&#9829;</div>
                            <span className="leaderboard-full__name">SUBMISSION_ACE</span>
                        </div>
                        <span className="leaderboard-full__points">
                            1,720 <span className="change change--same">=</span>
                        </span>
                        <span className="leaderboard-full__accuracy">65%</span>
                        <span className="leaderboard-full__picks">188</span>
                    </a>
                </div>

                <div className="pagination">
                    <button className="pagination__btn pagination__btn--active">1</button>
                    <button className="pagination__btn">2</button>
                    <button className="pagination__btn">3</button>
                    <button className="pagination__btn">4</button>
                    <button className="pagination__btn">5</button>
                    <button className="pagination__btn">&rarr;</button>
                </div>
            </div>
        </V2Layout>
    );
};
