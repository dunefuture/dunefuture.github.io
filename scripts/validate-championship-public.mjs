// Offline, read-only validator for a proposed sanitized Championship public JSON.
// This does NOT approve publication, fetch Firebase, or modify website files.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readPublicData } from '../championship-standings.mjs';

const input = process.argv[2] ?? 'championship-public.json';
if (process.argv.length > 3) {
  console.error('Usage: node scripts/validate-championship-public.mjs [candidate.json]');
  process.exitCode = 2;
} else {
  try {
    const raw = await readFile(resolve(input), 'utf8');
    const data = JSON.parse(raw);
    const state = readPublicData(data);
    if (data.lineupStatus === 'draft' && state.slots.some(slot => slot.playerName !== null)) {
      throw new Error('Draft publication must not assign player names');
    }
    const matches = state.rounds.reduce((n, round) => n + round.matches.length, 0);
    console.log('PUBLIC_PROJECTION_VALID: schema accepted; slots=' + state.slots.length + '; matches=' + matches + '; status=' + data.lineupStatus);
    console.log('PUBLICATION_NOT_AUTHORIZED: requires independent source, consent, privacy and release approval');
  } catch (error) {
    // Never print candidate JSON or participant details into CI logs.
    console.error('PUBLIC_PROJECTION_INVALID: candidate failed strict public schema validation');
    process.exitCode = 1;
  }
}
