/**
 * The artwork behind the mission strip.
 *
 * It shipped blank on ordinary events because it read `event_art_url` — the
 * image an admin uploads by hand — instead of the resolution the Home hero and
 * the event detail page already use. Most events have no hand-uploaded art, so
 * the strip was a flat panel on almost every card.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { register } from 'node:module';

register('./mission-alias-hooks.mjs', import.meta.url);

const { toCardContext } = await import(
  '../src/features/missions/gateway/mission-api-mappers.ts'
);

const art = (event) => toCardContext(1, event, []).eventImageUrl;

test('official wide art is used when the event has it', () => {
  assert.equal(
    art({ id: 1, name: 'UFC 320', hero_image_url: 'https://ufc.test/wide.jpg' }),
    'https://ufc.test/wide.jpg'
  );
});

test('an event with only a poster still gets artwork', () => {
  // This is the case that was blank: no hand-uploaded art, no hero, but a
  // perfectly good poster the rest of the product already renders.
  assert.equal(
    art({ id: 1, name: 'UFC 320', poster_image_url: 'https://ufc.test/poster.jpg' }),
    'https://ufc.test/poster.jpg'
  );
});

test('a relative poster is resolved against the API, not left broken', () => {
  const url = art({ id: 1, name: 'UFC 320', poster_image_url: '/events/1/poster' });
  assert.match(url ?? '', /\/events\/1\/poster$/);
  assert.notEqual(url, '/events/1/poster', 'a bare path would 404 from the browser');
});

test('the generic placeholder counts as no art, not as art', () => {
  // Stretching the stand-in SVG across the strip reads as a broken image; the
  // plain panel is the designed empty state.
  assert.equal(art({ id: 1, name: 'UFC 320' }), null);
});

test('no event at all is a null image, never a crash', () => {
  assert.equal(art(undefined), null);
});

test('the card context still carries the name and bouts', () => {
  const context = toCardContext(42, { id: 42, name: 'UFC 320: Local Demo' }, []);
  assert.equal(context.eventId, 42);
  assert.equal(context.eventName, 'UFC 320: Local Demo');
  assert.deepEqual(context.bouts, []);
});

test('a missing event falls back to a neutral card name', () => {
  assert.equal(toCardContext(7, undefined, []).eventName, 'THIS CARD');
});
