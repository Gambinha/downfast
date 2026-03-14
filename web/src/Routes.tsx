import { BrowserRouter, Route, Routes } from "react-router-dom";

import Cadastro from "./pages/Cadastro";
import Feed from "./pages/Feed";
import Home2 from "./pages/Home2";
import Library from "./pages/Library";
import Playlists from "./pages/Playlists";
import Settings from "./pages/Settings";
import Studio from "./pages/Studio";
import Usuarios from "./pages/Usuarios";

import { UserProvider } from "./contexts/userData";

function AppRoutes() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Cadastro />} />
          <Route path="/home" element={<Home2 />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/library" element={<Library />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/users" element={<Usuarios />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;
