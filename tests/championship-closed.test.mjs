import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const file = name => readFile(new URL('../' + name, import.meta.url), 'utf8');

test('public championship retains disabled registration and a preview-only link', async () => {
  const html = await file('championship.html');
  assert.match(html, /<section id="championshipAuth"[^>]*class="champ-registration-closed"/);
  assert.match(html, /<button type="button" disabled aria-disabled="true">Registration closed<\/button>/);
  assert.match(html, /href="\.\/championship-account-preview\.html"/);
  assert.doesNotMatch(html, /href="\.\/registration\/registration\.html"/);
});

test('account preview is a fail-closed static page with no SDK or forms', async () => {
  const html = await file('championship-account-preview.html');
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
  assert.match(html, /REGISTRATION CLOSED/);
  assert.match(html, /href="\.\/championship\.html"/);
  assert.doesNotMatch(html, /<\s*(?:script|form|input|iframe)\b/i);
  assert.doesNotMatch(html, /firebase(?:-app|-auth|-firestore)|initializeApp|gtag\s*\(|googletagmanager|https?:\/\//i);
});

test('static public standings contain exactly 21 empty slots and no private records', async () => {
  const data = JSON.parse(await file('championship-public.json'));
  assert.equal(data.lineupStatus, 'draft');
  assert.equal(data.slots.length, 21);
  assert.deepEqual(data.slots.map(s => s.id), Array.from({length:21},(_,i)=>String(i+1).padStart(2,'0')));
  for (const slot of data.slots) {
    assert.equal(slot.name, null);
    assert.deepEqual(Object.keys(slot).sort(), ['id','name']);
  }
  assert.deepEqual(data.matches, []);
});
