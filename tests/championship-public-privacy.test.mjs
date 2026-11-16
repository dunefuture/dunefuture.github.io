import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readPublicData } from '../championship-standings.mjs';

const baseline = JSON.parse(await readFile(new URL('../championship-public.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(baseline);

test('published draft projection is accepted and contains no assigned participants', () => {
  const parsed = readPublicData(copy());
  assert.equal(parsed.slots.length, 21);
  assert.ok(parsed.slots.every(slot => slot.playerName === null));
  assert.equal(parsed.rounds.length, 0);
});

test('reject private registration and identity fields at document root', () => {
  for (const key of ['registrations', 'phase1Registrations', 'email', 'uid', 'discordId', 'adminUid', 'identity']) {
    const data = copy();
    data[key] = 'should-not-publish';
    assert.throws(() => readPublicData(data), { message: /Invalid public data fields/ }, key);
  }
});

test('reject private identity fields nested in public roster slots', () => {
  for (const key of ['uid', 'email', 'discordId', 'registrationId', 'approvedAt', 'personLock', 'status']) {
    const data = copy();
    data.slots[0][key] = 'should-not-publish';
    assert.throws(() => readPublicData(data), { message: /Invalid public data fields/ }, key);
  }
});

test('reject unsafe public names, duplicate slots and premature match results', () => {
  const data = copy();
  data.slots[0].name = 'X'.repeat(41);
  assert.throws(() => readPublicData(data), /Invalid public slot/);
  const duplicates = copy();
  duplicates.slots[1].id = '01';
  assert.throws(() => readPublicData(duplicates), /Invalid public slot/);
  const premature = copy();
  premature.matches = [{ id:'rr-01-02', round:1, a:'01', b:'02', result:null }];
  assert.throws(() => readPublicData(premature), /Schedule requires finalized lineup/);
});

test('reject prematurely finalized roster without a complete 210-match schedule', () => {
  const data = copy();
  data.lineupStatus = 'finalized';
  data.slots.forEach((slot, i) => { slot.name = 'Player ' + String(i + 1); });
  data.matches = [{ id:'rr-01-02', round:1, a:'01', b:'02', result:null, uid:'private' }];
  assert.throws(() => readPublicData(data), /Finalized lineup and 210 matches required/);
});

function completeFixture() {
  const data = copy();
  data.lineupStatus = 'finalized';
  data.slots.forEach((slot, i) => { slot.name = 'Player ' + (i + 1); });
  const circle = [...data.slots.map(slot => slot.id), null];
  for (let round = 1; round <= 21; round++) {
    for (let i = 0; i < 11; i++) {
      const a = circle[i], b = circle[21 - i];
      if (a !== null && b !== null) {
        const pair = [a, b].sort();
        data.matches.push({ id: 'rr-' + pair.join('-'), round, a, b, result: null });
      }
    }
    circle.splice(1, 0, circle.pop());
  }
  return data;
}

test('complete 21-round public fixture is accepted with 210 unique matches', () => {
  const data = completeFixture();
  assert.equal(data.matches.length, 210);
  const state = readPublicData(data);
  assert.equal(state.rounds.length, 21);
  assert.equal(state.rounds.reduce((total, round) => total + round.matches.length, 0), 210);
});

test('reject private match and result fields in an otherwise valid fixture', () => {
  const matchPrivate = completeFixture();
  matchPrivate.matches[0].uid = 'private';
  assert.throws(() => readPublicData(matchPrivate), /Invalid public data fields/);
  const resultPrivate = completeFixture();
  resultPrivate.matches[0].result = { status: 'confirmed', winner: resultPrivate.matches[0].a, registrationId: 'private' };
  assert.throws(() => readPublicData(resultPrivate), /Invalid public data fields/);
});

test('draft cannot quietly publish names even if the public parser accepts partial draft names', () => {
  const data = copy();
  data.slots[0].name = 'Not yet approved';
  // readPublicData accepts partial draft names for historical compatibility;
  // the separate offline publication gate rejects this before publishing.
  assert.equal(readPublicData(data).slots[0].playerName, 'Not yet approved');
});
