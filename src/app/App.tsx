import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";

import Landing from "./pages/Landing";
import AuthCallback from "./pages/AuthCallback";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import SkillProfileSetup from "./pages/SkillProfileSetup";
import Matching from "./pages/Matching";
import MatchProfile from "./pages/MatchProfile";
import SkillRequest from "./pages/SkillRequest";
import Chat from "./pages/Chat";
import SessionScheduling from "./pages/SessionScheduling";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Requests from "./pages/Requests";
import Sessions from "./pages/Sessions";
import Settings from "./pages/Settings";

import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* AUTH */}
        <Route element={<AuthLayout />}>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<SkillProfileSetup />} />
        </Route>

        {/* APP */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/match/:id" element={<MatchProfile />} />
          <Route path="/request" element={<SkillRequest />} />

          {/* ✅ FIXED CHAT */}
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<Chat />} />

          <Route path="/schedule/:id" element={<SessionScheduling />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}