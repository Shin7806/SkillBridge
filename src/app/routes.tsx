import { createBrowserRouter } from "react-router";
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

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/signup",
        element: <Signup />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/setup",
        element: <SkillProfileSetup />,
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/matching",
        element: <Matching />,
      },
      {
        path: "/match/:id",
        element: <MatchProfile />,
      },
      {
        path: "/request",
        element: <SkillRequest />,
      },
      {
        path: "/chat/:id?",
        element: <Chat />,
      },
      {
        path: "/schedule/:id",
        element: <SessionScheduling />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/requests",
        element: <Requests />,
      },
      {
        path: "/sessions",
        element: <Sessions />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
    ],
  },
]);
