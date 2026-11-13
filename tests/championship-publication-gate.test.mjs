import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const validator = new URL('../scripts/validate-championship-public.mjs', import.meta.url).pathname;
const baseline = JSON.parse(await readFile(new URL('../championship-public.json', import.meta.url), 'utf8'));

async function check(candidate, expectedStatus) {
  const dir = await mkdtemp(join(tmpdir(), 'championship-public-gate-'));
  try {
    const path = join(dir, 'candidate.json');
    await writeFile(path, JSON.stringify(candidate));
    const result = spawnSync(process.execPath, [validator, path], { encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, expectedStatus, result.stderr);
    assert.doesNotMatch(result.stdout + result.stderr, /private-secret-identifier/);
    return result;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('offline publication gate accepts current empty CLOSED draft', async () => {
  const result = await check(baseline, 0);
  assert.match(result.stdout, /PUBLIC_PROJECTION_VALID/);
  assert.match(result.stdout, /PUBLICATION_NOT_AUTHORIZED/);
});

test('offline publication gate rejects partial draft name even when parser supports it', async () => {
  const data = structuredClone(baseline);
  data.slots[0].name = 'private-secret-identifier';
  const result = await check(data, 1);
  assert.match(result.stderr, /PUBLIC_PROJECTION_INVALID/);
});

test('offline publication gate rejects private fields and does not echo them', async () => {
  const data = structuredClone(baseline);
  data.slots[0].email = 'private-secret-identifier';
  await check(data, 1);
});

test('offline publication gate rejects a malformed roster without leaking input', async () => {
  const data = structuredClone(baseline);
  data.slots = [{ id: '01', name: null, uid: 'private-secret-identifier' }];
  await check(data, 1);
});

test('offline publication gate rejects invalid match records without echoing secrets', async () => {
  const data = structuredClone(baseline);
  data.matches = [{ id: 'private-secret-identifier', round: 1, a: '01', b: '02', result: null }];
  await check(data, 1);
});

test('offline publication gate rejects unknown root fields', async () => {
  const data = structuredClone(baseline);
  data.privateSource = 'private-secret-identifier';
  await check(data, 1);
});
