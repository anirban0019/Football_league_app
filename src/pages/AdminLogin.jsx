import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      localStorage.setItem("adminAuth", "true");

      navigate("/admin");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div style={styles.page}>

      {/* 🔙 TOP NAV */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate("/")}>
          ⬅ Home
        </button>
      </div>

      {/* LOGIN CARD */}
      <div style={styles.card}>
        <h2>🔐 Admin Login</h2>

        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
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