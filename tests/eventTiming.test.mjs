import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatSectionTime,
  getMostRecentlyLockedSection,
  getNextSectionLock,
  getSectionLockIso,
  groupBoutsBySection,
  isoToLocalDateTimeInput,
  isBoutEffectivelyLocked,
  localDateTimeInputToUtcIso,
  normalizeCardSection,
  shiftLocalDateTime,
} from '../src/lib/eventTiming.ts';
import { getEventDateTime } from '../src/lib/api.ts';

const event = (overrides = {}) => ({
  id: 1,
  name: 'UFC Test',
  date: '2026-08-15',
  status: 'scheduled',
  total_bouts: 3,
  promotion: 'UFC',
  ...overrides,
});

const bout = (id, cardSection, overrides = {}) => ({
  id,
  event_id: 1,
  weight_class: 'Lightweight',
  gender: 'male',
  rounds_scheduled: 3,
  is_title_fight: false,
  status: 'scheduled',
  card_section: cardSection,
  fighters: { red: { fighter_name: 'Red', corner: 'red' }, blue: { fighter_name: 'Blue', corner: 'blue' } },
  ...overrides,
});

test('normalizes legacy or missing sections to main without position slicing', () => {
  assert.equal(normalizeCardSection(undefined), 'main');
  assert.equal(normalizeCardSection('unexpected'), 'main');
  assert.equal(normalizeCardSection('early_prelim'), 'early_prelim');
});

test('groups bouts using card_section and preserves their API order', () => {
  const groups = groupBoutsBySection([
    bout(1, 'early_prelim'),
    bout(2, 'main'),
    bout(3, 'prelim'),
    bout(4, 'main'),
  ]);
  assert.deepEqual(groups.main.map(({ id }) => id), [2, 4]);
  assert.deepEqual(groups.prelim.map(({ id }) => id), [3]);
  assert.deepEqual(groups.early_prelim.map(({ id }) => id), [1]);
});

test('explicit admin unlock overrides legacy flags and stale backend lock snapshots', () => {
  const scheduledEvent = event({ picks_locked: true, picks_lock_override: 'unlocked' });
  assert.equal(
    isBoutEffectivelyLocked(scheduledEvent, bout(1, 'main', { effective_picks_locked: true })),
    false
  );
});

test('explicit backend lock remains authoritative for reasons unavailable to legacy payloads', () => {
  assert.equal(
    isBoutEffectivelyLocked(event(), bout(2, 'main', { effective_picks_locked: true })),
    true
  );
});

test('a final result always locks the fight even when an override says unlocked', () => {
  const withResult = bout(1, 'main', {
    effective_picks_locked: false,
    result: { winner: 'red', method: 'DEC' },
  });
  assert.equal(isBoutEffectivelyLocked(event(), withResult), true);
});

test('legacy records fall back to event and bout manual lock flags', () => {
  assert.equal(isBoutEffectivelyLocked(event({ picks_locked: true }), bout(1, 'main')), true);
  assert.equal(isBoutEffectivelyLocked(event(), bout(1, 'main', { picks_locked: true })), true);
  assert.equal(isBoutEffectivelyLocked(event(), bout(1, 'main')), false);
});

test('section lock time falls back to its broadcast start', () => {
  const data = event({
    section_start_times_utc: { prelim: '2026-08-15T21:00:00Z' },
  });
  assert.equal(getSectionLockIso(data, 'prelim'), '2026-08-15T21:00:00Z');
});

test('browser lock state advances when a section boundary passes after fetch', () => {
  const data = event({
    section_lock_times_utc: { prelim: '2026-08-15T21:00:00Z' },
  });
  assert.equal(
    isBoutEffectivelyLocked(
      data,
      bout(1, 'prelim', { effective_picks_locked: false }),
      new Date('2026-08-15T21:00:00Z')
    ),
    true
  );
});

test('countdown selects the earliest future section that still has open picks', () => {
  const data = event({
    section_lock_times_utc: {
      main: '2026-08-16T00:00:00Z',
      prelim: '2026-08-15T22:00:00Z',
      early_prelim: '2026-08-15T20:00:00Z',
    },
  });
  const fights = [
    bout(1, 'main', { effective_picks_locked: false }),
    bout(2, 'prelim', { effective_picks_locked: false }),
    bout(3, 'early_prelim', { effective_picks_locked: true }),
  ];
  const next = getNextSectionLock(data, fights, new Date('2026-08-15T19:00:00Z'));
  assert.equal(next?.section, 'prelim');
  assert.equal(next?.at.toISOString(), '2026-08-15T22:00:00.000Z');
});

test('reports the most recently closed fully locked section', () => {
  const data = event({
    section_lock_times_utc: {
      prelim: '2026-08-15T22:00:00Z',
      early_prelim: '2026-08-15T20:00:00Z',
    },
  });
  const fights = [
    bout(1, 'prelim', { effective_picks_locked: true }),
    bout(2, 'early_prelim', { effective_picks_locked: true }),
  ];
  assert.equal(
    getMostRecentlyLockedSection(data, fights, new Date('2026-08-15T23:00:00Z')),
    'prelim'
  );
});

test('admin datetime helpers round-trip browser local time to UTC', () => {
  const utc = '2026-08-15T19:30:00.000Z';
  const local = isoToLocalDateTimeInput(utc);
  assert.equal(localDateTimeInputToUtcIso(local), utc);
  assert.equal(
    localDateTimeInputToUtcIso(shiftLocalDateTime(local, 60 * 60 * 1000)),
    '2026-08-15T20:30:00.000Z'
  );
  assert.notEqual(formatSectionTime(utc), 'TIME TBD');
});

test('legacy ET fallback honors summer daylight saving time', () => {
  assert.equal(
    getEventDateTime(event({ date: '2026-08-15', start_time_et: '15:00' })).toISOString(),
    '2026-08-15T19:00:00.000Z'
  );
});

test('legacy ET fallback honors winter standard time', () => {
  assert.equal(
    getEventDateTime(event({ date: '2026-01-15', start_time_et: '15:00' })).toISOString(),
    '2026-01-15T20:00:00.000Z'
  );
});
