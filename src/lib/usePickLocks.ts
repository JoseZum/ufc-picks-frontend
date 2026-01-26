/**
 * Hook para manejar el sistema de locks de picks (solo frontend)
 *
 * Los admins pueden lockear/unlockear eventos y peleas individuales.
 * El estado se guarda en localStorage.
 */

import { useState, useEffect } from 'react';

interface PickLocks {
  events: Record<number, boolean>;  // eventId -> isLocked
  bouts: Record<number, boolean>;   // boutId -> isLocked
}

const STORAGE_KEY = 'ufc_picks_locks';

function getLocksFromStorage(): PickLocks {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading locks from localStorage:', error);
  }

  return { events: {}, bouts: {} };
}

function saveLocksToStorage(locks: PickLocks): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locks));
  } catch (error) {
    console.error('Error saving locks to localStorage:', error);
  }
}

export function usePickLocks() {
  const [locks, setLocks] = useState<PickLocks>(getLocksFromStorage);

  // Sincronizar cambios a localStorage
  useEffect(() => {
    saveLocksToStorage(locks);
  }, [locks]);

  const lockEvent = (eventId: number) => {
    setLocks(prev => ({
      ...prev,
      events: { ...prev.events, [eventId]: true }
    }));
  };

  const unlockEvent = (eventId: number) => {
    setLocks(prev => ({
      ...prev,
      events: { ...prev.events, [eventId]: false }
    }));
  };

  const toggleEventLock = (eventId: number) => {
    const isLocked = locks.events[eventId] || false;
    if (isLocked) {
      unlockEvent(eventId);
    } else {
      lockEvent(eventId);
    }
  };

  const isEventLocked = (eventId: number): boolean => {
    return locks.events[eventId] || false;
  };

  const lockBout = (boutId: number) => {
    setLocks(prev => ({
      ...prev,
      bouts: { ...prev.bouts, [boutId]: true }
    }));
  };

  const unlockBout = (boutId: number) => {
    setLocks(prev => ({
      ...prev,
      bouts: { ...prev.bouts, [boutId]: false }
    }));
  };

  const toggleBoutLock = (boutId: number) => {
    const isLocked = locks.bouts[boutId] || false;
    if (isLocked) {
      unlockBout(boutId);
    } else {
      lockBout(boutId);
    }
  };

  const isBoutLocked = (boutId: number): boolean => {
    return locks.bouts[boutId] || false;
  };

  const lockAllBoutsInEvent = (boutIds: number[]) => {
    setLocks(prev => {
      const newBouts = { ...prev.bouts };
      boutIds.forEach(id => {
        newBouts[id] = true;
      });
      return { ...prev, bouts: newBouts };
    });
  };

  const unlockAllBoutsInEvent = (boutIds: number[]) => {
    setLocks(prev => {
      const newBouts = { ...prev.bouts };
      boutIds.forEach(id => {
        newBouts[id] = false;
      });
      return { ...prev, bouts: newBouts };
    });
  };

  const clearAllLocks = () => {
    setLocks({ events: {}, bouts: {} });
  };

  return {
    // Event locks
    lockEvent,
    unlockEvent,
    toggleEventLock,
    isEventLocked,

    // Bout locks
    lockBout,
    unlockBout,
    toggleBoutLock,
    isBoutLocked,

    // Batch operations
    lockAllBoutsInEvent,
    unlockAllBoutsInEvent,

    // Utils
    clearAllLocks,
    locks,
  };
}
