/**
 * The Admin panel's monthly block, over the real endpoint.
 *
 * This existed only as a hard-coded object: state `ACTIVE`, name `—`, no
 * parameters. An operator looking at a DRAFT month was told it was live, which
 * is the one thing an operations screen must never do.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { register } from 'node:module';

register('./mission-alias-hooks.mjs', import.meta.url);

const { toAdminMonthly } = await import(
  '../src/features/missions/gateway/mission-api-mappers.ts'
);
const { createHttpMissionGateway } = await import(
  '../src/features/missions/gateway/http-mission-gateway.ts'
);

/** Exactly what `GET /admin/missions/monthly/{key}` serves. */
const PAYLOAD = {
  month_key: '2026-08',
  mission_id: 'MONTH-V2-001',
  name: 'WIN TARGET',
  description: 'Correctly predict at least N fight winners across all cards this month.',
  state: 'ACTIVE',
  xp: 15,
  parameters: { winner_target: 15 },
  starts_at: '2026-08-01T00:00:00Z',
  ends_at: '2026-08-31T23:59:59.999Z',
  activated_at: '2026-08-03T00:34:46.825Z',
  closed_at: null,
  editable: false,
};

function gatewayFor(handler) {
  return createHttpMissionGateway({
    baseUrl: 'http://api.test',
    getToken: () => 'token',
    fetchImpl: async (url, init) => handler(String(url), init ?? {}),
  });
}

const ok = (body) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

/** `GET /admin/missions/monthly/templates`. Labels and bounds live here. */
const TEMPLATES = [
  {
    mission_id: 'MONTH-V2-001',
    name: 'WIN TARGET',
    description: '',
    xp: 15,
    compatibility: 'V1_READY',
    parameters: [
      {
        key: 'winner_target',
        label: 'Winners required',
        kind: 'COUNT',
        default: 15,
        minimum: 5,
        maximum: 60,
      },
    ],
  },
  {
    mission_id: 'MONTH-V2-002',
    name: 'ACCURACY TARGET',
    description: '',
    xp: 15,
    compatibility: 'V1_READY',
    parameters: [],
  },
];

test('the month renders its real name, state and parameters', () => {
  const vm = toAdminMonthly(PAYLOAD, TEMPLATES);
  assert.equal(vm.state, 'ACTIVE');
  assert.equal(vm.templateName, 'WIN TARGET');
  assert.equal(vm.templateId, 'MONTH-V2-001');
  assert.equal(vm.monthLabel, 'AUGUST 2026');
  assert.deepEqual(vm.params, [
    // The reviewed label and bounds, not a prettified version of the key.
    { key: 'winner_target', label: 'Winners required', value: 15, min: 5, max: 60 },
  ]);
});

test('every template is offered, so a month is not stuck on one option', () => {
  const vm = toAdminMonthly(PAYLOAD, TEMPLATES);
  assert.deepEqual(vm.templates, [
    { id: 'MONTH-V2-001', name: 'WIN TARGET' },
    { id: 'MONTH-V2-002', name: 'ACCURACY TARGET' },
  ]);
});

test('without templates the value is still right, only the label is poorer', () => {
  // The templates read is allowed to fail on its own; losing a nice label must
  // never cost the operator the number they are about to edit.
  const vm = toAdminMonthly(PAYLOAD);
  assert.deepEqual(vm.params, [{ key: 'winner_target', label: 'winner target', value: 15 }]);
  assert.equal(vm.templates, undefined);
});

test('a DRAFT month is reported as DRAFT, not as live', () => {
  const vm = toAdminMonthly({ ...PAYLOAD, state: 'DRAFT', editable: true });
  assert.equal(vm.state, 'DRAFT');
  assert.equal(vm.validationNote, undefined, 'an editable month carries no lock note');
});

test('an uneditable month says why the form is locked', () => {
  const vm = toAdminMonthly(PAYLOAD);
  assert.match(vm.validationNote ?? '', /Locked/);
});

test('a month with no parameters renders no rows rather than crashing', () => {
  const vm = toAdminMonthly({ ...PAYLOAD, parameters: undefined });
  assert.deepEqual(vm.params, []);
});

test('getMonthly reads the month and the templates it is labelled from', async () => {
  const seen = [];
  const gateway = gatewayFor((url) => {
    seen.push(url);
    return ok(url.endsWith('templates') ? TEMPLATES : PAYLOAD);
  });

  const vm = await gateway.admin.getMonthly('2026-08');

  assert.deepEqual(seen.sort(), [
    'http://api.test/admin/missions/monthly/2026-08',
    'http://api.test/admin/missions/monthly/templates',
  ]);
  assert.equal(vm.templateName, 'WIN TARGET');
  assert.equal(vm.params[0].label, 'Winners required');
});

test('a failing templates read still yields a usable month', async () => {
  const gateway = gatewayFor((url) =>
    url.endsWith('templates')
      ? new Response('nope', { status: 500 })
      : ok(PAYLOAD)
  );

  const vm = await gateway.admin.getMonthly('2026-08');

  assert.equal(vm.templateName, 'WIN TARGET');
  assert.equal(vm.params[0].value, 15, 'the number survives a lost label');
});

test('activate and close POST to their own paths and return the new state', async () => {
  const seen = [];
  const gateway = gatewayFor((url, init) => {
    seen.push(`${init.method ?? 'GET'} ${url}`);
    return ok({ ...PAYLOAD, state: url.endsWith('close') ? 'CLOSED' : 'ACTIVE' });
  });

  const activated = await gateway.admin.actOnMonthly({
    monthKey: '2026-08',
    action: 'activate',
  });
  const closed = await gateway.admin.actOnMonthly({
    monthKey: '2026-08',
    action: 'close',
  });

  assert.deepEqual(seen, [
    'POST http://api.test/admin/missions/monthly/2026-08/activate',
    'POST http://api.test/admin/missions/monthly/2026-08/close',
  ]);
  assert.equal(activated.state, 'ACTIVE');
  assert.equal(closed.state, 'CLOSED');
});

test('the card reports how many missions a VOID would settle', async () => {
  const gateway = gatewayFor(() =>
    ok({
      event_id: 90001,
      state: 'OPEN',
      voided_assignments: 0,
      selected_assignments: 3,
      revision: 0,
    })
  );

  const vm = await gateway.admin.getCardControl(90001);

  assert.equal(vm.selectedAssignments, 3);
  assert.equal(vm.voidedAssignments, 0, 'nothing voided is not the same as nothing chosen');
});

test('an older payload without the count degrades to zero, not to NaN', async () => {
  const gateway = gatewayFor(() => ok({ event_id: 1, state: 'OPEN' }));
  const vm = await gateway.admin.getCardControl(1);
  assert.equal(vm.selectedAssignments, 0);
});

test('a month can be drafted, which is what the panel could not do', async () => {
  // The panel could activate and close a month but never author one, so a
  // month nobody had drafted showed "NOT CONFIGURED" with no way forward.
  const seen = [];
  const gateway = gatewayFor((url, init) => {
    seen.push({ method: init.method ?? 'GET', url, body: init.body });
    return ok(url.endsWith('templates') ? TEMPLATES : { ...PAYLOAD, state: 'DRAFT' });
  });

  const vm = await gateway.admin.saveMonthly({
    monthKey: '2026-08',
    missionId: 'MONTH-V2-001',
    parameters: { winner_target: 20 },
  });

  const put = seen.find((call) => call.method === 'PUT');
  assert.ok(put, 'the draft is written with PUT');
  assert.equal(put.url, 'http://api.test/admin/missions/monthly/2026-08');
  assert.deepEqual(JSON.parse(put.body), {
    mission_id: 'MONTH-V2-001',
    parameters: { winner_target: 20 },
  });
  assert.equal(vm.state, 'DRAFT');
});

test('saving without parameters lets the catalog defaults stand', async () => {
  const seen = [];
  const gateway = gatewayFor((url, init) => {
    seen.push(init.body);
    return ok(url.endsWith('templates') ? TEMPLATES : PAYLOAD);
  });

  await gateway.admin.saveMonthly({ monthKey: '2026-08', missionId: 'MONTH-V2-002' });

  const body = JSON.parse(seen.find((b) => b) ?? '{}');
  assert.deepEqual(body, { mission_id: 'MONTH-V2-002' });
  assert.equal('parameters' in body, false, 'omitted, not sent as empty');
});

test('the template list is fetchable on its own for an unconfigured month', async () => {
  const gateway = gatewayFor(() => ok(TEMPLATES));
  const templates = await gateway.admin.getMonthlyTemplates();
  assert.equal(templates.length, 2);
  assert.equal(templates[0].parameters[0].label, 'Winners required');
});
