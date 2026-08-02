import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allowedMethodsFor,
  isDraftComplete,
} from '../src/features/missions/renderers/draft-validation.ts';
import {
  instructionLabelFor,
  saysTheSameThing,
} from '../src/features/missions/renderers/instruction-copy.ts';
import {
  LAB_BOUTS,
  LAB_SCENARIOS,
  SLOT_1_OFFERS,
  SLOT_2_OFFERS,
  SLOT_3_OFFERS,
  HOME_SCENARIOS,
  PROFILE_SCENARIOS,
  ADMIN_SCENARIOS,
} from '../src/features/missions/fixtures/mission-scenarios.ts';

const offerById = (id) =>
  [...SLOT_1_OFFERS, ...SLOT_2_OFFERS, ...SLOT_3_OFFERS].find((o) => o.offerId === id);

test('every lab scenario id resolves to fixture data', () => {
  for (const scenario of LAB_SCENARIOS) {
    if (scenario.edge) continue;
    const source =
      scenario.surface === 'home'
        ? HOME_SCENARIOS
        : scenario.surface === 'profile'
          ? PROFILE_SCENARIOS
          : ADMIN_SCENARIOS;
    assert.ok(source[scenario.id], `missing fixture for ${scenario.id}`);
  }
});

test('the five interaction families are all represented in the offers', () => {
  const families = new Set(
    [...SLOT_1_OFFERS, ...SLOT_2_OFFERS, ...SLOT_3_OFFERS].map((o) => o.interaction)
  );
  for (const family of ['AUTO', 'TARGET_FIGHTER', 'TARGET_FIGHT', 'COMBO_BUILDER', 'CARD_PROP']) {
    assert.ok(families.has(family), `missing family ${family}`);
  }
});

test('AUTO missions are complete without a target payload', () => {
  const auto = offerById('off-1-easy');
  assert.equal(isDraftComplete(auto, null), false);
  assert.equal(isDraftComplete(auto, { kind: 'AUTO' }), true);
});

test('EXACT SCRIPT requires fighter, method and round with no exceptions', () => {
  const exactScript = offerById('off-1-hard');
  const base = { kind: 'TARGET_FIGHTER', boutId: 1139707, corner: 'red' };
  assert.equal(isDraftComplete(exactScript, base), false);
  assert.equal(isDraftComplete(exactScript, { ...base, method: 'KO/TKO' }), false);
  assert.equal(isDraftComplete(exactScript, { ...base, method: 'Submission' }), false);
  assert.equal(isDraftComplete(exactScript, { ...base, round: 1 }), false);
  assert.equal(isDraftComplete(exactScript, { ...base, method: 'KO/TKO', round: 1 }), true);
});

test('EXACT SCRIPT never accepts Decision, with or without a round', () => {
  const exactScript = offerById('off-1-hard');
  const base = { kind: 'TARGET_FIGHTER', boutId: 1139707, corner: 'red' };
  assert.equal(isDraftComplete(exactScript, { ...base, method: 'Decision' }), false);
  assert.equal(isDraftComplete(exactScript, { ...base, method: 'Decision', round: 3 }), false);
});

test('a round-exact mission never offers Decision in its method list', () => {
  const exactScript = offerById('off-1-hard');
  assert.deepEqual(allowedMethodsFor(exactScript), ['KO/TKO', 'Submission']);
  // Even a definition that wrongly declared Decision gets it filtered out.
  assert.deepEqual(
    allowedMethodsFor({ ...exactScript, allowedMethods: ['KO/TKO', 'Decision'] }),
    ['KO/TKO']
  );
});

test('a method mission without an exact round keeps all declared methods', () => {
  const submissionLock = offerById('off-1-med');
  assert.deepEqual(allowedMethodsFor(submissionLock), ['KO/TKO', 'Submission', 'Decision']);
});

test('every bout carries the rounds it is booked for', () => {
  for (const bout of LAB_BOUTS) {
    assert.ok(
      bout.roundsScheduled === 3 || bout.roundsScheduled === 5,
      `${bout.weightClass} has an impossible round count`
    );
  }
  const mainEvent = LAB_BOUTS.find((b) => b.isMainEvent);
  assert.equal(mainEvent.roundsScheduled, 5);
});

test('combo builder only completes at its exact leg count', () => {
  const methodCycle = offerById('off-3-hard');
  const leg = (boutId) => ({ boutId, corner: 'red' });
  assert.equal(isDraftComplete(methodCycle, { kind: 'COMBO_BUILDER', legs: [leg(1139707)] }), false);
  assert.equal(
    isDraftComplete(methodCycle, {
      kind: 'COMBO_BUILDER',
      legs: [leg(1139707), leg(1139708), leg(1136494)],
    }),
    true
  );
});

test('card prop kinds gate on their own payload', () => {
  const accept = offerById('off-3-easy');
  const choice = offerById('off-2-easy');
  const exact = offerById('off-2-hard');
  assert.equal(isDraftComplete(accept, { kind: 'CARD_PROP' }), true);
  assert.equal(isDraftComplete(choice, { kind: 'CARD_PROP' }), false);
  assert.equal(isDraftComplete(choice, { kind: 'CARD_PROP', choice: 'FINISHES' }), true);
  assert.equal(isDraftComplete(exact, { kind: 'CARD_PROP' }), false);
  assert.equal(isDraftComplete(exact, { kind: 'CARD_PROP', exactCount: 0 }), true);
});

test('a prompt that repeats the description is not shown twice', () => {
  assert.equal(
    saysTheSameThing(
      'Choose one fighter to win by submission',
      'Choose one fighter to win by submission.'
    ),
    true
  );
  assert.equal(
    saysTheSameThing('Choose the exact finish count', 'Choose the exact number of finishes.'),
    false
  );
  assert.equal(
    instructionLabelFor(
      'Choose one fighter to win by submission',
      'Choose one fighter to win by submission.'
    ),
    null
  );
  assert.equal(
    instructionLabelFor('Choose 2 fighters to win', 'Build a 2-fighter combo; both must win.'),
    'Choose 2 fighters to win'
  );
  // A mission with no selection prompt still gets a heading.
  assert.equal(instructionLabelFor(undefined, 'Predict the main-event winner.'), 'HOW IT IS TRACKED');
});

test('offer XP stays inside the approved tier ranges', () => {
  const ranges = { EASY: [1, 2], MEDIUM: [3, 5], HARD: [6, 15] };
  for (const offer of [...SLOT_1_OFFERS, ...SLOT_2_OFFERS, ...SLOT_3_OFFERS]) {
    const [min, max] = ranges[offer.difficulty];
    assert.ok(
      offer.xp >= min && offer.xp <= max,
      `${offer.name} (${offer.difficulty}) has out-of-range XP ${offer.xp}`
    );
  }
});
