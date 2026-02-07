'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Calendar, ClipboardList, Trophy, User } from 'lucide-react';

interface MobileNavProps {
    activePage?: 'home' | 'events' | 'picks' | 'leaderboard' | 'profile';
}

export const MobileNav = ({ activePage }: MobileNavProps) => {
    const navItems = [
        { href: '/', label: 'Home', icon: Home, page: 'home' as const },
        { href: '/events', label: 'Events', icon: Calendar, page: 'events' as const },
        { href: '/my-picks', label: 'Picks', icon: ClipboardList, page: 'picks' as const },
        { href: '/leaderboards', label: 'Ranks', icon: Trophy, page: 'leaderboard' as const },
        { href: '/profile', label: 'Profile', icon: User, page: 'profile' as const },
    ];

    return (
        <nav className="mobile-nav">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.page;
                return (
                    <Link
                        key={item.page}
                        href={item.href}
                        className={`mobile-nav__item ${isActive ? 'mobile-nav__item--active' : ''}`}
                    >
                        <Icon size={22} strokeWidth={2} />
                        <span className="mobile-nav__label">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
};
