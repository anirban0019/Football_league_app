import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { errorMessage } from "../lib/errors";

export default function useAuth() {
  const [state, setState] = useState({ user: null, loading: true, error: "" });
  useEffect(() => onAuthStateChanged(auth,
    (user) => setState({ user, loading: false, error: "" }),
    (error) => setState({ user: null, loading: false, error: errorMessage(error) })), []);
  return state;
}
