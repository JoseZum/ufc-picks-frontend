'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { V2Layout } from '../V2Layout';
import { NavBarV2 } from '../NavBarV2';
import { useCurrentUser } from '@/lib/hooks';
import '@/features/missions/missions.css';
import { EventArtTab } from './admin/EventArtTab';
import { EventTimingTab } from './admin/EventTimingTab';
import { ManageBoutsTab } from './admin/ManageBoutsTab';
import { MissionOperationsTab } from './admin/MissionOperationsTab';
import { PhotoUploaderTab } from './admin/PhotoUploaderTab';
import { ResultRegistrationTab } from './admin/ResultRegistrationTab';

export const AdminPageV2 = () => {
    const router = useRouter();
    const { data: user, isLoading: userLoading } = useCurrentUser();
    const [activeTab, setActiveTab] = useState<'timing' | 'results' | 'uploads' | 'bouts' | 'photos' | 'missions'>('timing');

    const isAdmin = !!user?.is_admin;

    // Navegar es un efecto secundario: hacerlo durante el render rompe React.
    useEffect(() => {
        if (!userLoading && !isAdmin) router.push('/');
    }, [userLoading, isAdmin, router]);

    if (userLoading || !isAdmin) {
        return (
            <V2Layout>
                <NavBarV2 activePage="events" />
                <div className="main" style={{ paddingTop: '90px', textAlign: 'center', padding: '4rem' }}>
                    <div className="spinner"></div>
                </div>
            </V2Layout>
        );
    }

    return (
        <V2Layout>
            <NavBarV2 activePage="events" />

            <div className="main" style={{ paddingTop: '90px', maxWidth: '1200px', paddingBottom: '4rem' }}>
                <header className="admin-header">
                    <div className="admin-header__title">
                        <div className="admin-header__icon">⚙</div>
                        <div className="admin-header__text">
                            <h1>ADMIN PANEL</h1>
                            <p>Event Management</p>
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
                        <span className="admin-tab__icon">📅</span>
                        MANAGE EVENTS
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'results' ? 'admin-tab--active' : ''}`}
                        onClick={() => setActiveTab('results')}
                    >
                        <span className="admin-tab__icon">🏆</span>
                        REGISTER RESULTS
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'uploads' ? 'admin-tab--active' : ''}`}
                        onClick={() => setActiveTab('uploads')}
                    >
                        <span className="admin-tab__icon">📷</span>
                        EVENT ART
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'bouts' ? 'admin-tab--active' : ''}`}
                        onClick={() => setActiveTab('bouts')}
                    >
                        <span className="admin-tab__icon">🥊</span>
                        MANAGE BOUTS
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'photos' ? 'admin-tab--active' : ''}`}
                        onClick={() => setActiveTab('photos')}
                    >
                        <span className="admin-tab__icon">📸</span>
                        PHOTO UPLOADER
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'missions' ? 'admin-tab--active' : ''}`}
                        onClick={() => setActiveTab('missions')}
                    >
                        <span className="admin-tab__icon">🎯</span>
                        MISSIONS
                    </button>
                </div>

                {/* TAB 1: EVENT TIMING MANAGER */}
                {activeTab === 'timing' && <EventTimingTab />}

                {/* TAB 2: RESULT REGISTRATION */}
                {activeTab === 'results' && <ResultRegistrationTab />}

                {/* TAB 3: EVENT ART UPLOADS */}
                {activeTab === 'uploads' && <EventArtTab />}

                {/* TAB 4: MANAGE BOUTS */}
                {activeTab === 'bouts' && <ManageBoutsTab />}

                {/* TAB 5: PHOTO UPLOADER */}
                {activeTab === 'photos' && <PhotoUploaderTab />}

                {/* TAB 6: MISSION OPERATIONS */}
                {activeTab === 'missions' && <MissionOperationsTab />}
            </div>
        </V2Layout>
    );
};

