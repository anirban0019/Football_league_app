import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function PlayerStats() {
  const [stats, setStats] = useState([]);
  const [hovered, setHovered] = useState(null);

  const navigate = useNavigate();

  // INIT PLAYER
  const initPlayer = (name) => ({
    name,
    p: 0,
    w: 0,
    d: 0,
    l: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    pts: 0
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "matches"), (snapshot) => {
      const matches = snapshot.docs.map((doc) => doc.data());

      const table = {};

      matches.forEach((m) => {
        if (m.status !== "Finished") return;

        const home = m.homeTeam;
        const away = m.awayTeam;

        if (!table[home]) table[home] = initPlayer(home);
        if (!table[away]) table[away] = initPlayer(away);

        const homeScore = Number(m.scoreHome) || 0;
        const awayScore = Number(m.scoreAway) || 0;

        table[home].p++;
        table[away].p++;

        table[home].gf += homeScore;
        table[home].ga += awayScore;

        table[away].gf += awayScore;
        table[away].ga += homeScore;

        if (homeScore > awayScore) {
          table[home].w++;
          table[home].pts += 3;
          table[away].l++;
        } else if (homeScore < awayScore) {
          table[away].w++;
          table[away].pts += 3;
          table[home].l++;
        } else {
          table[home].d++;
          table[away].d++;
          table[home].pts += 1;
          table[away].pts += 1;
        }
      });

      Object.values(table).forEach((t) => {
        t.gd = t.gf - t.ga;
      });

      const sorted = Object.values(table).sort(
        (a, b) =>
          b.pts - a.pts ||
          b.gd - a.gd ||
          b.gf - a.gf
      );

      setStats(sorted);
    });

    return () => unsub();
  }, []);

  return (
    <div style={styles.page}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <h1>📊 Player Stats</h1>

        <button style={styles.homeBtn} onClick={() => navigate("/")}>
          🏠 Home
        </button>
      </div>

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

                <td
                  style={{
                    ...styles.playerName,
                    color:
                      hovered === i ? "#60a5fa" : "#38bdf8",
                    textDecoration:
                      hovered === i ? "underline" : "none"
                  }}
                  onClick={() =>
                    navigate(`/player/${encodeURIComponent(s.name)}`)
                  }
                >
                  {s.name}
                </td>

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