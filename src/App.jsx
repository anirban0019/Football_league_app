import { Routes, Route } from "react-router-dom";
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
      <Route path="/admin" element={<Admin />} />
      <Route path="/table" element={<Table />} />
      <Route path="/players" element={<Players />} />
      <Route path="/stats" element={<PlayerStats />} />
      <Route path="/player/:name" element={<PlayerProfile />} />
    </Routes>
  );
}

export default App;