import { Link, useNavigate } from "react-router-dom";
import useCollection from "../hooks/useCollection";
import DataStatus from "../components/DataStatus";
import { calculateStandings } from "../lib/league";

export default function Table() {
  const matchState = useCollection("matches");
  const playerState = useCollection("players");
  const table = calculateStandings(matchState.data, playerState.data);
  const navigate = useNavigate();
  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Points Table</h1>

        <button style={styles.homeBtn} onClick={() => navigate("/")}>
          🏠 Home
        </button>
      </div>

      <DataStatus loading={matchState.loading || playerState.loading} error={matchState.error || playerState.error} empty={table.length === 0} emptyMessage="No players yet." />
      {/* TABLE */}
      <div style={styles.card}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th>P</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>GF</th>
                <th>GA</th>
                <th>GD</th>
                <th>Pts</th>
              </tr>
            </thead>

            <tbody>
              {table.map((t, i) => (
                <tr
                  key={t.team}
                  style={{
                    backgroundColor: i % 2 === 0 ? "#1a1a1a" : "#141414",
                    transition: "all 0.2s ease",
                    cursor: "pointer"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#2a2a2a";
                    e.currentTarget.style.transform = "scale(1.01)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      i % 2 === 0 ? "#1a1a1a" : "#141414";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <td>{i + 1}</td>
                  <td><Link to={`/player/${encodeURIComponent(t.team)}`}>{t.team}</Link></td>
                  <td>{t.p}</td>
                  <td>{t.w}</td>
                  <td>{t.d}</td>
                  <td>{t.l}</td>
                  <td>{t.gf}</td>
                  <td>{t.ga}</td>
                  <td>{t.gd}</td>
                  <td><b>{t.pts}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
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
    padding: "16px",
    fontFamily: "Arial"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },

  title: {
    fontSize: "20px",
    margin: 0
  },

  homeBtn: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    background: "#007bff",
    color: "white"
  },

  card: {
    background: "#1a1a1a",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid #2a2a2a"
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto"
  },

  table: {
    width: "100%",
    minWidth: "600px",
    borderCollapse: "collapse",
    textAlign: "center",
    color: "white",
    fontSize: "14px"
  }
};
