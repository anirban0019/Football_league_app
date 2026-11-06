import { useParams, useNavigate } from "react-router-dom";
import useCollection from "../hooks/useCollection";
import DataStatus from "../components/DataStatus";
import { calculateStandings, isFinishedMatch, sortMatches } from "../lib/league";

export default function PlayerProfile() {
  const { name } = useParams();
  const navigate = useNavigate();
  const matchState = useCollection("matches");
  const playerState = useCollection("players");
  const matches = sortMatches(matchState.data).filter((match) => match.homeTeam === name || match.awayTeam === name);
  const stats = calculateStandings(matches, [{ name }])[0];
  const form = [], gpm = [];
  matches.filter(isFinishedMatch).forEach((match) => {
    const isHome = match.homeTeam === name;
    const gf = Number(isHome ? match.scoreHome : match.scoreAway);
    const ga = Number(isHome ? match.scoreAway : match.scoreHome);
    gpm.push(gf);
    form.push(gf > ga ? "W" : gf < ga ? "L" : "D");
  });
  const missing = !playerState.loading && !matchState.loading && !playerState.error && !matchState.error &&
    !playerState.data.some((player) => player.name === name) && matches.length === 0;

  const gd = stats.gf - stats.ga;

  const winRate =
    stats.p > 0 ? ((stats.w / stats.p) * 100).toFixed(1) : 0;

  // streak
  let streak = 0;
  let streakType = "";

  for (let i = form.length - 1; i >= 0; i--) {
    if (i === form.length - 1) {
      streakType = form[i];
      streak = 1;
    } else if (form[i] === streakType) {
      streak++;
    } else {
      break;
    }
  }

  const lastFive = form.slice(-5);

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>👤 {name}</h1>

        <button style={styles.btn} onClick={() => navigate("/stats")}>
          🔙 Back
        </button>
      </div>

      <DataStatus loading={matchState.loading || playerState.loading} error={matchState.error || playerState.error} empty={missing} emptyMessage="Player not found. They may have been renamed or removed." />
      {/* STATS CARDS */}
      <div style={styles.grid}>
        <div style={styles.card}>Matches<br /><b>{stats.p}</b></div>
        <div style={styles.card}>Wins<br /><b>{stats.w}</b></div>
        <div style={styles.card}>Draws<br /><b>{stats.d}</b></div>
        <div style={styles.card}>Losses<br /><b>{stats.l}</b></div>
        <div style={styles.card}>GF<br /><b>{stats.gf}</b></div>
        <div style={styles.card}>GA<br /><b>{stats.ga}</b></div>
        <div style={styles.card}>GD<br /><b>{gd}</b></div>
        <div style={styles.card}>Win Rate<br /><b>{winRate}%</b></div>
      </div>

      {/* 🔥 STREAK */}
      <div style={styles.section}>
        <h3>🔥 Current Streak</h3>
        <p style={styles.bigText}>
          {streakType === "W"
            ? `🏆 Winning Streak: ${streak}`
            : streakType === "L"
            ? `💥 Losing Streak: ${streak}`
            : streakType === "D" ? `Drawing Streak: ${streak}` : "No active streak"}
        </p>
      </div>

      {/* 🔥 LAST 5 FORM */}
      <div style={styles.section}>
        <h3>Last 5 Form</h3>

        <div style={styles.formRow}>
          {lastFive.map((f, i) => (
            <span key={i} style={styles.formBox}>
              {f === "W" ? "✔" : f === "L" ? "❌" : "➖"}
            </span>
          ))}
        </div>
      </div>

      {/* 📊 GPM BAR GRAPH */}
      <div style={styles.section}>
        <h3>📊 Goals Per Match</h3>

        <div style={styles.graph}>
          {gpm.length === 0 && (
            <p style={{ color: "#aaa" }}>No match data</p>
          )}

          {gpm.map((g, i) => (
            <div key={i} style={styles.barWrap}>
              <div
                style={{
                  ...styles.bar,
                  height: `${g / Math.max(...gpm, 1) * 120}px`
                }}
              />
              <small>{g}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 🎨 STYLES */
const styles = {
  page: {
    background: "#0d0d0d",
    minHeight: "100vh",
    color: "white",
    padding: "15px",
    fontFamily: "Arial"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px"
  },

  title: {
    fontSize: "22px"
  },

  btn: {
    padding: "8px 12px",
    background: "#007bff",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "10px",
    marginTop: "20px"
  },

  card: {
    background: "#1a1a1a",
    padding: "15px",
    borderRadius: "10px",
    textAlign: "center",
    fontSize: "14px",
    border: "1px solid #2a2a2a"
  },

  section: {
    marginTop: "20px",
    background: "#1a1a1a",
    padding: "15px",
    borderRadius: "10px"
  },

  bigText: {
    fontSize: "18px",
    marginTop: "10px"
  },

  formRow: {
    display: "flex",
    gap: "10px",
    fontSize: "22px",
    marginTop: "10px",
    flexWrap: "wrap"
  },

  formBox: {
    padding: "6px 10px",
    background: "#111",
    borderRadius: "8px",
    border: "1px solid #333"
  },

  graph: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-end",
    minHeight: "160px",
    marginTop: "10px",
    overflowX: "auto"
  },

  barWrap: {
    textAlign: "center",
    flexShrink: 0
  },

  bar: {
    width: "18px",
    background: "#007bff",
    borderRadius: "5px"
  }
};