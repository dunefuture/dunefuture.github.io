import { emptyPublicState, readPublicData, leaderboard, rewardReview } from './championship-standings.mjs?v=20261023';
const body = document.getElementById('championshipStandingsBody');
const message = document.getElementById('championshipStandingsStatus');
function cell(text) { const td = document.createElement('td'); td.textContent = text; return td; }
function render(state) {
  body.replaceChildren(...leaderboard(state).map((row, index) => {
    const tr = document.createElement('tr');
    tr.dataset.position = String(index + 1).padStart(2, '0');
    if (index < 3) tr.className = 'champ-reward-position';
    tr.append(cell(tr.dataset.position), cell(row.playerName ? `${row.rank}${row.sharedRank ? ' (shared)' : ''}` : '—'), cell(row.playerName || 'TBA'), cell(row.played), cell(row.wins), cell(row.losses), cell(row.points));
    if (index < 3) { const badge = document.createElement('small'); badge.textContent = '🏆 REWARD POSITION'; tr.firstElementChild.append(badge); }
    if (row.playerName && row.administratorReviewRequired) { const note = document.createElement('small'); note.textContent = 'Provisional · review required'; tr.children[1].append(note); }
    return tr;
  }));
  const anyNames = state.slots.some(slot => slot.playerName);
  message.textContent = anyNames ? rewardReview(state).status : 'Lineup to be announced. All positions are unassigned; no results or winners have been confirmed.';
}
render(emptyPublicState());
try {
  const response = await fetch(new URL('./championship-public.json', import.meta.url), { cache: 'no-store', credentials: 'omit' });
  if (!response.ok) throw new Error('Standings unavailable');
  render(readPublicData(await response.json()));
} catch {
  message.textContent = 'Published standings are currently unavailable. Positions remain visible as TBA; no results are inferred. Please try again later.';
}
