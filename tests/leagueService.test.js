import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ players: [], matches: [], failCommit: false, commits: [], failRead: false }));
vi.mock("../src/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: (_db, name) => ({ name }),
  doc: (db, name, id) => db.name ? { id: `new-${Math.random()}` } : { collection: name, id },
  serverTimestamp: () => "timestamp",
  getDocs: async (ref) => {
    if (store.failRead) throw Object.assign(new Error("Denied"), { code: "permission-denied" });
    return { docs: store[ref.name].map(({ id, ...data }) => ({ id, data: () => data })) };
  },
  addDoc: vi.fn(async () => {}),
  updateDoc: vi.fn(async () => {}),
  writeBatch: () => {
    const operations = [];
    return {
      update: (ref, data) => operations.push({ method: "update", ref, data }),
      set: (ref, data) => operations.push({ method: "set", ref, data }),
      delete: (ref) => operations.push({ method: "delete", ref }),
      commit: async () => {
        if (store.failCommit) throw Object.assign(new Error("Denied"), { code: "permission-denied" });
        store.commits.push(operations);
      },
    };
  },
}));

import { addDoc, updateDoc } from "firebase/firestore";
import { clearLeague, createLeague, createMatch, createPlayer, removePlayer, renamePlayer, saveMatch } from "../src/lib/leagueService";

beforeEach(() => {
  store.players = [{ id: "a", name: "Alex" }, { id: "b", name: "Ben" }];
  store.matches = [
    { id: "m1", homeTeam: "Alex", awayTeam: "Ben" },
    { id: "m2", homeTeam: "Ben", awayTeam: "Alex" },
    { id: "m3", homeTeam: "Cara", awayTeam: "Dan" },
  ];
  store.failCommit = false; store.failRead = false; store.commits = [];
  vi.clearAllMocks();
});

describe("player writes", () => {
  it("creates a trimmed player and rejects blanks and duplicate names", async () => {
    await createPlayer(" Cara ");
    expect(addDoc).toHaveBeenCalledWith({ name: "players" }, { name: "Cara" });
    await expect(createPlayer(" ")).rejects.toThrow("Enter a player name");
    await expect(createPlayer("alex")).rejects.toThrow("already exists");
    expect(addDoc).toHaveBeenCalledTimes(1);
  });
  it("renames the player and both fixture directions in one commit", async () => {
    await renamePlayer("a", " Alice ");
    expect(store.commits).toHaveLength(1);
    expect(store.commits[0]).toEqual([
      { method: "update", ref: { collection: "players", id: "a" }, data: { name: "Alice" } },
      { method: "update", ref: { collection: "matches", id: "m1" }, data: { homeTeam: "Alice", awayTeam: "Ben" } },
      { method: "update", ref: { collection: "matches", id: "m2" }, data: { homeTeam: "Ben", awayTeam: "Alice" } },
    ]);
  });
  it("deletes the player and only their related fixtures together", async () => {
    await removePlayer("a");
    expect(store.commits[0].map((op) => op.ref.id)).toEqual(["m1", "m2", "a"]);
  });
  it("propagates denied reads and writes instead of reporting success", async () => {
    store.failRead = true;
    await expect(createPlayer("Cara")).rejects.toMatchObject({ code: "permission-denied" });
    store.failRead = false; store.failCommit = true;
    await expect(renamePlayer("a", "Alice")).rejects.toMatchObject({ code: "permission-denied" });
    await expect(removePlayer("a")).rejects.toMatchObject({ code: "permission-denied" });
    expect(store.commits).toHaveLength(0);
  });
  it("refuses stale player IDs and oversized updates without partial writes", async () => {
    await expect(renamePlayer("missing", "Alice")).rejects.toThrow("no longer exists");
    store.matches = Array.from({ length: 450 }, (_, i) => ({ id: `m${i}`, homeTeam: "Alex", awayTeam: "Ben" }));
    await expect(renamePlayer("a", "Alice")).rejects.toThrow("No records were changed");
    expect(store.commits).toHaveLength(0);
  });
});

describe("match and league writes", () => {
  it("rejects self matches and removed players", async () => {
    await expect(createMatch("Alex", "Alex")).rejects.toThrow("different players");
    await expect(createMatch("Alex", "Missing")).rejects.toThrow("no longer exists");
    expect(addDoc).not.toHaveBeenCalled();
    await createMatch("Alex", "Ben");
    expect(addDoc).toHaveBeenCalledWith({ name: "matches" }, expect.objectContaining({ homeTeam: "Alex", awayTeam: "Ben", status: "Upcoming" }));
  });
  it("validates scores before writing and preserves selected status", async () => {
    await expect(saveMatch("m1", "-1", "2", "Finished")).rejects.toThrow();
    expect(updateDoc).not.toHaveBeenCalled();
    await saveMatch("m1", "1", "2", "Live");
    expect(updateDoc).toHaveBeenCalledWith({ collection: "matches", id: "m1" }, { scoreHome: 1, scoreAway: 2, status: "Live", completedAt: null });
  });
  it("refuses duplicate generation and commits the whole new league once", async () => {
    await expect(createLeague()).rejects.toThrow("already has matches");
    store.matches = [];
    await createLeague();
    expect(store.commits).toHaveLength(1);
    expect(store.commits[0]).toHaveLength(2);
  });
  it("propagates generation and clear failures", async () => {
    store.failCommit = true;
    await expect(clearLeague()).rejects.toThrow("Denied");
    store.matches = [];
    await expect(createLeague()).rejects.toThrow("Denied");
    expect(store.commits).toHaveLength(0);
  });
});
