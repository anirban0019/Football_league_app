import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCollection from "../hooks/useCollection";
import DataStatus from "../components/DataStatus";
import { errorMessage } from "../lib/errors";
import { renamePlayer, removePlayer } from "../lib/leagueService";

export default function Players() {
  const { data: players, loading, error: loadError } = useCollection("players");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const cancelEdit = () => { setEditId(null); setEditName(""); };
  const run = async (action, success) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    try { await action(); cancelEdit(); setMessage(success); }
    catch (error) { setError(errorMessage(error)); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div style={styles.page}>
    <div style={{ ...styles.header, flexWrap: "wrap", gap: 10 }}>
      <h1>Manage Players</h1>
      <button style={styles.backBtn} onClick={() => navigate("/admin")}>Back to Admin / Add Player</button>
    </div>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {busy && <p role="status">Saving changes...</p>}
    <DataStatus loading={loading} error={loadError} empty={players.length === 0} emptyMessage="No players yet. Use the Players tab in Admin to add your first player." />
    <div style={{ ...styles.card, overflowX: "auto" }}>
      <table style={styles.table}>
        <thead><tr><th>Player</th><th>Actions</th></tr></thead>
        <tbody>{players.map((player) => <tr key={player.id}>
          <td>{editId === player.id ? <input aria-label="Player name" maxLength={80} disabled={busy} value={editName} onChange={(event) => setEditName(event.target.value)} style={styles.input} /> : player.name}</td>
          <td>{editId === player.id ? <>
            <button disabled={busy || !!loadError} style={styles.saveBtn} onClick={() => run(() => renamePlayer(player.id, editName), "Player and related matches updated.")}>Save</button>
            <button disabled={busy} style={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
          </> : <>
            <button disabled={busy || !!loadError} style={styles.editBtn} onClick={() => { setEditId(player.id); setEditName(player.name); setError(""); setMessage(""); }}>Edit</button>
            <button disabled={busy || !!loadError} style={styles.deleteBtn} onClick={() => {
              if (window.confirm(`Delete ${player.name} and all their matches? This cannot be undone.`)) run(() => removePlayer(player.id), "Player and related matches removed.");
            }}>Remove</button>
          </>}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}

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