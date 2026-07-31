import type { Bout, CardSection, Event } from './api';

export const CARD_SECTION_ORDER: CardSection[] = ['main', 'prelim', 'early_prelim'];

export const CARD_SECTION_LABELS: Record<CardSection, string> = {
  main: 'MAIN CARD',
  prelim: 'PRELIMS',
  early_prelim: 'EARLY PRELIMS',
};

export function normalizeCardSection(section?: string | null): CardSection {
  if (section === 'prelim' || section === 'early_prelim') return section;
  return 'main';
}

export function groupBoutsBySection(bouts: Bout[]): Record<CardSection, Bout[]> {
  return bouts.reduce<Record<CardSection, Bout[]>>(
    (groups, bout) => {
      groups[normalizeCardSection(bout.card_section)].push(bout);
      return groups;
    },
    { main: [], prelim: [], early_prelim: [] }
  );
}

export function isBoutEffectivelyLocked(
  event: Event,
  bout: Bout,
  now = new Date()
): boolean {
  const result = bout.result;
  const hasResult =
    !!result &&
    (result.outcome != null ||
      result.winner === 'red' ||
      result.winner === 'blue' ||
      !!result.method ||
      result.round !== undefined ||
      !!result.time);
  if (hasResult) return true;
  if (event.status !== 'scheduled' || bout.status !== 'scheduled') return true;

  if (
    event.picks_lock_override === 'locked' ||
    (event.picks_lock_override == null && !!event.picks_locked)
  ) {
    return true;
  }
  if (
    bout.picks_lock_override === 'locked' ||
    (bout.picks_lock_override == null && !!bout.picks_locked)
  ) {
    return true;
  }

  // Manual unlocks intentionally override a section time that already passed.
  // An individual explicit lock was handled above and survives a full-event unlock.
  if (event.picks_lock_override === 'unlocked') return false;
  if (bout.picks_lock_override === 'unlocked') return false;

  const automaticLock =
    bout.automatic_lock_time_utc ??
    getSectionLockIso(event, normalizeCardSection(bout.card_section)) ??
    event.picks_lock_time_utc ??
    event.card_start_time_utc;
  if (automaticLock) {
    const automaticLockMs = new Date(automaticLock).getTime();
    if (!Number.isNaN(automaticLockMs) && now.getTime() >= automaticLockMs) return true;
  }

  // The backend remains authoritative for any lock reason not represented in
  // older clients' event payloads.
  return bout.effective_picks_locked === true;
}

export function getSectionStartIso(event: Event, section: CardSection): string | undefined {
  return event.section_start_times_utc?.[section];
}

export function getSectionLockIso(event: Event, section: CardSection): string | undefined {
  return event.section_lock_times_utc?.[section] ?? getSectionStartIso(event, section);
}

export function formatSectionTime(
  value?: string | null,
  locale = 'en-US',
  timeZone?: string
): string {
  if (!value) return 'TIME TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TIME TBD';

  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  });
}

export function isoToLocalDateTimeInput(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function localDateTimeInputToUtcIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function shiftLocalDateTime(value: string, deltaMs: number): string {
  if (!value) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return isoToLocalDateTimeInput(new Date(date.getTime() + deltaMs).toISOString());
}

export interface NextSectionLock {
  section: CardSection;
  at: Date;
}

export function getNextSectionLock(
  event: Event,
  bouts: Bout[],
  now = new Date()
): NextSectionLock | null {
  const groups = groupBoutsBySection(bouts);
  const futureOpenSections = CARD_SECTION_ORDER.flatMap((section) => {
    const iso = getSectionLockIso(event, section);
    if (!iso || groups[section].length === 0) return [];
    if (!groups[section].some((bout) => !isBoutEffectivelyLocked(event, bout, now))) return [];

    const at = new Date(iso);
    if (Number.isNaN(at.getTime()) || at.getTime() <= now.getTime()) return [];
    return [{ section, at }];
  });

  return futureOpenSections.sort((a, b) => a.at.getTime() - b.at.getTime())[0] ?? null;
}

export function getMostRecentlyLockedSection(
  event: Event,
  bouts: Bout[],
  now = new Date()
): CardSection | null {
  const groups = groupBoutsBySection(bouts);
  const locked = CARD_SECTION_ORDER.flatMap((section) => {
    const iso = getSectionLockIso(event, section);
    if (!iso || groups[section].length === 0) return [];
    const at = new Date(iso);
    if (Number.isNaN(at.getTime()) || at.getTime() > now.getTime()) return [];
    if (!groups[section].every((bout) => isBoutEffectivelyLocked(event, bout, now))) return [];
    return [{ section, at }];
  });

  return locked.sort((a, b) => b.at.getTime() - a.at.getTime())[0]?.section ?? null;
}
