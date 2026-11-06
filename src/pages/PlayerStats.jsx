import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCollection from "../hooks/useCollection";
import DataStatus from "../components/DataStatus";
import { calculateStandings } from "../lib/league";

export default function PlayerStats() {
  const matchState = useCollection("matches");
  const playerState = useCollection("players");
  const stats = calculateStandings(matchState.data, playerState.data);
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  return (
    <div style={styles.page}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <h1>📊 Player Stats</h1>

        <button style={styles.homeBtn} onClick={() => navigate("/")}>
          🏠 Home
        </button>
      </div>

      <DataStatus loading={matchState.loading || playerState.loading} error={matchState.error || playerState.error} empty={stats.length === 0} emptyMessage="No players yet." />
      {/* TABLE */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>P</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
              <th>GF</th>
              <th>GA</th>
              <th>GD</th>
              <th>PTS</th>
            </tr>
          </thead>

          <tbody>
            {stats.map((s, i) => (
              <tr
                key={s.name}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...styles.row,
                  backgroundColor:
                    hovered === i
                      ? "#1e293b"
                      : i % 2 === 0
                      ? "#1a1a1a"
                      : "#141414",
                  transform:
                    hovered === i ? "scale(1.01)" : "scale(1)",
                  boxShadow:
                    hovered === i
                      ? "0 6px 18px rgba(0,0,0,0.6)"
                      : "none"
                }}
              >
                <td>{i + 1}</td>

                <td><Link style={styles.playerName} to={`/player/${encodeURIComponent(s.name)}`}>{s.name}</Link></td>

                <td>{s.p}</td>
                <td>{s.w}</td>
                <td>{s.d}</td>
                <td>{s.l}</td>
                <td>{s.gf}</td>
                <td>{s.ga}</td>
                <td>{s.gd}</td>

                <td style={styles.points}>{s.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* 🎨 STYLES */
const styles = {
  page: {
    background: "#0b0f19",
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

  homeBtn: {
    padding: "8px 12px",
    background: "#3b82f6",
    border: "none",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer"
  },

  tableWrapper: {
    marginTop: "20px",
    overflowX: "auto"
  },

  table: {
    width: "100%",
    minWidth: "750px",
    borderCollapse: "collapse",
    textAlign: "center"
  },

  row: {
    transition: "all 0.25s ease",
    cursor: "pointer"
  },

  playerName: {
    fontWeight: "bold",
    cursor: "pointer",
    transition: "0.2s"
  },

  points: {
    fontWeight: "bold",
    color: "#facc15"
  }
};
