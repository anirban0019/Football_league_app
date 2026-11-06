import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { errorMessage } from "../lib/errors";

export default function useCollection(name) {
  const [state, setState] = useState({ data: [], loading: true, error: "" });
  useEffect(() => onSnapshot(collection(db, name), (snapshot) => {
    setState({ data: snapshot.docs.map((item) => ({ ...item.data(), id: item.id })), loading: false, error: "" });
  }, (error) => setState({ data: [], loading: false, error: errorMessage(error) })), [name]);
  return state;
}
