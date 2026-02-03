import React, { useState } from 'react';
import { V2Layout } from '../V2Layout';

export const AdminPageV2 = () => {
    const [activeTab, setActiveTab] = useState('timing');

    return (
        <V2Layout>
            <nav className="nav">
                <a href="/" className="nav__logo">UFC PICKS</a>
                <div className="nav__items">
                    <a href="/" className="nav__item">HOME</a>
                    <a href="/events" className="nav__item">EVENTS</a>
                    <a href="/picks" className="nav__item">MY PICKS</a>
                    <a href="/leaderboards" className="nav__item">LEADERBOARDS</a>
                    <a href="/profile" className="nav__item">PROFILE</a>
                    <a href="/admin" className="nav__item nav__item--active">ADMIN</a>
                </div>
                <div className="nav__user">
                    <div className="nav__avatar"></div>
                    <span>ADMIN_USER</span>
                </div>
            </nav>

            <div className="main" style={{ paddingTop: '90px', maxWidth: '1200px', paddingBottom: '4rem' }}>
                <header className="admin-header">
                    <div className="admin-header__title">
                        <div className="admin-header__icon">&#9881;</div>
                        <div className="admin-header__text">
                            <h1>ADMIN PANEL</h1>
                            <p>Event Management // Result Registration</p>
                        </div>
                    </div>
                    <div className="admin-header__badge">ADMINISTRATOR</div>
                </header>

                {/* TAB NAVIGATION */}
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === 'timing' ? 'admin-tab--active' : ''}`}
                        onClick={() => setActiveTab('timing')}
                    >
                        <span className="admin-tab__icon">&#128197;</span>
                        MANAGE EVENTS
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'results' ? 'admin-tab--active' : ''}`}
                        onClick={() => setActiveTab('results')}
                    >
                        <span className="admin-tab__icon">&#127942;</span>
                        REGISTER RESULTS
                    </button>
                </div>

                {/* TAB 1: EVENT TIMING MANAGER */}
                <div className={`admin-tab-content ${activeTab === 'timing' ? 'admin-tab-content--active' : ''}`}>
                    <h2 className="admin-section-title">UPCOMING EVENTS</h2>

                    {/* Event 1 - Expanded */}
                    <div className="event-timing-card event-timing-card--expanded">
                        <div className="event-timing-card__header">
                            <div className="event-timing-card__info">
                                <h3>UFC 315: ADESANYA VS. STRICKLAND 2</h3>
                                <p>SAT, FEB 15, 2026 // T-Mobile Arena, Las Vegas</p>
                            </div>
                            <span className="event-timing-card__status event-timing-card__status--open">OPEN</span>
                            <span className="event-timing-card__toggle">&#9660;</span>
                        </div>
                        <div className="event-timing-card__body">
                            <div className="admin-form-grid">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">EVENT DATE & TIME</label>
                                    <input type="datetime-local" className="admin-form-input" defaultValue="2026-02-15T22:00" />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">PICKS LOCK DATE & TIME</label>
                                    <input type="datetime-local" className="admin-form-input" defaultValue="2026-02-15T19:00" />
                                </div>
                            </div>
                            <div className="admin-btn-group">
                                <button className="admin-btn admin-btn--secondary">LOCK PICKS NOW</button>
                                <button className="admin-btn admin-btn--primary">SAVE CHANGES</button>
                            </div>
                        </div>
                    </div>

                    {/* Event 2 */}
                    <div className="event-timing-card">
                        <div className="event-timing-card__header">
                            <div className="event-timing-card__info">
                                <h3>UFC FIGHT NIGHT: HOLLOWAY VS. ALLEN</h3>
                                <p>SAT, FEB 22, 2026 // UFC APEX, Las Vegas</p>
                            </div>
                            <span className="event-timing-card__status event-timing-card__status--scheduled">SCHEDULED</span>
                            <span className="event-timing-card__toggle">&#9660;</span>
                        </div>
                    </div>

                    {/* Event 3 */}
                    <div className="event-timing-card">
                        <div className="event-timing-card__header">
                            <div className="event-timing-card__info">
                                <h3>UFC 316: JONES VS. ASPINALL</h3>
                                <p>SAT, MAR 01, 2026 // Madison Square Garden, NY</p>
                            </div>
                            <span className="event-timing-card__status event-timing-card__status--scheduled">SCHEDULED</span>
                            <span className="event-timing-card__toggle">&#9660;</span>
                        </div>
                    </div>
                </div>

                {/* TAB 2: RESULT REGISTRATION */}
                <div className={`admin-tab-content ${activeTab === 'results' ? 'admin-tab-content--active' : ''}`}>
                    <h2 className="admin-section-title">UPDATE RESULTS</h2>

                    <div className="admin-event-selector">
                        <label className="admin-event-selector__label">SELECT EVENT</label>
                        <select className="admin-form-select admin-event-selector__select">
                            <option>UFC 314: MAKHACHEV VS. OLIVEIRA 2</option>
                            <option>UFC FIGHT NIGHT: BURNS VS. MADDALENA</option>
                        </select>
                    </div>

                    <div className="admin-alert admin-alert--warning">
                        <span className="admin-alert__icon">&#9888;</span>
                        <span>WARNING: Updating results will automatically trigger points calculation. This action cannot be easily undone.</span>
                    </div>

                    {/* Bout 1 - Completed */}
                    <div className="bout-result-card bout-result-card--has-result">
                        <div className="bout-result-card__header">
                            <div className="bout-result-card__fighter bout-result-card__fighter--red">
                                <div className="bout-result-card__fighter-photo">&#9733;</div>
                                <div className="bout-result-card__fighter-info">
                                    <div className="bout-result-card__fighter-name">MAKHACHEV</div>
                                    <div className="bout-result-card__fighter-record">26-1-0</div>
                                </div>
                            </div>
                            <div className="bout-result-card__vs">VS</div>
                            <div className="bout-result-card__fighter bout-result-card__fighter--blue">
                                <div className="bout-result-card__fighter-photo">&#9829;</div>
                                <div className="bout-result-card__fighter-info">
                                    <div className="bout-result-card__fighter-name">OLIVEIRA</div>
                                    <div className="bout-result-card__fighter-record">34-9-0</div>
                                </div>
                            </div>
                            <span className="bout-result-card__result-badge">RED WIN</span>
                            <span className="bout-result-card__toggle">&#9660;</span>
                        </div>
                    </div>

                    {/* Bout 2 - Active */}
                    <div className="bout-result-card bout-result-card--expanded" style={{ marginTop: '2px' }}>
                        <div className="bout-result-card__header">
                            <div className="bout-result-card__fighter bout-result-card__fighter--red">
                                <div className="bout-result-card__fighter-photo">&#9733;</div>
                                <div className="bout-result-card__fighter-info">
                                    <div className="bout-result-card__fighter-name">CHIMAEV</div>
                                    <div className="bout-result-card__fighter-record">13-0-0</div>
                                </div>
                            </div>
                            <div className="bout-result-card__vs">VS</div>
                            <div className="bout-result-card__fighter bout-result-card__fighter--blue">
                                <div className="bout-result-card__fighter-photo">&#9829;</div>
                                <div className="bout-result-card__fighter-info">
                                    <div className="bout-result-card__fighter-name">WHITTAKER</div>
                                    <div className="bout-result-card__fighter-record">24-7-0</div>
                                </div>
                            </div>
                            <span></span>
                            <span className="bout-result-card__toggle">&#9650;</span>
                        </div>
                        <div className="bout-result-card__body">
                            <div className="bout-result-card__meta">
                                <div className="bout-result-card__meta-item">BOUT: <span>MIDDLEWEIGHT</span></div>
                                <div className="bout-result-card__meta-item">ROUNDS: <span>5</span></div>
                                <div className="bout-result-card__meta-item">TITLE: <span>NO</span></div>
                            </div>

                            <label className="admin-form-label" style={{ marginBottom: '1rem', display: 'block' }}>WINNER SELECTION</label>
                            <div className="winner-selection">
                                <div className="winner-option winner-option--red winner-option--selected">
                                    <div className="winner-option__name">KHAMZAT CHIMAEV</div>
                                    <div className="winner-option__label">RED CORNER</div>
                                </div>
                                <div className="winner-option winner-option--blue">
                                    <div className="winner-option__name">ROBERT WHITTAKER</div>
                                    <div className="winner-option__label">BLUE CORNER</div>
                                </div>
                            </div>

                            <label className="admin-form-label" style={{ marginBottom: '1rem', display: 'block' }}>METHOD OF VICTORY</label>
                            <div className="admin-result-form">
                                <div className="admin-form-group">
                                    <label className="admin-form-label">METHOD</label>
                                    <select className="admin-form-select">
                                        <option>KO/TKO</option>
                                        <option>SUBMISSION</option>
                                        <option>DECISION - UNANIMOUS</option>
                                        <option>DECISION - SPLIT</option>
                                        <option>DRAW</option>
                                        <option>NO CONTEST</option>
                                    </select>
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">ROUND</label>
                                    <select className="admin-form-select">
                                        <option>1</option>
                                        <option>2</option>
                                        <option>3</option>
                                        <option>4</option>
                                        <option>5</option>
                                    </select>
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-form-label">TIME</label>
                                    <input type="text" className="admin-form-input" placeholder="MM:SS" defaultValue="2:45" />
                                </div>
                            </div>

                            <div className="admin-btn-group">
                                <button className="admin-btn admin-btn--secondary">RESET</button>
                                <button className="admin-btn admin-btn--primary">CONFIRM RESULT</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </V2Layout>
    );
};
