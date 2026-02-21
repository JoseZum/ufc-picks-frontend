/**
 * Date utilities for UFC events
 *
 * Handles timezone conversion and formatting for events stored in ET (Eastern Time)
 */

import { Event, getEventDateTime } from './api';

/**
 * Format event date for display (e.g., "SAT FEB 07 2026")
 *
 * Usa la fecha tal como está guardada en event.date (YYYY-MM-DD)
 * SIN conversión de timezone para evitar mostrar el día incorrecto.
 */
export function formatEventDate(event: Event | { date: string; start_time_et?: string; timezone?: string }): string {
  // Parsear la fecha directamente sin timezone conversion
  const [year, month, day] = event.date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

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
  // Parse the date directly without timezone conversion
  const [year, month, day] = event.date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);

  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit'
  }).toUpperCase();
}

/**
 * Get days left until event
 *
 * Calcula días hasta el evento usando la fecha y hora ET correctamente
 */
export function getDaysUntilEvent(event: Event | { date: string; start_time_et?: string; timezone?: string }): number {
  const [year, month, day] = event.date.split('-').map(Number);

  // Si hay hora especificada, crear fecha/hora en ET (UTC-5)
  if (event.start_time_et) {
    const [hours, minutes] = event.start_time_et.split(':').map(Number);
    // Crear UTC time: ET time + 5 horas offset
    const eventDateTime = new Date(Date.UTC(year, month - 1, day, hours + 5, minutes, 0));
    const now = new Date();
    const diff = eventDateTime.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  }

  // Si no hay hora, usar final del día
  const eventDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
  const now = new Date();
  const diff = eventDate.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

/**
 * Verifica si un evento todavía debe mostrarse en el frontend.
 *
 * El evento se mantiene visible hasta las 00:00 hora Costa Rica (UTC-6)
 * del día SIGUIENTE a la fecha del evento. Esto da tiempo para que el admin
 * lo marque como completed después de que termine la cartelera.
 */
export function isEventStillVisible(event: Event | { date: string }): boolean {
  const [year, month, day] = event.date.split('-').map(Number);
  // Medianoche Costa Rica (UTC-6) del día siguiente = 06:00 UTC del día +1
  const cutoff = new Date(Date.UTC(year, month - 1, day + 1, 6, 0, 0));
  return new Date() < cutoff;
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
