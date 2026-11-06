import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import useAuth from "../hooks/useAuth";
import { errorMessage } from "../lib/errors";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading, error: authError } = useAuth();
  const navigate = useNavigate();
  if (loading) return <p role="status">Checking your session...</p>;
  if (user) return <Navigate to="/admin" replace />;
  const handleLogin = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try { await signInWithEmailAndPassword(auth, email.trim(), password); }
    catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  };
  return <div style={styles.page}>
    <div style={styles.topBar}><button style={styles.backBtn} onClick={() => navigate("/")}>Home</button></div>
    <form style={{ ...styles.card, maxWidth: "calc(100% - 30px)" }} onSubmit={handleLogin}>
      <h2>Admin Login</h2>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" autoComplete="username" required disabled={busy} style={styles.input} value={email} onChange={(event) => setEmail(event.target.value)} />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" autoComplete="current-password" required disabled={busy} style={styles.input} value={password} onChange={(event) => setPassword(event.target.value)} />
      {(error || authError) && <p role="alert" style={styles.error}>{error || authError}</p>}
      <button disabled={busy} style={styles.button}>{busy ? "Logging in..." : "Login"}</button>
    </form>
  </div>;
}

const styles = {
  page: {
    background: "#0b0f19",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "white"
  },

  topBar: {
    width: "100%",
    padding: "15px",
    display: "flex",
    justifyContent: "flex-start"
  },

  backBtn: {
    padding: "8px 14px",
    background: "#1f2937",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.2s"
  },

  card: {
    background: "#111827",
    padding: "25px",
    borderRadius: "14px",
    width: "320px",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.08)",
    marginTop: "40px"
  },

  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#0d0d0d",
    color: "white"
  },

  button: {
    width: "100%",
    padding: "10px",
    background: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold"
  },

  error: {
    color: "#ef4444",
    fontSize: "14px"
  }
};