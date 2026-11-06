import { Routes, Route, Link } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Table from "./pages/Table";
import AdminLogin from "./pages/AdminLogin";
import Players from "./pages/Players";
import PlayerStats from "./pages/PlayerStats";
import PlayerProfile from "./pages/PlayerProfile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin-login" element={<AdminLogin/>} />
      <Route element={<RequireAuth />}>
        <Route path="/admin" element={<Admin />} />
        <Route path="/players" element={<Players />} />
      </Route>
      <Route path="/table" element={<Table />} />
      <Route path="/stats" element={<PlayerStats />} />
      <Route path="/player/:name" element={<PlayerProfile />} />
      <Route path="*" element={<main><h1>Page not found</h1><Link to="/">Return home</Link></main>} />
    </Routes>
  );
}

export default App;
