import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  FileText,
  Settings,
  Search,
  Bell,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useProfile } from "../../hooks/useProfile";
import { getAvatarUrl, getDisplayName } from "../../utils/avatar";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/matching", label: "Matches", icon: Search },
  { path: "/requests", label: "Requests", icon: FileText },
  { path: "/chat", label: "Chats", icon: MessageSquare },
];

const bottomNavItems = [
  { path: "/sessions", label: "Sessions", icon: Calendar },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="w-64 bg-sidebar border-r border-sidebar-border h-screen fixed top-0 left-0 flex flex-col">
      {/* LOGO */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">S</span>
          </div>
          <span className="font-semibold">SkillBridge</span>
        </Link>
      </div>

      {/* TOP NAV */}
      <div className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + "/");

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon className="size-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* BOTTOM NAV */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + "/");

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon className="size-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopNav() {
  const user = useCurrentUser();
  const profile = useProfile(user?.id);

  const name = getDisplayName(user, profile);
  const avatarUrl = getAvatarUrl(profile?.avatar_url);

  const [error, setError] = useState(false);

  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 border-b border-sidebar-border px-6 flex items-center justify-end gap-4 bg-sidebar">
      <ThemeToggle />

      <Bell className="size-5" />

      <Link to="/profile">
        {avatarUrl && !error ? (
          <img
            src={avatarUrl}
            className="size-8 rounded-full object-cover"
            onError={() => setError(true)}
          />
        ) : (
          <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
            {initials || "U"}
          </div>
        )}
      </Link>
    </header>
  );
}