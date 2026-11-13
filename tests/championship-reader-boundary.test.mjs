// Explicit compatibility guard: do not silently treat the legacy Firebase
// participants query as the approved Phase 1 public roster source.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../championship.html', import.meta.url), 'utf8');
const reader = await readFile(new URL('../championship-public.mjs', import.meta.url), 'utf8');

test('legacy Firebase participant reader remains isolated and requires review before replacement', () => {
  assert.match(html, /where\("status",\s*"==",\s*"approved"\)/);
  assert.match(html, /"participants"/);
  assert.doesNotMatch(html, /collection\([^)]*["']phase1Registrations["']/);
  assert.doesNotMatch(html, /collection\([^)]*["']phase1Roster["']/);
});

test('standings use only static public JSON, without Firebase registration imports', () => {
  assert.match(reader, /championship-public\.json/);
  assert.match(reader, /readPublicData/);
  assert.doesNotMatch(reader, /firebase|phase1Registrations|phase1Roster|registrationId|discordId/i);
  assert.match(reader, /credentials:\s*'omit'/);
});
