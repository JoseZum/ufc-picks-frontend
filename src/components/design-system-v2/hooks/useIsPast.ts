'use client';

import { useSyncExternalStore } from 'react';

// Leer Date.now() durante el render da valores inestables entre renders.
// El reloj vive fuera de React y el componente se resuscribe cada minuto.
const TICK_MS = 60_000;

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(onChange: () => void) {
    listeners.add(onChange);
    if (timer === null) {
        timer = setInterval(() => {
            for (const listener of listeners) listener();
        }, TICK_MS);
    }
    return () => {
        listeners.delete(onChange);
        if (listeners.size === 0 && timer !== null) {
            clearInterval(timer);
            timer = null;
        }
    };
}

/**
 * Indica si una fecha ISO ya pasó. Devuelve false en el servidor para que
 * la hidratación no dependa del reloj.
 */
export function useIsPast(isoDate: string | null | undefined): boolean {
    const target = isoDate ? new Date(isoDate).getTime() : null;

    return useSyncExternalStore(
        subscribe,
        () => target !== null && !Number.isNaN(target) && target <= Date.now(),
        () => false
    );
}
