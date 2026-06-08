import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "players"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlayers(data);
    });

    return () => unsub();
  }, []);

  // ✏️ EDIT PLAYER
  const startEdit = (player) => {
    setEditId(player.id);
    setEditName(player.name);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  const saveEdit = async (player) => {
    if (!editName) return;

    const oldName = player.name;
    const newName = editName;

    // 1️⃣ update player name
    await updateDoc(doc(db, "players", player.id), {
      name: newName
    });

    // 2️⃣ update all matches
    const matchesSnap = await getDocs(collection(db, "matches"));

    matchesSnap.forEach(async (matchDoc) => {
      const m = matchDoc.data();

      if (m.homeTeam === oldName || m.awayTeam === oldName) {
        await updateDoc(doc(db, "matches", matchDoc.id), {
          homeTeam: m.homeTeam === oldName ? newName : m.homeTeam,
          awayTeam: m.awayTeam === oldName ? newName : m.awayTeam
        });
      }
    });

    setEditId(null);
    setEditName("");
    alert("Player updated everywhere!");
  };

  // ❌ DELETE PLAYER
  const deletePlayer = async (player) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${player.name}? This will remove all related matches.`
    );

    if (!confirmDelete) return;

    await deleteDoc(doc(db, "players", player.id));

    const matchesSnap = await getDocs(collection(db, "matches"));

    matchesSnap.forEach(async (matchDoc) => {
      const m = matchDoc.data();

      if (
        m.homeTeam === player.name ||
        m.awayTeam === player.name
      ) {
        await deleteDoc(doc(db, "matches", matchDoc.id));
      }
    });

    alert("Player and matches deleted!");
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1>👥 Players</h1>

        <button style={styles.backBtn} onClick={() => navigate("/admin")}>
          🔙 Back
        </button>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Player</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {players.map((p) => (
              <tr key={p.id}>
                <td>
                  {editId === p.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={styles.input}
                    />
                  ) : (
                    p.name
                  )}
                </td>

                <td>
                  {editId === p.id ? (
                    <>
                      <button
                        style={styles.saveBtn}
                        onClick={() => saveEdit(p)}
                      >
                        💾 Save
                      </button>

                      <button
                        style={styles.cancelBtn}
                        onClick={cancelEdit}
                      >
                        ❌ Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        style={styles.editBtn}
                        onClick={() => startEdit(p)}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        style={styles.deleteBtn}
                        onClick={() => deletePlayer(p)}
                      >
                        ❌ Remove
                      </button>
                    </>
                  )}
                </td>
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
    background: "#0d0d0d",
    minHeight: "100vh",
    color: "white",
    padding: "20px",
    fontFamily: "Arial"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  card: {
    marginTop: "20px",
    background: "#1a1a1a",
    padding: "15px",
    borderRadius: "12px",
    border: "1px solid #2a2a2a"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    color: "white",
    textAlign: "center"
  },
  input: {
    padding: "6px",
    background: "#111",
    color: "white",
    border: "1px solid #333",
    borderRadius: "6px"
  },
  editBtn: {
    background: "#ffc107",
    color: "black",
    border: "none",
    padding: "6px 10px",
    marginRight: "5px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  saveBtn: {
    background: "#28a745",
    color: "white",
    border: "none",
    padding: "6px 10px",
    marginRight: "5px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  cancelBtn: {
    background: "#6c757d",
    color: "white",
    border: "none",
    padding: "6px 10px",
    marginRight: "5px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  deleteBtn: {
    background: "red",
    color: "white",
    border: "none",
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  backBtn: {
    padding: "8px 12px",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  }
};