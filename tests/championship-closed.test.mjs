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

test('preview has responsive viewport, readable focus treatment and no remote dependencies', async () => {
  const html = await file('championship-account-preview.html');
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(html, /width:min\(100%,640px\)/);
  assert.match(html, /clamp\(24px,5vw,48px\)/);
  assert.match(html, /a:focus-visible/);
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /<\s*(?:link|img|video|audio)\b/i);
});

test('existing public participants reader is read-only and not confused with enrollment ledger', async () => {
  const html = await file('championship.html');
  const start = html.indexOf('const participantsRef = collection(');
  assert.ok(start >= 0, 'existing approved participants reader must be reviewed if removed');
  const reader = html.slice(start, html.indexOf('loadChampionshipParticipants();', start));
  assert.match(reader, /"tournaments",\s*"dune-future-championship-2027",\s*"participants"/);
  assert.match(reader, /where\("status",\s*"==",\s*"approved"\)/);
  assert.doesNotMatch(reader, /\b(?:setDoc|addDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\s*\(/);
  assert.doesNotMatch(reader, /["'](?:phase1Registrations|registrations|phase1PersonReviews|phase1PersonSeats|phase1Audit)["']/);
});

test('CLOSED preview enforces deny-by-default browser content policy', async () => {
  const html = await file('championship-account-preview.html');
  const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
  assert.ok(csp, 'CSP meta policy required');
  for (const directive of ["default-src 'none'", "connect-src 'none'", "form-action 'none'", "object-src 'none'", "frame-src 'none'"]) {
    assert.ok(csp[1].includes(directive), 'missing CSP directive: ' + directive);
  }
});
