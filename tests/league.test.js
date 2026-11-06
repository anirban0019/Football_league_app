import { describe, expect, it } from "vitest";
import { calculateStandings, generateFixtures, isValidScore, matchResult, sortMatches, validatePlayerName } from "../src/lib/league";

describe("player names", () => {
  it("trims names and rejects blank or duplicate names", () => {
    expect(validatePlayerName("  Alex  ")).toBe("Alex");
    expect(() => validatePlayerName("  ")).toThrow("Enter a player name");
    expect(() => validatePlayerName("alex", [{ id: "a", name: "Alex" }])).toThrow("already exists");
    expect(validatePlayerName("Alex", [{ id: "a", name: "Alex" }], "a")).toBe("Alex");
  });
});

describe("scores and standings", () => {
  it.each([null, undefined, "", " ", -1, 1.5, "bad", Infinity, true])("rejects invalid score %s", (score) => expect(isValidScore(score)).toBe(false));
  it("preserves an explicit live status and allows resetting scores", () => {
    expect(matchResult("0", "2", "Live")).toEqual({ scoreHome: 0, scoreAway: 2, status: "Live" });
    expect(matchResult("", "", "Upcoming")).toEqual({ scoreHome: null, scoreAway: null, status: "Upcoming" });
    expect(() => matchResult("", "", "Finished")).toThrow();
    expect(() => matchResult("1", "", "Upcoming")).toThrow();
  });
  it("calculates consistent results, includes unplayed players, and skips corrupt results", () => {
    const matches = [
      { homeTeam: "Alex", awayTeam: "Ben", scoreHome: "3", scoreAway: "1", status: "Finished" },
      { homeTeam: "Ben", awayTeam: "Alex", scoreHome: 0, scoreAway: 0, status: "Finished" },
      { homeTeam: "Alex", awayTeam: "Ben", scoreHome: null, scoreAway: null, status: "Finished" },
      { homeTeam: "Alex", awayTeam: "Ben", scoreHome: 9, scoreAway: 0, status: "Live" },
    ];
    const standings = calculateStandings(matches, [{ name: "Cara" }]);
    expect(standings.find((p) => p.name === "Alex")).toMatchObject({ p: 2, w: 1, d: 1, l: 0, gf: 3, ga: 1, gd: 2, pts: 4 });
    expect(standings.find((p) => p.name === "Ben")).toMatchObject({ p: 2, w: 0, d: 1, l: 1, gf: 1, ga: 3, pts: 1 });
    expect(standings.find((p) => p.name === "Cara")).toMatchObject({ p: 0, pts: 0 });
  });
  it("handles names that collide with object properties", () => {
    expect(calculateStandings([{ homeTeam: "__proto__", awayTeam: "constructor", scoreHome: 1, scoreAway: 0, status: "Finished" }])[0].pts).toBe(3);
  });
  it("orders matches by matchday rather than Firestore random IDs", () => {
    expect(sortMatches([{ id: "a", matchDay: 2 }, { id: "z", matchDay: 1 }]).map((m) => m.id)).toEqual(["z", "a"]);
  });
});

describe("round-robin fixtures", () => {
  it.each([2, 3, 4, 5, 21])("creates each directed pairing once for %i players, with no double bookings", (count) => {
    const players = Array.from({ length: count }, (_, i) => ({ name: i === 0 ? "BYE" : `Player ${i}` }));
    const fixtures = generateFixtures(players);
    expect(fixtures).toHaveLength(count * (count - 1));
    expect(new Set(fixtures.map((m) => `${m.homeTeam}/${m.awayTeam}`)).size).toBe(fixtures.length);
    for (const day of new Set(fixtures.map((m) => m.matchDay))) {
      const names = fixtures.filter((m) => m.matchDay === day).flatMap((m) => [m.homeTeam, m.awayTeam]);
      expect(new Set(names).size).toBe(names.length);
    }
  });
  it("refuses invalid or oversized leagues before writing", () => {
    expect(() => generateFixtures([{ name: "A" }])).toThrow();
    expect(() => generateFixtures([{ name: "A" }, { name: "a" }])).toThrow();
    expect(() => generateFixtures(Array.from({ length: 22 }, (_, i) => ({ name: `P${i}` })))).toThrow("21 players");
  });
});
