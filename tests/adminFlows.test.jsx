import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const state = vi.hoisted(() => ({ user: null, authPending: false, readError: false, players: [], matches: [] }));
vi.mock("../src/firebase", () => ({ db: {}, auth: {} }));
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth, next) => { if (!state.authPending) next(state.user); return () => {}; },
  signOut: vi.fn(async () => {}),
  signInWithEmailAndPassword: vi.fn(async () => {}),
}));
vi.mock("firebase/firestore", () => ({
  collection: (_db, name) => name,
  onSnapshot: (name, next, error) => {
    if (state.readError) error({ code: "permission-denied" });
    else next({ docs: state[name].map(({ id, ...data }) => ({ id, data: () => data })) });
    return () => {};
  },
}));
vi.mock("../src/lib/leagueService", () => ({
  createPlayer: vi.fn(async () => {}), createMatch: vi.fn(async () => {}), saveMatch: vi.fn(async () => {}),
  createLeague: vi.fn(async () => {}), clearLeague: vi.fn(async () => {}),
  renamePlayer: vi.fn(async () => {}), removePlayer: vi.fn(async () => {}),
}));

import Admin from "../src/pages/Admin";
import Players from "../src/pages/Players";
import AdminLogin from "../src/pages/AdminLogin";
import RequireAuth from "../src/components/RequireAuth";
import Home from "../src/pages/Home";
import { createPlayer, renamePlayer, removePlayer } from "../src/lib/leagueService";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  state.user = null; state.authPending = false; state.readError = false; state.players = []; state.matches = [];
});
afterEach(cleanup);
const mount = (component) => render(<MemoryRouter>{component}</MemoryRouter>);

describe("admin authentication", () => {
  it.each(["/admin", "/players"])("ignores forged local storage for %s", async (path) => {
    localStorage.setItem("adminAuth", "true");
    render(<MemoryRouter initialEntries={[path]}><Routes>
      <Route element={<RequireAuth />}><Route path={path} element={<p>Protected content</p>} /></Route>
      <Route path="/admin-login" element={<p>Login required</p>} />
    </Routes></MemoryRouter>);
    expect(await screen.findByText("Login required")).toBeTruthy();
    expect(screen.queryByText("Protected content")).toBeNull();
  });
  it("waits for Firebase to restore the session before granting access", () => {
    state.authPending = true;
    mount(<RequireAuth />);
    expect(screen.getByRole("status").textContent).toContain("Checking your session");
  });
  it("submits login using Enter/form submission and displays authentication errors", async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({ code: "auth/invalid-credential" });
    mount(<AdminLogin />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "admin@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });
    fireEvent.submit(screen.getByRole("button", { name: "Login" }).closest("form"));
    expect((await screen.findByRole("alert")).textContent).toContain("Invalid email or password");
  });
  it("signs out of Firebase", async () => {
    mount(<Admin />);
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });
});

describe("player management feedback", () => {
  const openPlayers = () => { mount(<Admin />); fireEvent.click(screen.getByRole("button", { name: "Players" })); };
  it("explains an empty list and shows where players are managed", () => {
    openPlayers();
    expect(screen.getByText("No players yet. Add your first player above.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Manage Players (Edit / Remove)" })).toBeTruthy();
  });
  it("shows a permission error instead of claiming there are no players", () => {
    state.readError = true;
    openPlayers();
    expect(screen.getByRole("alert").textContent).toContain("Permission denied");
    expect(screen.queryByText("No players yet. Add your first player above.")).toBeNull();
    expect(screen.getByRole("button", { name: "Add Player" }).disabled).toBe(true);
  });
  it("retains the entered name after a denied create, then confirms a successful retry", async () => {
    createPlayer.mockRejectedValueOnce({ code: "permission-denied" });
    openPlayers();
    const input = screen.getByLabelText("Player name");
    fireEvent.change(input, { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Player" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Permission denied");
    expect(input.value).toBe("Alex");
    fireEvent.click(screen.getByRole("button", { name: "Add Player" }));
    expect(await screen.findByText("Player added.")).toBeTruthy();
    expect(input.value).toBe("");
  });
  it("prevents repeat submissions and waits for persistence before showing success", async () => {
    let finish;
    createPlayer.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    openPlayers();
    fireEvent.change(screen.getByLabelText("Player name"), { target: { value: "Alex" } });
    const button = screen.getByRole("button", { name: "Add Player" });
    fireEvent.click(button); fireEvent.click(button);
    expect(button.disabled).toBe(true);
    expect(createPlayer).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Player added.")).toBeNull();
    finish();
    expect(await screen.findByText("Player added.")).toBeTruthy();
    expect(button.disabled).toBe(false);
  });
  it("keeps editing open when rename fails and confirms only after retry succeeds", async () => {
    state.players = [{ id: "a", name: "Alex" }];
    renamePlayer.mockRejectedValueOnce({ code: "permission-denied" });
    mount(<Players />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Player name"), { target: { value: "Alice" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Permission denied");
    expect(screen.getByLabelText("Player name").value).toBe("Alice");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Player and related matches updated.")).toBeTruthy();
    expect(renamePlayer).toHaveBeenLastCalledWith("a", "Alice");
  });
  it("requires delete confirmation and displays write failures", async () => {
    state.players = [{ id: "a", name: "Alex" }];
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    removePlayer.mockRejectedValueOnce({ code: "permission-denied" });
    mount(<Players />);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(removePlayer).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Permission denied");
    expect(confirm).toHaveBeenCalledTimes(2);
  });
  it("displays denied public match reads", () => {
    state.readError = true; mount(<Home />);
    expect(screen.getByRole("alert").textContent).toContain("Permission denied");
    expect(screen.queryByText("No matches scheduled yet.")).toBeNull();
  });
});
