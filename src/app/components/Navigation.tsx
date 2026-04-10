import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  FileText,
  User,
  Settings,
  Search,
  Bell,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useProfile } from "../../hooks/useProfile";
import { getAvatarUrlForUser, getDisplayName } from "../../utils/avatar";

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
    <nav className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col" aria-label="Main navigation">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">S</span>
          </div>
          <span className="font-semibold text-lg text-sidebar-foreground group-hover:text-primary transition-colors">
            SkillBridge
          </span>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
              aria-current={isActive ? "page" : undefined}
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
  const avatarSrc = getAvatarUrlForUser(user, profile);
  const displayName = getDisplayName(user, profile);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const initial = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 bg-sidebar border-b border-sidebar-border px-6 flex items-center justify-end gap-4">
      <ThemeToggle />

      <button
        className="relative p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-5 text-sidebar-foreground" />
        <span className="absolute top-1.5 right-1.5 size-2 bg-destructive rounded-full" />
      </button>

      <Link to="/profile">
        <button
          type="button"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
          aria-label={`Profile (${displayName})`}
        >
          {avatarFailed ? (
            <div className="size-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">{initial || "U"}</span>
            </div>
          ) : (
            <img
              src={avatarSrc}
              alt=""
              className="size-8 rounded-full object-cover bg-muted"
              onError={() => setAvatarFailed(true)}
            />
          )}
        </button>
      </Link>
    </header>
  );
}
