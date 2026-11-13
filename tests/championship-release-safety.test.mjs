import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const file = name => readFile(new URL('../' + name, import.meta.url), 'utf8');

test('CLOSED preview has no executable scripts, form controls or network endpoints', async () => {
  const html = await file('championship-account-preview.html');
  assert.doesNotMatch(html, /<\s*(?:script|form|input|iframe|button)\b/i);
  assert.doesNotMatch(html, /https?:\/\/|<script\b|<iframe\b|fetch\s*\(|XMLHttpRequest|WebSocket/i);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /form-action 'none'/);
});

test('public standings never use registration SDK, private collections or remote endpoints', async () => {
  const js = await file('championship-public.mjs');
  assert.match(js, /championship-public\.json/);
  assert.match(js, /credentials:\s*'omit'/);
  assert.doesNotMatch(js, /firebase|phase1Registrations|phase1Seats|phase1PersonSeats|phase1PersonReviews|discordId|registrationId|https?:\/\//i);
});

test('public JSON stays CLOSED and unassigned until independently approved', async () => {
  const data = JSON.parse(await file('championship-public.json'));
  assert.equal(data.lineupStatus, 'draft');
  assert.equal(data.slots.length, 21);
  assert.ok(data.slots.every(slot => slot.name === null));
  assert.deepEqual(data.matches, []);
});

test('published account preview link never points to an active registration page', async () => {
  const html = await file('championship.html');
  assert.match(html, /href="\.\/championship-account-preview\.html"/);
  assert.match(html, /<button type="button" disabled aria-disabled="true">Registration closed<\/button>/);
  assert.doesNotMatch(html, /href="\.\/registration\/registration\.html"/);
});
