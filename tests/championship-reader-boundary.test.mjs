// Explicit compatibility guard: do not silently treat the legacy Firebase
// participants query as the approved Phase 1 public roster source.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../championship.html', import.meta.url), 'utf8');
const reader = await readFile(new URL('../championship-public.mjs', import.meta.url), 'utf8');

test('public participant reader uses only fixed seat GETs and excludes private collections', () => {
  assert.match(html, /Array\.from\(\{length:21\}/);
  assert.match(html, /getDoc\(doc\(db,"phase1Roster",seat\)\)/);
  assert.match(html, /player\.status!=="approved"/);
  assert.doesNotMatch(html, /where\("status",\s*"==",\s*"approved"\)/);
  assert.doesNotMatch(html, /getDocs\s*\(/);
  assert.doesNotMatch(html, /collection\s*\(\s*db\s*,\s*["']phase1Roster/);
  assert.doesNotMatch(html, /(?:phase1Registrations|phase1PersonReviews|phase1PersonSeats|phase1Audit)/);

});

test('standings use only static public JSON, without Firebase registration imports', () => {
  assert.match(reader, /championship-public\.json/);
  assert.match(reader, /readPublicData/);
  assert.doesNotMatch(reader, /firebase|phase1Registrations|phase1Roster|registrationId|discordId/i);
  assert.match(reader, /credentials:\s*'omit'/);
});
