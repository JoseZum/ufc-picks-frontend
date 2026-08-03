'use client';

/**
 * `/users/[userId]` — the public profile.
 *
 * Renders exactly what the dialog renders. The previous version of this page
 * was a separate, older layout, so opening someone from a leaderboard and
 * opening them by URL showed two different products; there is now one.
 */

import React from 'react';
import Link from 'next/link';
import { V2Layout } from '../V2Layout';
import { UserTapeProfile, useUserTapeData } from '../UserTapeProfile';
import { Loader2, ArrowLeft } from 'lucide-react';
import '../user-tape-card.css';

interface UserProfilePageV2Props {
    userId: string;
}

export const UserProfilePageV2 = ({ userId }: UserProfilePageV2Props) => {
    const { profile, isPending } = useUserTapeData(userId);

    return (
        <V2Layout>
            <div className="utc-page">
                <Link href="/leaderboards" className="utc-back utc-back--page">
                    <ArrowLeft size={13} /> LEADERBOARDS
                </Link>

                {isPending ? (
                    <div className="utc-loading">
                        <Loader2 className="utc-spin" size={26} />
                    </div>
                ) : !profile ? (
                    <p className="utc-sub">THIS PROFILE IS NOT AVAILABLE.</p>
                ) : (
                    <UserTapeProfile userId={userId} />
                )}
            </div>
        </V2Layout>
    );
};
