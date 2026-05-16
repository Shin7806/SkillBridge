import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  FileText,
  Settings,
  Search,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationPanel } from "./NotificationPanel";
import { useAuth } from "../contexts/AuthContext";
import { useSidebar } from "../contexts/SidebarContext";
import { useProfile } from "../../hooks/useProfile";
import { getAvatarUrl, getDisplayName } from "../../utils/avatar";
import { useUnreadMessages } from "../../hooks/useUnreadMessages";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/matching", label: "Matches", icon: Search },
  { path: "/requests", label: "Requests", icon: FileText },
  { path: "/chat", label: "Chats", icon: MessageSquare },
];

const bottomNavItems = [
  { path: "/settings", label: "Settings", icon: Settings },
];

/* ───── Shared link renderer ───── */
function NavLink({
  item,
  isActive,
  onClick,
  unreadCount = 0,
}: {
  item: (typeof navItems)[number];
  isActive: boolean;
  onClick?: () => void;
  unreadCount?: number;
}) {
  const Icon = item.icon;

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-sidebar-accent text-primary font-semibold"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
    >
      <div className="relative">
        <Icon className="size-5 shrink-0" />
        {item.path === "/chat" && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 size-2.5 bg-red-500 rounded-full border-2 border-sidebar" />
        )}
      </div>
      <div className="flex flex-1 items-center justify-between">
        <span className="font-medium">{item.label}</span>
        {item.path === "/chat" && unreadCount > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════
   SIDEBAR — Desktop (fixed) + Mobile (drawer)
   ═══════════════════════════════════════════ */
export function Navigation() {
  const location = useLocation();
  const { isOpen, close } = useSidebar();
  const unreadCount = useUnreadMessages();

  function isActive(path: string) {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  }

  const sidebarContent = (
    <>
      {/* LOGO */}
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
        <Link
          to="/dashboard"
          className="flex items-center gap-2"
          onClick={close}
        >
          <div className="inline-flex items-center gap-2 mb-0">
  <img
    src="/logo.png"
    alt="SkillBridge"
    className="w-10 h-10 object-contain"
  />
          </div>
          <span className="font-bold text-2xl tracking-tight">
  SkillBridge
</span>
        </Link>

        {/* Close button — visible only on mobile */}
        <button
          onClick={close}
          className="md:hidden p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* TOP NAV */}
      <div className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            onClick={close}
            unreadCount={item.path === "/chat" ? unreadCount : 0}
          />
        ))}
      </div>

      {/* BOTTOM NAV */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            onClick={close}
          />
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ md) ── */}
      <nav className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border h-screen fixed top-0 left-0 flex-col z-40">
        {sidebarContent}
      </nav>

      {/* ── Mobile drawer overlay ── */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Dark backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />

        {/* Sliding panel */}
        <nav
          className={`absolute top-0 left-0 h-full w-72 bg-sidebar border-r border-sidebar-border flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </nav>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   TOP NAV — With hamburger + notifications
   ═══════════════════════════════════════════ */
export function TopNav() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { toggle } = useSidebar();

  const name = getDisplayName(user, profile);
  const avatarUrl = getAvatarUrl(profile?.avatar_url);

  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-sidebar-border px-4 sm:px-6 flex items-center justify-between bg-sidebar/80 backdrop-blur-md">
      {/* Left: Hamburger (mobile only) */}
      <button
        id="sidebar-toggle"
        onClick={toggle}
        className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Toggle navigation"
      >
        <Menu className="size-5" />
      </button>

      {/* Spacer so right items align right on desktop */}
      <div className="hidden md:block" />

      {/* Right items */}
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />

        <NotificationPanel />

        <Link to="/profile" className="shrink-0">
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt={name}
              className="size-8 rounded-full object-cover ring-2 ring-border hover:ring-primary transition-all"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold ring-2 ring-border hover:ring-primary transition-all">
              {initials || "U"}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}