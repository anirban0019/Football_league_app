import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Table() {
  const [table, setTable] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "matches"), (snapshot) => {
      const matches = snapshot.docs.map((doc) => doc.data());

      const standings = {};

      matches.forEach((m) => {
        if (!standings[m.homeTeam]) {
          standings[m.homeTeam] = {
            team: m.homeTeam,
            p: 0, w: 0, d: 0, l: 0,
            gf: 0, ga: 0, gd: 0, pts: 0
          };
        }

        if (!standings[m.awayTeam]) {
          standings[m.awayTeam] = {
            team: m.awayTeam,
            p: 0, w: 0, d: 0, l: 0,
            gf: 0, ga: 0, gd: 0, pts: 0
          };
        }
      });

      matches.forEach((m) => {
        if (m.status !== "Finished") return;

        const home = standings[m.homeTeam];
        const away = standings[m.awayTeam];

        const sh = Number(m.scoreHome);
        const sa = Number(m.scoreAway);

        home.p++;
        away.p++;

        home.gf += sh;
        home.ga += sa;

        away.gf += sa;
        away.ga += sh;

        if (sh > sa) {
          home.w++;
          home.pts += 3;
          away.l++;
        } else if (sh < sa) {
          away.w++;
          away.pts += 3;
          home.l++;
        } else {
          home.d++;
          away.d++;
          home.pts += 1;
          away.pts += 1;
        }
      });

      Object.values(standings).forEach((t) => {
        t.gd = t.gf - t.ga;
      });

      const sorted = Object.values(standings).sort(
        (a, b) =>
          b.pts - a.pts ||
          b.gd - a.gd ||
          b.gf - a.gf
      );

      setTable(sorted);
    });

    return () => unsub();
  }, []);

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>📊 Points Table</h1>

        <button style={styles.homeBtn} onClick={() => navigate("/")}>
          🏠 Home
        </button>
      </div>

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
                  <td><b>{t.team}</b></td>
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