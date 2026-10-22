// Read-only standings. Ranking functions preserved from the verified backup.
export function leaderboard(state) {
  const rows = state.slots.map(slot => ({
    id: slot.id, playerName: slot.playerName, played: 0, wins: 0, losses: 0, points: 0
  }));
  const byId = new Map(rows.map(row => [row.id, row]));
  const seen = new Set();
  const confirmed = [];
  for (const match of state.rounds.flatMap(round => round.matches)) {
    if (seen.has(match.id)) throw new Error('Duplicate schedule match');
    seen.add(match.id);
    const result = state.results[match.id];
    if (!result || result.status !== 'confirmed') continue;
    if (![match.a, match.b].includes(result.winner)) throw new Error('Invalid confirmed winner');
    confirmed.push({ ...match, winner: result.winner });
    const winner = byId.get(result.winner);
    const loser = byId.get(result.winner === match.a ? match.b : match.a);
    winner.wins++; winner.played++; winner.points += 5;
    loser.losses++; loser.played++;
  }
  rows.sort((a, b) => b.points - a.points);
  const ranked = [];
  for (let start = 0; start < rows.length;) {
    let end = start + 1;
    while (end < rows.length && rows[end].points === rows[start].points) end++;
    const group = rows.slice(start, end);
    const ids = new Set(group.map(row => row.id));
    const internal = confirmed.filter(match => ids.has(match.a) && ids.has(match.b));
    const scores = new Map(group.map(row => [row.id, 0]));
    for (const match of internal) scores.set(match.winner, scores.get(match.winner) + 5);
    const method = group.length === 1 ? 'none' : group.length === 2 ? 'head-to-head' : 'mini-league';
    // Stable display order within a shared rank carries no competitive meaning.
    group.sort((a, b) => scores.get(b.id) - scores.get(a.id));
    for (let offset = 0; offset < group.length;) {
      let next = offset + 1;
      while (next < group.length && scores.get(group[next].id) === scores.get(group[offset].id)) next++;
      const rank = start + offset + 1;
      const sharedRank = next - offset > 1;
      for (const row of group.slice(offset, next)) ranked.push({
        ...row, rank, sharedRank, provisional: true,
        tieBreaker: method, tieBreakPoints: scores.get(row.id),
        tieBreakMatchesConfirmed: internal.length,
        tieBreakMatchesExpected: group.length * (group.length - 1) / 2,
        administratorReviewRequired: sharedRank && rank <= 3
      });
      offset = next;
    }
    start = end;
  }
  return ranked;
}

export function rewardReview(state) {
  const rows = leaderboard(state);
  return {
    administratorReviewRequired: rows.some(row => row.administratorReviewRequired),
    affectedSlotIds: rows.filter(row => row.administratorReviewRequired).map(row => row.id),
    recipientsFinalized: false,
    status: rows.some(row => row.administratorReviewRequired)
      ? 'Unresolved tie affects reward positions; administrator review and separately approved resolution required.'
      : 'Provisional standings; official recipients require administrator confirmation.'
  };
}

const IDS = Array.from({ length: 21 }, (_, i) => String(i + 1).padStart(2, '0'));
export function emptyPublicState() {
  return { slots: IDS.map(id => ({ id, playerName: null })), rounds: [], results: {} };
}
function keys(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) throw new Error('Invalid public data fields');
}
export function readPublicData(data) {
  keys(data, ['schemaVersion', 'lineupStatus', 'slots', 'matches']);
  if (data.schemaVersion !== 1 || !['draft', 'finalized'].includes(data.lineupStatus) || !Array.isArray(data.slots) || data.slots.length !== 21 || !Array.isArray(data.matches)) throw new Error('Invalid public data');
  const state = emptyPublicState(), slotIds = new Set();
  for (const slot of data.slots) {
    keys(slot, ['id', 'name']);
    if (!IDS.includes(slot.id) || slotIds.has(slot.id) || slot.name !== null && (typeof slot.name !== 'string' || !slot.name.trim() || slot.name.length > 40)) throw new Error('Invalid public slot');
    slotIds.add(slot.id); state.slots.find(row => row.id === slot.id).playerName = slot.name === null ? null : slot.name.trim();
  }
  if (data.lineupStatus === 'draft' && data.matches.length) throw new Error('Schedule requires finalized lineup');
  if (data.lineupStatus === 'finalized' && (data.matches.length !== 210 || state.slots.some(slot => !slot.playerName))) throw new Error('Finalized lineup and 210 matches required');
  const pairs = new Set(), rounds = new Map();
  for (const match of data.matches) {
    keys(match, ['id', 'round', 'a', 'b', 'result']);
    if (!IDS.includes(match.a) || !IDS.includes(match.b) || match.a === match.b || !Number.isInteger(match.round) || match.round < 1 || match.round > 21) throw new Error('Invalid public match');
    const pair = [match.a, match.b].sort().join('-');
    if (match.id !== `rr-${pair}` || pairs.has(pair)) throw new Error('Duplicate or invalid pairing');
    pairs.add(pair);
    const round = rounds.get(match.round) || { round: match.round, matches: [] };
    if (round.matches.length >= 10 || round.matches.some(m => [m.a,m.b].includes(match.a) || [m.a,m.b].includes(match.b))) throw new Error('Invalid round');
    round.matches.push({ id: match.id, round: match.round, a: match.a, b: match.b }); rounds.set(match.round, round);
    if (match.result !== null) {
      keys(match.result, ['status', 'winner']);
      if (!['pending', 'confirmed'].includes(match.result.status) || ![match.a,match.b].includes(match.result.winner)) throw new Error('Invalid public result');
      state.results[match.id] = { status: match.result.status, winner: match.result.winner };
    }
  }
  if (data.lineupStatus === 'finalized' && (rounds.size !== 21 || [...rounds.values()].some(round => round.matches.length !== 10))) throw new Error('21 complete rounds required');
  state.rounds = [...rounds.values()].sort((a,b) => a.round - b.round);
  return state;
}
