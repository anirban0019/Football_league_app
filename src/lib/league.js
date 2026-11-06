export const MAX_BATCH_WRITES = 450;

export function validatePlayerName(value, players = [], excludeId) {
  const name = value.trim();
  if (!name) throw new Error("Enter a player name.");
  if (name.length > 80) throw new Error("Player names must be 80 characters or fewer.");
  if (players.some((p) => (excludeId === undefined || p.id !== excludeId) && p.name?.trim().toLowerCase() === name.toLowerCase())) {
    throw new Error("A player with this name already exists.");
  }
  return name;
}

export function isValidScore(value) {
  return (typeof value === "number" || typeof value === "string") &&
    String(value).trim() !== "" && Number.isSafeInteger(Number(value)) && Number(value) >= 0;
}

export function matchResult(scoreHome, scoreAway, status) {
  if (!["Upcoming", "Live", "Finished"].includes(status)) throw new Error("Choose a valid match status.");
  if (String(scoreHome ?? "").trim() === "" && String(scoreAway ?? "").trim() === "" && status === "Upcoming") {
    return { scoreHome: null, scoreAway: null, status };
  }
  if (!isValidScore(scoreHome) || !isValidScore(scoreAway)) {
    throw new Error("Enter both scores as non-negative whole numbers, or clear both for an upcoming match.");
  }
  return { scoreHome: Number(scoreHome), scoreAway: Number(scoreAway), status };
}

export function isFinishedMatch(match) {
  return match.status === "Finished" && isValidScore(match.scoreHome) && isValidScore(match.scoreAway) &&
    typeof match.homeTeam === "string" && typeof match.awayTeam === "string" &&
    match.homeTeam.trim() !== "" && match.awayTeam.trim() !== "" && match.homeTeam !== match.awayTeam;
}

export function sortMatches(matches) {
  return [...matches].sort((a, b) => (a.matchDay ?? 1) - (b.matchDay ?? 1) ||
    (a.completedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0) -
    (b.completedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0) || (a.id ?? "").localeCompare(b.id ?? ""));
}

export function calculateStandings(matches, players = []) {
  const table = new Map();
  const add = (name) => {
    if (typeof name === "string" && name.trim() && !table.has(name)) {
      table.set(name, { name, team: name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
    }
  };
  players.forEach((player) => add(player.name));
  matches.forEach((match) => { add(match.homeTeam); add(match.awayTeam); });
  matches.filter(isFinishedMatch).forEach((match) => {
    const home = table.get(match.homeTeam), away = table.get(match.awayTeam);
    const h = Number(match.scoreHome), a = Number(match.scoreAway);
    home.p++; away.p++; home.gf += h; home.ga += a; away.gf += a; away.ga += h;
    if (h > a) { home.w++; home.pts += 3; away.l++; }
    else if (a > h) { away.w++; away.pts += 3; home.l++; }
    else { home.d++; away.d++; home.pts++; away.pts++; }
  });
  return [...table.values()].map((row) => ({ ...row, gd: row.gf - row.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name));
}

export function generateFixtures(players) {
  const names = [];
  players.forEach((player) => names.push(validatePlayerName(player.name, names.map((name) => ({ name })))));
  if (names.length < 2) throw new Error("Need at least 2 players.");
  if (names.length * (names.length - 1) > MAX_BATCH_WRITES) throw new Error("Use at most 21 players for atomic league generation.");
  if (names.length % 2) names.push(null);
  let rotation = [...names];
  const fixtures = [], rounds = names.length - 1;
  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < names.length / 2; i++) {
      const homeTeam = rotation[i], awayTeam = rotation[names.length - 1 - i];
      if (homeTeam !== null && awayTeam !== null) fixtures.push({ homeTeam, awayTeam, matchDay: round + 1 });
    }
    rotation = [rotation[0], rotation.at(-1), ...rotation.slice(1, -1)];
  }
  return [...fixtures, ...fixtures.map((match) => ({
    homeTeam: match.awayTeam, awayTeam: match.homeTeam, matchDay: match.matchDay + rounds,
  }))];
}
