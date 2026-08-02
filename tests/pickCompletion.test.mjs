/**
 * The rule that decides what a mission still has to ask the user.
 *
 * These cases are the ones that actually broke the product: a WINNER DOUBLE
 * selected by a user with no picks was refused by the server with
 * `A complete canonical pick method is required`, and the drawer had no way to
 * resolve it. Each test below names the mission it came from.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { register } from 'node:module';

register('./mission-alias-hooks.mjs', import.meta.url);

const { pickGapsFor, isCompletionSatisfied, toPickPatches } = await import(
  '../src/features/missions/renderers/pick-completion.ts'
);

const offer = (over = {}) => ({
  offerId: 'offer_a',
  missionId: 'CARD-V2-M-011',
  name: 'WINNER DOUBLE',
  description: '',
  difficulty: 'MEDIUM',
  xp: 3,
  interaction: 'COMBO_BUILDER',
  pickEffect: 'UPSERT_MANY',
  selectionPrompt: '',
  ...over,
});

const pick = (boutId, method, round) => ({
  id: `u:${boutId}`,
  user_id: 'u',
  event_id: 1,
  bout_id: boutId,
  picked_fighter_name: 'Someone',
  picked_method: method,
  picked_round: round,
  points_awarded: 0,
  locked: false,
  created_at: '',
});

const combo = (legs) => ({ kind: 'COMBO_BUILDER', legs });

test('a mission that writes no picks never asks for anything', () => {
  const gaps = pickGapsFor(
    offer({ interaction: 'CARD_PROP', pickEffect: 'NONE' }),
    { kind: 'CARD_PROP', choice: 'over' },
    []
  );
  assert.equal(gaps.length, 0);
});

test('WINNER DOUBLE on unpicked bouts asks for a method on both legs', () => {
  const gaps = pickGapsFor(
    offer(),
    combo([
      { key: 'winner_one', boutId: 11, corner: 'red', legLabel: 'Winner 1' },
      { key: 'winner_two', boutId: 12, corner: 'red', legLabel: 'Winner 2' },
    ]),
    []
  );
  assert.deepEqual(
    gaps.map((g) => [g.boutId, g.needsMethod, g.needsRound]),
    [
      [11, true, false],
      [12, true, false],
    ]
  );
});

test('an existing complete pick settles the leg silently', () => {
  const gaps = pickGapsFor(
    offer(),
    combo([
      { key: 'winner_one', boutId: 11, corner: 'red' },
      { key: 'winner_two', boutId: 12, corner: 'red' },
    ]),
    [pick(11, 'DEC'), pick(12, 'KO/TKO', 2)]
  );
  assert.equal(gaps.length, 0, 'nothing to ask once both picks are complete');
});

test('an existing KO pick without a round still needs the round', () => {
  const gaps = pickGapsFor(
    offer(),
    combo([{ key: 'winner_one', boutId: 11, corner: 'red' }]),
    [pick(11, 'KO/TKO', undefined)]
  );
  assert.deepEqual(gaps.map((g) => [g.needsMethod, g.needsRound, g.knownMethod]), [
    [false, true, 'KO/TKO'],
  ]);
});

test('KO LOCK fixes the method and only the round is missing', () => {
  const gaps = pickGapsFor(
    offer({ interaction: 'TARGET_FIGHTER', pickEffect: 'UPSERT_ONE', missionId: 'CARD-V2-M-002' }),
    { kind: 'TARGET_FIGHTER', boutId: 11, corner: 'blue', method: 'KO/TKO' },
    []
  );
  assert.deepEqual(gaps.map((g) => [g.needsMethod, g.needsRound, g.knownMethod]), [
    [false, true, 'KO/TKO'],
  ]);
});

test('a decision never asks for a round', () => {
  const gaps = pickGapsFor(
    offer({ interaction: 'TARGET_FIGHTER', pickEffect: 'UPSERT_ONE' }),
    { kind: 'TARGET_FIGHTER', boutId: 11, corner: 'red', method: 'Decision' },
    []
  );
  assert.equal(gaps.length, 0);
});

test('a FIGHT leg writes no pick and is skipped', () => {
  const gaps = pickGapsFor(
    offer(),
    combo([
      { key: 'the_fight', boutId: 11 },
      { key: 'winner_one', boutId: 12, corner: 'red' },
    ]),
    []
  );
  assert.deepEqual(gaps.map((g) => g.boutId), [12]);
});

test('completion is unsatisfied until every gap is answered', () => {
  const gaps = pickGapsFor(
    offer(),
    combo([
      { key: 'winner_one', boutId: 11, corner: 'red' },
      { key: 'winner_two', boutId: 12, corner: 'red' },
    ]),
    []
  );
  assert.equal(isCompletionSatisfied(gaps, {}), false);
  assert.equal(isCompletionSatisfied(gaps, { 11: { method: 'Decision' } }), false);
  assert.equal(
    isCompletionSatisfied(gaps, { 11: { method: 'Decision' }, 12: { method: 'KO/TKO' } }),
    false,
    'a KO answer still owes a round'
  );
  assert.equal(
    isCompletionSatisfied(gaps, {
      11: { method: 'Decision' },
      12: { method: 'KO/TKO', round: 3 },
    }),
    true
  );
});

test('patches carry only what the mission left open', () => {
  // The round is asked for; the method is the mission's own and must NOT be
  // echoed back, because the server refuses a patch that restates a binding.
  const gaps = pickGapsFor(
    offer({ interaction: 'TARGET_FIGHTER', pickEffect: 'UPSERT_ONE' }),
    { kind: 'TARGET_FIGHTER', boutId: 11, corner: 'red', method: 'Submission' },
    []
  );
  assert.deepEqual(toPickPatches(gaps, { 11: { round: 1 } }), [{ boutId: 11, round: 1 }]);
});

test('choosing a decision drops the round from the patch', () => {
  const gaps = pickGapsFor(
    offer(),
    combo([{ key: 'winner_one', boutId: 11, corner: 'red' }]),
    []
  );
  assert.deepEqual(toPickPatches(gaps, { 11: { method: 'Decision', round: 4 } }), [
    { boutId: 11, method: 'Decision' },
  ]);
});

test('a leg whose method the catalog fixed is never asked about', () => {
  // KO HAT TRICK. The draft carries no method on such a leg — echoing it back
  // is rejected — so the fixed value must be read off the offer instead. Asking
  // the user here produces a server-side method conflict, not a nicer form.
  const koTrick = offer({
    missionId: 'CARD-V2-H-008',
    name: 'KO HAT TRICK',
    legs: [
      { key: 'ko_one', label: 'KO/TKO 1', target: 'FIGHTER', method: 'KO/TKO' },
      { key: 'ko_two', label: 'KO/TKO 2', target: 'FIGHTER', method: 'KO/TKO' },
    ],
  });
  const gaps = pickGapsFor(
    koTrick,
    combo([
      { key: 'ko_one', boutId: 11, corner: 'red' },
      { key: 'ko_two', boutId: 12, corner: 'red' },
    ]),
    []
  );
  assert.deepEqual(
    gaps.map((g) => [g.needsMethod, g.needsRound, g.knownMethod, g.legLabel]),
    [
      [false, true, 'KO/TKO', 'KO/TKO 1'],
      [false, true, 'KO/TKO', 'KO/TKO 2'],
    ],
    'only the round is missing, and each row is named by its leg'
  );
  assert.deepEqual(toPickPatches(gaps, { 11: { round: 1 }, 12: { round: 3 } }), [
    { boutId: 11, round: 1 },
    { boutId: 12, round: 3 },
  ]);
});

test('a leg whose round the catalog fixed needs nothing at all', () => {
  // ROUND LADDER pins R1/R2/R3 per leg; only the method is open.
  const ladder = offer({
    missionId: 'CARD-V2-H-010',
    legs: [{ key: 'round_one', label: 'Round 1', target: 'FIGHTER', round: 1 }],
  });
  const gaps = pickGapsFor(ladder, combo([{ key: 'round_one', boutId: 11, corner: 'red' }]), []);
  assert.deepEqual(gaps.map((g) => [g.needsMethod, g.needsRound]), [[true, false]]);
});
