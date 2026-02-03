'use client';

import React from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks';

type ActivePage = 'home' | 'events' | 'my-picks' | 'leaderboards' | 'profile' | 'admin';

interface NavBarV2Props {
    activePage?: ActivePage;
}

export const NavBarV2 = ({ activePage }: NavBarV2Props) => {
    const { data: currentUser } = useCurrentUser();

    const navItems: { label: string; href: string; key: ActivePage; adminOnly?: boolean }[] = [
        { label: 'HOME', href: '/', key: 'home' },
        { label: 'EVENTS', href: '/events', key: 'events' },
        { label: 'MY PICKS', href: '/my-picks', key: 'my-picks' },
        { label: 'LEADERBOARD', href: '/leaderboards', key: 'leaderboards' },
        { label: 'PROFILE', href: '/profile', key: 'profile' },
        { label: 'ADMIN', href: '/admin', key: 'admin', adminOnly: true },
    ];

    const visibleItems = navItems.filter(item => !item.adminOnly || currentUser?.is_admin);

    return (
        <nav className="nav">
            <Link href="/" className="nav__logo">
                UFC PICKS
            </Link>
            <div className="nav__items">
                {visibleItems.map(item => (
                    <Link 
                        key={item.key}
                        href={item.href} 
                        className={`nav__item ${activePage === item.key ? 'nav__item--active' : ''}`}
                    >
                        {item.label}
                    </Link>
                ))}
            </div>
            <div className="nav__user">
                {currentUser ? (
                    <>
                        <div 
                            className="nav__avatar" 
                            style={{ 
                                backgroundImage: currentUser.profile_picture ? `url(${currentUser.profile_picture})` : 'none',
                                backgroundSize: 'cover'
                            }}
                        />
                        <span>{currentUser.name?.toUpperCase() || 'USER'}</span>
                    </>
                ) : (
                    <Link href="/auth" className="nav__item">
                        LOGIN
                    </Link>
                )}
            </div>
        </nav>
    );
};
