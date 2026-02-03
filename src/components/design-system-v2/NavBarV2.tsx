'use client';

import React from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks';

interface NavBarV2Props {
    activePage?: 'home' | 'events' | 'picks' | 'leaderboard' | 'profile' | 'admin';
}

export const NavBarV2 = ({ activePage }: NavBarV2Props) => {
    const { data: currentUser } = useCurrentUser();

    const navItems = [
        { href: '/', label: 'HOME', page: 'home' as const },
        { href: '/events', label: 'EVENTS', page: 'events' as const },
        { href: '/my-picks', label: 'MY PICKS', page: 'picks' as const },
        { href: '/leaderboards', label: 'LEADERBOARDS', page: 'leaderboard' as const },
        { href: '/profile', label: 'PROFILE', page: 'profile' as const },
    ];

    return (
        <nav className="nav">
            <Link href="/" className="nav__logo">UFC PICKS</Link>
            <div className="nav__items">
                {navItems.map((item) => (
                    <Link
                        key={item.page}
                        href={item.href}
                        className={`nav__item ${activePage === item.page ? 'nav__item--active' : ''}`}
                    >
                        {item.label}
                    </Link>
                ))}
                {currentUser?.is_admin && (
                    <Link
                        href="/admin"
                        className={`nav__item ${activePage === 'admin' ? 'nav__item--active' : ''}`}
                    >
                        ADMIN
                    </Link>
                )}
            </div>
            <div className="nav__user">
                <div className="nav__avatar" style={{
                    backgroundImage: currentUser?.profile_picture ? `url(${currentUser.profile_picture})` : 'none',
                    backgroundSize: 'cover'
                }}>
                    {!currentUser?.profile_picture && (currentUser?.name?.charAt(0).toUpperCase() || '?')}
                </div>
                <span>{currentUser?.name || 'GUEST'}</span>
            </div>
        </nav>
    );
};
