import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Search,
  FileText,
  MessageSquare,
  Settings,
  X,
  Menu,
  ChevronDown,
  LogOut,
  User,
  Sun,
  Moon,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useProfile } from "../../hooks/useProfile";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { getDisplayName, getAvatarUrl } from "../../utils/avatar";
import { NotificationPanel } from "../components/NotificationPanel";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/matching", icon: Search, label: "Matches" },
  { to: "/requests", icon: FileText, label: "Requests" },
  { to: "/chat", icon: MessageSquare, label: "Chats" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

function useDarkMode() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  };
  return { dark, toggle };
}

export default function AppLayout() {
  const { user, loading } = useAuth();

  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const location = useLocation();
  const { dark, toggle: toggleDark } = useDarkMode();
  const profileRef = useRef<HTMLDivElement>(null);

  const currentUser = useCurrentUser();
  const { profile } = useProfile(currentUser?.id);
  const displayName = getDisplayName(currentUser, profile);
  const avatarUrl = getAvatarUrl(profile?.avatar_url);
  const initials = displayName?.substring(0, 2).toUpperCase() || "U";

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const handleSignOut = async () => {
    setProfileOpen(false);
    await supabase.auth.signOut();
    window.location.replace("/login");
  };

  const handleMenuToggle = () => {
    if (window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopCollapsed((prev) => !prev);
    }
  };

  const sidebarW = desktopCollapsed ? "md:w-16" : "md:w-64";
  const mainMargin = desktopCollapsed ? "md:ml-16" : "md:ml-64";

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-40 flex flex-col
          border-r border-border/40
          bg-sidebar/85 backdrop-blur-xl shadow-xl
          transition-all duration-300 ease-in-out
          w-64 ${sidebarW}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo row */}
        <div className={`flex items-center h-14 border-b border-border/30 px-3 ${desktopCollapsed ? "justify-center" : "justify-between"}`}>
          <Link to="/dashboard" className="flex items-center gap-2.5 group min-w-0">
            <img
              src="/logo.png"
              alt="SkillBridge"
              className="size-8 object-contain flex-shrink-0 group-hover:scale-105 transition-transform"
            />
            {!desktopCollapsed && (
              <span className="font-bold text-base text-foreground tracking-tight truncate">
                SkillBridge
              </span>
            )}
          </Link>

          {/* Close btn — mobile only */}
          {!desktopCollapsed && (
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex-shrink-0"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active =
              location.pathname === to || location.pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                title={desktopCollapsed ? label : undefined}
                className={`
                  relative flex items-center rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${desktopCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-2.5"}
                  ${active
                    ? "bg-primary/15 text-primary"
                    : "text-sidebar-foreground hover:bg-muted/50 hover:text-foreground"
                  }
                `}
              >
                {active && !desktopCollapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary" />
                )}
                <Icon className={`flex-shrink-0 transition-transform group-hover:scale-110 ${desktopCollapsed ? "size-5" : "size-4"} ${active ? "text-primary" : ""}`} />
                {!desktopCollapsed && label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom profile strip */}
        <div className="border-t border-border/30 px-2 py-3">
          {desktopCollapsed ? (
            <div className="flex justify-center">
              <Link to="/profile" title="Profile">
                <div className="size-8 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center ring-2 ring-primary/20">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="size-full object-cover" />
                    : <span className="text-xs font-bold text-primary">{initials}</span>
                  }
                </div>
              </Link>
            </div>
          ) : (
            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="size-8 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
                {avatarUrl
                  ? <img src={avatarUrl} alt="" className="size-full object-cover" />
                  : <span className="text-xs font-bold text-primary">{initials}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{displayName || "Profile"}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser?.email || ""}</p>
              </div>
            </Link>
          )}
        </div>
      </aside>

      {/* ══════════════ MAIN AREA ══════════════ */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${mainMargin}`}>

        {/* Top nav bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-5 h-14 border-b border-border/30 bg-background/80 backdrop-blur-lg">

          {/* Left: hamburger */}
          <button
            onClick={handleMenuToggle}
            className="size-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="size-5" />
          </button>

          {/* Right: actions — logo link REMOVED */}
          <div className="flex items-center gap-1">

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="size-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            {/* Notifications */}
            <NotificationPanel />

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((p) => !p)}
                className="flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-muted/60 transition-colors"
              >
                <div className="size-7 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center ring-2 ring-primary/20">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="size-full object-cover" />
                    : <span className="text-xs font-bold text-primary">{initials}</span>
                  }
                </div>
                <ChevronDown className={`size-3.5 text-muted-foreground transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-border/50 bg-card/90 backdrop-blur-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border/30">
                    <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                  </div>
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <User className="size-4 text-muted-foreground" /> Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <Settings className="size-4 text-muted-foreground" /> Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}