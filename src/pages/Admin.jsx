import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import useCollection from "../hooks/useCollection";
import DataStatus from "../components/DataStatus";
import { errorMessage } from "../lib/errors";
import { sortMatches } from "../lib/league";
import { createPlayer, createMatch, saveMatch, createLeague, clearLeague } from "../lib/leagueService";

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("matches");
  const matchState = useCollection("matches");
  const playerState = useCollection("players");
  const matches = sortMatches(matchState.data);
  const players = playerState.data;
  const [matchId, setMatchId] = useState("");
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");
  const [status, setStatus] = useState("Upcoming");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [newPlayer, setNewPlayer] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const run = async (action, success) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true); setError(""); setMessage("");
    try { await action(); setMessage(success); }
    catch (error) { setError(errorMessage(error)); }
    finally { lock.current = false; setBusy(false); }
  };

  const selectMatch = (id) => {
    const match = matches.find((item) => item.id === id);
    setMatchId(match?.id ?? "");
    setScoreHome(match?.scoreHome ?? ""); setScoreAway(match?.scoreAway ?? "");
    setStatus(match?.status ?? "Upcoming");
  };

  const playerOptions = players.map((player) => <option key={player.id} value={player.name}>{player.name}</option>);
  return (
    <div style={styles.page}>
      <div style={{ ...styles.header, flexWrap: "wrap", gap: 10 }}>
        <h1>Admin Panel</h1>
        <div style={styles.topBtns}>
          <button style={styles.homeBtn} onClick={() => navigate("/")}>Home</button>
          <button disabled={busy} style={styles.logoutBtn} onClick={() => run(async () => {
            await signOut(auth); localStorage.removeItem("adminAuth"); navigate("/", { replace: true });
          }, "Logged out.")}>Logout</button>
        </div>
      </div>
      <div style={styles.tabs}>
        {["matches", "players", "edit"].map((item) => <button key={item} style={tab === item ? styles.activeTab : styles.tab} onClick={() => setTab(item)}>{item === "edit" ? "Edit Match" : item[0].toUpperCase() + item.slice(1)}</button>)}
      </div>
      <div style={styles.container}>
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        {busy && <p role="status">Saving changes...</p>}
        <DataStatus loading={matchState.loading || playerState.loading} error={matchState.error || playerState.error} />
        {tab === "matches" && <div style={styles.card}>
          <h2>Matches</h2>
          <DataStatus empty={!matchState.loading && !matchState.error && matches.length === 0} emptyMessage="No matches yet. Add players and create a match or generate a league." />
          {matches.map((match) => <button key={match.id} style={styles.matchBtn} onClick={() => { selectMatch(match.id); setTab("edit"); }}>
            {match.homeTeam} vs {match.awayTeam} ? {match.matchDay ? `Matchday ${match.matchDay} ? ` : ""}{match.status} ({match.scoreHome ?? "-"} : {match.scoreAway ?? "-"})
          </button>)}
        </div>}
        {tab === "players" && <>
          <form style={styles.card} onSubmit={(event) => { event.preventDefault(); run(async () => { await createPlayer(newPlayer); setNewPlayer(""); }, "Player added."); }}>
            <h2>Add Player</h2>
            <label htmlFor="new-player">Player name</label>
            <input id="new-player" required maxLength={80} disabled={busy} style={styles.input} value={newPlayer} onChange={(event) => setNewPlayer(event.target.value)} />
            <button disabled={busy || playerState.loading || !!playerState.error} style={styles.button}>Add Player</button>
          </form>
          <div style={styles.card}>
            <h2>Players ({players.length})</h2>
            <DataStatus empty={!playerState.loading && !playerState.error && players.length === 0} emptyMessage="No players yet. Add your first player above." />
            <ul>{players.map((player) => <li key={player.id}>{player.name}</li>)}</ul>
            <button style={styles.button} onClick={() => navigate("/players")}>Manage Players (Edit / Remove)</button>
          </div>
          <form style={styles.card} onSubmit={(event) => { event.preventDefault(); run(async () => { await createMatch(homeTeam, awayTeam); setHomeTeam(""); setAwayTeam(""); }, "Match created."); }}>
            <h2>Create Match</h2>
            <label htmlFor="home-player">Home player</label>
            <select id="home-player" required disabled={busy} style={styles.input} value={homeTeam} onChange={(event) => setHomeTeam(event.target.value)}><option value="">Choose home player</option>{playerOptions}</select>
            <label htmlFor="away-player">Away player</label>
            <select id="away-player" required disabled={busy} style={styles.input} value={awayTeam} onChange={(event) => setAwayTeam(event.target.value)}><option value="">Choose away player</option>{playerOptions}</select>
            <button disabled={busy || playerState.loading || !!playerState.error} style={styles.button}>Create Match</button>
          </form>
          <button disabled={busy || matchState.loading || playerState.loading || !!matchState.error || !!playerState.error} style={styles.button} onClick={() => run(createLeague, "League generated.")}>Generate League</button>
          <button disabled={busy || matchState.loading || !!matchState.error} style={styles.dangerBtn} onClick={() => {
            if (window.confirm("This will permanently delete ALL matches. Continue?")) run(clearLeague, "League cleared.");
          }}>Clear Current League</button>
        </>}
        {tab === "edit" && <form style={styles.card} onSubmit={(event) => { event.preventDefault(); run(() => saveMatch(matchId, scoreHome, scoreAway, status), "Match updated."); }}>
          <h2>Edit Match</h2>
          <label htmlFor="match">Match</label>
          <select id="match" required disabled={busy} style={styles.input} value={matchId} onChange={(event) => selectMatch(event.target.value)}>
            <option value="">Choose a match</option>
            {matches.map((match) => <option key={match.id} value={match.id}>{match.homeTeam} vs {match.awayTeam}{match.matchDay ? ` ? Matchday ${match.matchDay}` : ""} ({match.id.slice(0, 6)})</option>)}
          </select>
          <label htmlFor="home-score">Home score</label>
          <input id="home-score" disabled={busy} style={styles.input} type="number" min="0" step="1" value={scoreHome} onChange={(event) => setScoreHome(event.target.value)} />
          <label htmlFor="away-score">Away score</label>
          <input id="away-score" disabled={busy} style={styles.input} type="number" min="0" step="1" value={scoreAway} onChange={(event) => setScoreAway(event.target.value)} />
          <label htmlFor="match-status">Status</label>
          <select id="match-status" disabled={busy} style={styles.input} value={status} onChange={(event) => setStatus(event.target.value)}>
            {["Upcoming", "Live", "Finished"].map((value) => <option key={value}>{value}</option>)}
          </select>
          <button disabled={busy || !matches.some((match) => match.id === matchId) || !!matchState.error} style={styles.button}>Update Match</button>
        </form>}
      </div>
    </div>
  );
}

const styles = {
  page: { background: "#0d0d0d", minHeight: "100vh", color: "white", padding: 20 },
  header: { display: "flex", justifyContent: "space-between" },
  topBtns: { display: "flex", gap: 10 },
  tabs: { display: "flex", gap: 10, marginTop: 10 },
  tab: { padding: 10, background: "#111", color: "white", borderRadius: 8 },
  activeTab: { padding: 10, background: "#007bff", borderRadius: 8 },
  container: { maxWidth: 900, margin: "20px auto", display: "flex", flexDirection: "column", gap: 20 },
  card: { background: "#1a1a1a", padding: 20, borderRadius: 12 },
  input: { width: "100%", padding: 10, margin: "8px 0", background: "#111", color: "white" },
  button: { padding: 10, background: "#007bff", border: "none", color: "white", borderRadius: 8 },
  matchBtn: { width: "100%", padding: 10, background: "#111", marginBottom: 8, color: "white" },
  logoutBtn: { background: "red", padding: 8 },
  homeBtn: { background: "#007bff", padding: 8 },
  dangerBtn: {
    padding: 10,
    background: "#dc2626",
    border: "none",
    color: "white",
    borderRadius: 8,
    marginTop: "10px",
    cursor: "pointer"
          } 
};