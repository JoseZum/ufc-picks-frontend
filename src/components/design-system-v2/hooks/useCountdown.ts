'use client';

import { useState, useEffect } from 'react';

interface CountdownResult {
    formatted: {
        days: string;
        hours: string;
        minutes: string;
        seconds: string;
    };
    isExpired: boolean;
    totalSeconds: number;
}

export const useCountdown = (targetDate: Date | null): CountdownResult => {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const targetTime = targetDate?.getTime() ?? null;

    useEffect(() => {
        if (targetTime === null) {
            setTimeLeft(0);
            return;
        }

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const difference = targetTime - now;
            return Math.max(0, Math.floor(difference / 1000));
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetTime]);

    const days = Math.floor(timeLeft / (60 * 60 * 24));
    const hours = Math.floor((timeLeft % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((timeLeft % (60 * 60)) / 60);
    const seconds = timeLeft % 60;

    return {
        formatted: {
            days: String(days).padStart(2, '0'),
            hours: String(hours).padStart(2, '0'),
            minutes: String(minutes).padStart(2, '0'),
            seconds: String(seconds).padStart(2, '0'),
        },
        isExpired: timeLeft === 0,
        totalSeconds: timeLeft,
    };
};
