/**
 * Date utilities for UFC events
 *
 * Handles timezone conversion and formatting for events stored in ET (Eastern Time)
 */

import { Event, getEventDateTime } from './api';

/**
 * Format event date for display (e.g., "SAT FEB 07 2026")
 */
export function formatEventDate(event: Event | { date: string; start_time_et?: string; timezone?: string }): string {
  const dateObj = getEventDateTime(event as Event);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).toUpperCase();
}

/**
 * Format event date short (e.g., "FEB 07")
 */
export function formatEventDateShort(event: Event | { date: string; start_time_et?: string; timezone?: string }): string {
  const dateObj = getEventDateTime(event as Event);
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit'
  }).toUpperCase();
}

/**
 * Get days left until event
 */
export function getDaysUntilEvent(event: Event | { date: string; start_time_et?: string; timezone?: string }): number {
  const dateObj = getEventDateTime(event as Event);
  const now = new Date();
  const diff = dateObj.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

/**
 * Format days left until event for display
 */
export function formatDaysLeft(event: Event | { date: string; start_time_et?: string; timezone?: string }): string {
  const days = getDaysUntilEvent(event);
  if (days < 0) return 'PAST';
  if (days === 0) return 'TODAY';
  if (days === 1) return '1 DAY';
  return `${days} DAYS`;
}
