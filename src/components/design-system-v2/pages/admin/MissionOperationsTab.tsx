'use client';

import React from 'react';
import { useEvents } from '@/lib/hooks';
import { AdminMissionPanelContainer } from '@/features/missions/surfaces/admin-mission-panel-container';

export const MissionOperationsTab = () => {
    const { data: eventsData, isLoading } = useEvents({ limit: 50 });
    const events = (eventsData?.events ?? [])
        .slice(0, 10)
        .map((event) => ({ id: event.id, label: event.name }));

    if (isLoading) return <div className="admin-loading">Loading events…</div>;
    return <AdminMissionPanelContainer events={events} />;
};
