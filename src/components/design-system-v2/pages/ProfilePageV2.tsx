import React from 'react';
import { V2Layout } from '../V2Layout';

export const ProfilePageV2 = () => {
    return (
        <V2Layout>
            <nav className="nav">
                <a href="/" className="nav__logo">UFC PICKS</a>
                <div className="nav__items">
                    <a href="/" className="nav__item">HOME</a>
                    <a href="/events" className="nav__item">EVENTS</a>
                    <a href="/picks" className="nav__item">MY PICKS</a>
                    <a href="/leaderboards" className="nav__item">LEADERBOARDS</a>
                    <a href="/profile" className="nav__item nav__item--active">PROFILE</a>
                    <a href="/admin" className="nav__item">ADMIN</a>
                </div>
                <div className="nav__user">
                    <div className="nav__avatar"></div>
                    <span>FIGHTER_FAN_99</span>
                </div>
            </nav>

            <div className="main" style={{ paddingTop: '70px' }}>
                <section className="profile-hero">
                    <div className="profile-hero__sidebar">
                        <div className="profile-hero__avatar">&#9733;</div>
                        <h1 className="profile-hero__name">FIGHTER_FAN_99</h1>
                        <p className="profile-hero__joined">MEMBER SINCE JAN 2024</p>

                        <div className="profile-hero__rank">
                            <div className="profile-hero__rank-label">GLOBAL RANK</div>
                            <div className="profile-hero__rank-value">#42</div>
                            <div className="profile-hero__rank-total">of 1,247 users</div>
                        </div>

                        <button className="profile-hero__edit-btn">EDIT PROFILE</button>
                    </div>

                    <div className="profile-hero__main">
                        <div className="profile-stats-grid">
                            <div className="profile-stat-card">
                                <div className="profile-stat-card__value">127</div>
                                <div className="profile-stat-card__label">TOTAL PICKS</div>
                            </div>
                            <div className="profile-stat-card">
                                <div className="profile-stat-card__value profile-stat-card__value--success">86</div>
                                <div className="profile-stat-card__label">CORRECT</div>
                            </div>
                            <div className="profile-stat-card">
                                <div className="profile-stat-card__value profile-stat-card__value--error">41</div>
                                <div className="profile-stat-card__label">INCORRECT</div>
                            </div>
                            <div className="profile-stat-card profile-stat-card--highlight">
                                <div className="profile-stat-card__value profile-stat-card__value--accent">68%</div>
                                <div className="profile-stat-card__label">ACCURACY</div>
                            </div>
                        </div>

                        <div className="accuracy-section">
                            <div className="accuracy-section__header">
                                <h3 className="accuracy-section__title">ACCURACY OVER TIME</h3>
                                <span className="accuracy-section__period">LAST 10 EVENTS</span>
                            </div>
                            <div className="chart" style={{ marginBottom: '30px' }}>
                                <div className="chart__bar">
                                    <div className="chart__bar-fill" style={{ height: '65%' }}></div>
                                    <span className="chart__bar-value">65%</span>
                                    <span className="chart__bar-label">308</span>
                                </div>
                                <div className="chart__bar">
                                    <div className="chart__bar-fill" style={{ height: '72%' }}></div>
                                    <span className="chart__bar-value">72%</span>
                                    <span className="chart__bar-label">309</span>
                                </div>
                                <div className="chart__bar">
                                    <div className="chart__bar-fill" style={{ height: '58%' }}></div>
                                    <span className="chart__bar-value">58%</span>
                                    <span className="chart__bar-label">FN</span>
                                </div>
                                <div className="chart__bar">
                                    <div className="chart__bar-fill" style={{ height: '70%' }}></div>
                                    <span className="chart__bar-value">70%</span>
                                    <span className="chart__bar-label">310</span>
                                </div>
                                <div className="chart__bar">
                                    <div className="chart__bar-fill" style={{ height: '80%' }}></div>
                                    <span className="chart__bar-value">80%</span>
                                    <span className="chart__bar-label">311</span>
                                </div>
                                <div className="chart__bar">
                                    <div className="chart__bar-fill" style={{ height: '55%' }}></div>
                                    <span className="chart__bar-value">55%</span>
                                    <span className="chart__bar-label">FN</span>
                                </div>
                                <div className="chart__bar">
                                    <div className="chart__bar-fill" style={{ height: '64%' }}></div>
                                    <span className="chart__bar-value">64%</span>
                                    <span className="chart__bar-label">313</span>
                                </div>
                                <div className="chart__bar">
                                    <div className="chart__bar-fill" style={{ height: '67%' }}></div>
                                    <span className="chart__bar-value">67%</span>
                                    <span className="chart__bar-label">FN</span>
                                </div>
                                <div className="chart__bar">
                                    <div className="chart__bar-fill" style={{ height: '77%' }}></div>
                                    <span className="chart__bar-value">77%</span>
                                    <span className="chart__bar-label">314</span>
                                </div>
                                <div className="chart__bar">
                                    <div className="chart__bar-fill" style={{ height: '0%', background: 'var(--text-muted)' }}></div>
                                    <span className="chart__bar-value">--</span>
                                    <span className="chart__bar-label">315</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="profile-content">
                    {/* WEIGHT CLASS BREAKDOWN */}
                    <div className="section-header">
                        <h2 className="section-header__title">ACCURACY BY WEIGHT CLASS</h2>
                    </div>

                    <div className="weight-grid">
                        <div className="weight-card">
                            <div className="weight-card__name">HEAVYWEIGHT</div>
                            <div className="weight-card__accuracy weight-card__accuracy--high">78%</div>
                            <div className="weight-card__picks">18 picks</div>
                        </div>
                        <div className="weight-card">
                            <div className="weight-card__name">LIGHT HEAVYWEIGHT</div>
                            <div className="weight-card__accuracy weight-card__accuracy--mid">65%</div>
                            <div className="weight-card__picks">14 picks</div>
                        </div>
                        <div className="weight-card">
                            <div className="weight-card__name">MIDDLEWEIGHT</div>
                            <div className="weight-card__accuracy weight-card__accuracy--high">72%</div>
                            <div className="weight-card__picks">21 picks</div>
                        </div>
                        <div className="weight-card">
                            <div className="weight-card__name">WELTERWEIGHT</div>
                            <div className="weight-card__accuracy weight-card__accuracy--mid">68%</div>
                            <div className="weight-card__picks">19 picks</div>
                        </div>
                        <div className="weight-card">
                            <div className="weight-card__name">LIGHTWEIGHT</div>
                            <div className="weight-card__accuracy weight-card__accuracy--mid">70%</div>
                            <div className="weight-card__picks">22 picks</div>
                        </div>
                        <div className="weight-card">
                            <div className="weight-card__name">FEATHERWEIGHT</div>
                            <div className="weight-card__accuracy weight-card__accuracy--low">55%</div>
                            <div className="weight-card__picks">16 picks</div>
                        </div>
                        <div className="weight-card">
                            <div className="weight-card__name">BANTAMWEIGHT</div>
                            <div className="weight-card__accuracy weight-card__accuracy--mid">64%</div>
                            <div className="weight-card__picks">12 picks</div>
                        </div>
                        <div className="weight-card">
                            <div className="weight-card__name">FLYWEIGHT</div>
                            <div className="weight-card__accuracy weight-card__accuracy--low">60%</div>
                            <div className="weight-card__picks">5 picks</div>
                        </div>
                    </div>

                    {/* RECENT ACTIVITY */}
                    <div className="section-header">
                        <h2 className="section-header__title">RECENT ACTIVITY</h2>
                        <a href="/picks" className="section-header__link">VIEW ALL &rarr;</a>
                    </div>

                    <div className="activity-list">
                        <div className="activity-item">
                            <div className="activity-item__icon activity-item__icon--pick">&#9733;</div>
                            <div className="activity-item__content">
                                <div className="activity-item__title">Picked ISRAEL ADESANYA vs Strickland</div>
                                <div className="activity-item__subtitle">UFC 315 // Middleweight Championship</div>
                            </div>
                            <div className="activity-item__time">2 hours ago</div>
                        </div>

                        <div className="activity-item">
                            <div className="activity-item__icon activity-item__icon--correct">&#10003;</div>
                            <div className="activity-item__content">
                                <div className="activity-item__title">ISLAM MAKHACHEV defeated Oliveira</div>
                                <div className="activity-item__subtitle">UFC 314 // Lightweight Championship</div>
                            </div>
                            <div className="activity-item__time">
                                <div className="activity-item__points activity-item__points--positive">+10</div>
                                Jan 25
                            </div>
                        </div>

                        <div className="activity-item">
                            <div className="activity-item__icon activity-item__icon--incorrect">&#10007;</div>
                            <div className="activity-item__content">
                                <div className="activity-item__title">KHAMZAT CHIMAEV defeated Whittaker</div>
                                <div className="activity-item__subtitle">UFC 314 // Middleweight Bout</div>
                            </div>
                            <div className="activity-item__time">
                                <div className="activity-item__points activity-item__points--negative">0</div>
                                Jan 25
                            </div>
                        </div>

                        <div className="activity-item">
                            <div className="activity-item__icon activity-item__icon--correct">&#10003;</div>
                            <div className="activity-item__content">
                                <div className="activity-item__title">MERAB DVALISHVILI defeated Yan</div>
                                <div className="activity-item__subtitle">UFC 314 // Bantamweight Bout</div>
                            </div>
                            <div className="activity-item__time">
                                <div className="activity-item__points activity-item__points--positive">+10</div>
                                Jan 25
                            </div>
                        </div>

                        <div className="activity-item">
                            <div className="activity-item__icon activity-item__icon--correct">&#10003;</div>
                            <div className="activity-item__content">
                                <div className="activity-item__title">MOVSAR EVLOEV defeated Sterling</div>
                                <div className="activity-item__subtitle">UFC 314 // Featherweight Bout</div>
                            </div>
                            <div className="activity-item__time">
                                <div className="activity-item__points activity-item__points--positive">+10</div>
                                Jan 25
                            </div>
                        </div>
                    </div>

                    {/* ACHIEVEMENTS */}
                    <div className="section-header" style={{ marginTop: '3rem' }}>
                        <h2 className="section-header__title">ACHIEVEMENTS</h2>
                    </div>

                    <div className="achievements-grid">
                        <div className="achievement achievement--unlocked">
                            <div className="achievement__icon">&#127942;</div>
                            <div className="achievement__name">FIRST BLOOD</div>
                            <div className="achievement__desc">Make your first pick</div>
                        </div>
                        <div className="achievement achievement--unlocked">
                            <div className="achievement__icon">&#128293;</div>
                            <div className="achievement__name">HOT STREAK</div>
                            <div className="achievement__desc">5 correct picks in a row</div>
                        </div>
                        <div className="achievement achievement--unlocked">
                            <div className="achievement__icon">&#127775;</div>
                            <div className="achievement__name">CENTURY</div>
                            <div className="achievement__desc">100 total picks made</div>
                        </div>
                        <div className="achievement">
                            <div className="achievement__icon">&#128081;</div>
                            <div className="achievement__name">CHAMPION</div>
                            <div className="achievement__desc">Reach top 10 globally</div>
                        </div>
                        <div className="achievement achievement--unlocked">
                            <div className="achievement__icon">&#129504;</div>
                            <div className="achievement__name">ANALYST</div>
                            <div className="achievement__desc">70% accuracy (min 50 picks)</div>
                        </div>
                        <div className="achievement">
                            <div className="achievement__icon">&#127919;</div>
                            <div className="achievement__name">PERFECT EVENT</div>
                            <div className="achievement__desc">100% accuracy on full card</div>
                        </div>
                        <div className="achievement">
                            <div className="achievement__icon">&#128640;</div>
                            <div className="achievement__name">RISING STAR</div>
                            <div className="achievement__desc">Gain 20 ranks in one event</div>
                        </div>
                        <div className="achievement">
                            <div className="achievement__icon">&#9889;</div>
                            <div className="achievement__name">ORACLE</div>
                            <div className="achievement__desc">80% accuracy (min 100 picks)</div>
                        </div>
                    </div>
                </section>
            </div>
        </V2Layout>
    );
};
