import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "matches"), (snap) => {
      setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, []);

  // GROUP BY MATCHDAY
  const grouped = matches.reduce((acc, m) => {
    const day = m.matchDay || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(m);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort((a, b) => a - b);

  return (
    <div style={styles.page}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <h1>🏆 Tournament Dashboard</h1>
        <p style={styles.sub}>Live League Overview</p>
      </div>

      {/* NAV */}
      <div style={styles.nav}>
        <button style={{ ...styles.btn, background: "#3b82f6" }} onClick={() => navigate("/table")}>
          📊 Standings
        </button>

        <button style={{ ...styles.btn, background: "#22c55e" }} onClick={() => navigate("/stats")}>
          ⚽ Players
        </button>

        <button style={{ ...styles.btn, background: "#ef4444" }} onClick={() => navigate("/admin")}>
          🔐 Admin
        </button>
      </div>

      {/* MATCHDAYS */}
      <div style={styles.wrapper}>
        {sortedDays.map((day, index) => (
          <div key={day} style={{ ...styles.matchdayCard, animationDelay: `${index * 0.1}s` }}>
            
            <h2 style={styles.matchdayTitle}>📅 Matchday {day}</h2>

            <div style={styles.matchList}>
              {grouped[day].map((m) => (
                <div key={m.id} style={styles.matchCard}>
                  
                  <div style={styles.team}>{m.homeTeam}</div>

                  <div style={styles.score}>
                    {m.scoreHome ?? "-"} : {m.scoreAway ?? "-"}
                  </div>

                  <div style={styles.team}>{m.awayTeam}</div>

                  <div style={styles.status}>
                    {m.status}
                  </div>

                </div>
              ))}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

/* 🎨 STYLES */
const styles = {
  page: {
    background: "linear-gradient(180deg, #0b0f19, #0d0d0d)",
    minHeight: "100vh",
    color: "white",
    padding: "20px",
    fontFamily: "Arial"
  },

  header: {
    textAlign: "center",
    marginBottom: "10px"
  },

  sub: {
    color: "#aaa",
    fontSize: "14px"
  },

  nav: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "25px",
    flexWrap: "wrap"
  },

  btn: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "10px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.2s ease",
    boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
  },

  wrapper: {
    maxWidth: "900px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  matchdayCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "15px",
    backdropFilter: "blur(10px)",
    animation: "fadeIn 0.5s ease forwards"
  },

  matchdayTitle: {
    marginBottom: "10px",
    fontSize: "18px",
    borderBottom: "1px solid #222",
    paddingBottom: "8px"
  },

  matchList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  matchCard: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    background: "#111827",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.06)",
    transition: "0.25s ease",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
  },

  team: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "15px"
  },

  score: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#facc15"
  },

  status: {
    gridColumn: "1 / -1",
    textAlign: "center",
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "6px"
  }
};