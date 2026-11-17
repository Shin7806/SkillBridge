import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftRight, Bell, CalendarDays, CalendarPlus, CircleHelp, Compass, Home, LogOut, MessagesSquare, PanelLeftClose, PanelLeftOpen, Settings, User, X, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Button, CountDot, EmptyState, LoadError, Logo, Spinner } from "@/components/kit";
import { groupSessions, SessionCard } from "@/components/sessions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationList } from "@/pages/notifications";
import { markNotificationsRead, signOut } from "@/lib/api";
import { useMe } from "@/lib/auth";
import { useAction, useMediaQuery, useNotifications, useRealtime, useSessions, useSwaps } from "@/lib/hooks";
import { SessionsPanelContext } from "@/lib/sessions-panel";
import type { Session } from "@/lib/types";
import { cn, displayName, errorMessage, myTimezone } from "@/lib/utils";


const readCollapsed = () => {
  try {
    return localStorage.getItem("sb:sidebar") === "collapsed";
  } catch {
    return false;
  }
};

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  mobile: boolean;
}

function useNavItems(): NavItem[] {
  const { data: swaps } = useSwaps();
  const list = swaps ?? [];
  const proposals = list.filter((s) => s.status === "proposed" && !s.i_proposed).length;
  const unread = list.filter((s) => s.unread_count > 0).length;
  return [
    { to: "/home", label: "Home", icon: Home, mobile: true },
    { to: "/discover", label: "Discover", icon: Compass, mobile: true },
    { to: "/swaps", label: "Swaps", icon: ArrowLeftRight, badge: proposals, mobile: true },
    { to: "/messages", label: "Messages", icon: MessagesSquare, badge: unread, mobile: true },
    { to: "/sessions", label: "Sessions", icon: CalendarDays, mobile: false },
    { to: "/profile", label: "Profile", icon: User, mobile: false },
  ];
}

function useSessionsNeedingYou(userId: string) {
  const { data } = useSessions();
  return (data ?? []).filter((s) => s.status === "proposed" && s.proposed_by !== userId).length;
}

// ── Top bar pieces ────────────────────────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data } = useNotifications();
  const unread = (data ?? []).filter((n) => !n.read_at).length;
  const markAll = useAction(() => markNotificationsRead(), { invalidate: ["notifications"] });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative">
          <Bell />
          {unread > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background animate-in zoom-in-0 duration-300" aria-hidden />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] rounded-xl p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-sm">Notifications</h2>
          {unread > 0 && (
            <button type="button" onClick={() => markAll.mutate(undefined)} className="text-[13px] text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="scrollbar-thin max-h-[min(24rem,60dvh)] overflow-y-auto">
          <NotificationList limit={8} compact onNavigate={() => setOpen(false)} />
        </div>
        <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-border px-4 py-2.5 text-center text-[13px] text-muted-foreground transition-colors hover:text-foreground">
          See all
        </Link>
      </PopoverContent>
    </Popover>
  );
}

function UserMenu() {
  const { user, profile } = useMe();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "Could not sign you out. Try again."));
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Account menu" className="rounded-full ring-offset-2 ring-offset-background transition-shadow hover:ring-2 hover:ring-border">
          <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-lg">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{displayName(profile.full_name)}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/profile")}>
          <User /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/settings")}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/help")}>
          <CircleHelp /> Help
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} disabled={busy}>
          <LogOut /> {busy ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Sessions panel ────────────────────────────────────────────────────────────
function SessionGroup({ title, items, meId }: { title: string; items: Session[]; meId: string }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="mb-2 text-[12px] font-medium tracking-normal text-muted-foreground">
        {title} <span className="tabular-nums text-muted-foreground/60">{items.length}</span>
      </h3>
      <ul className="space-y-2">
        {items.map((s) => (
          <SessionCard key={s.id} session={s} meId={meId} showSwapLink compact />
        ))}
      </ul>
    </section>
  );
}

function SessionsPanel({ open, onClose, meId }: { open: boolean; onClose: () => void; meId: string }) {
  const sessions = useSessions();
  const g = sessions.data ? groupSessions(sessions.data, meId) : null;
  const total = sessions.data?.length ?? 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <aside
      id="sessions-panel"
      aria-label="Sessions"
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "fixed bottom-0 right-0 top-14 z-40 flex w-full flex-col border-l border-border bg-background shadow-[-24px_0_48px_-24px_rgb(0_0_0/0.6)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[380px]",
        open ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border pl-4 pr-2">
        <div>
          <h2 className="text-sm">Sessions</h2>
        </div>
        <span className="mr-auto pl-2 text-[11px] text-muted-foreground">{myTimezone().replace(/_/g, " ")}</span>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close sessions">
          <X />
        </Button>
      </div>
      <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto p-4 pb-24 md:pb-6">
        {sessions.isPending ? (
          <Spinner label="Loading sessions" />
        ) : sessions.isError ? (
          <LoadError error={sessions.error} retry={sessions.refetch} />
        ) : total === 0 ? (
          <EmptyState icon={CalendarPlus} title="No sessions yet">
            Plan one from inside a swap. It appears here once sent.
          </EmptyState>
        ) : (
          g && (
            <>
              <SessionGroup title="Needs you" items={[...g.toAnswer, ...g.toFinish, ...g.toVouch]} meId={meId} />
              <SessionGroup title="Upcoming" items={g.upcoming} meId={meId} />
              <SessionGroup title="Waiting on them" items={g.waiting} meId={meId} />
              <SessionGroup title="Past" items={g.past.filter((s) => !(s.status === "completed" && s.learner_id === meId && !s.vouches.some((v) => v.from_id === meId))).slice(0, 10)} meId={meId} />
            </>
          )
        )}
      </div>
    </aside>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────
export default function AppShell() {
  const { user } = useMe();
  const navigate = useNavigate();
  const location = useLocation();
  const items = useNavItems();
  const sessionsDue = useSessionsNeedingYou(user.id);
  const wide = useMediaQuery("(min-width: 1280px)");
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [panelOpen, setPanelOpen] = useState(false);
  useRealtime(user.id, navigate);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      try {
        localStorage.setItem("sb:sidebar", c ? "expanded" : "collapsed");
      } catch {
        /* storage unavailable */
      }
      return !c;
    });
  }, []);

  // "[" toggles the sidebar, like most desktop tools.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "[" && !e.metaKey && !e.ctrlKey && !/input|textarea|select/i.test(t.tagName) && !t.isContentEditable) toggleCollapsed();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCollapsed]);

  // Close the panel on navigation when it would cover the page.
  useEffect(() => {
    if (!wide) setPanelOpen(false);
  }, [location.pathname, wide]);

  const panel = useMemo(() => ({ open: panelOpen, setOpen: setPanelOpen, toggle: () => setPanelOpen((o) => !o) }), [panelOpen]);
  const pushContent = panelOpen && wide;

  return (
    <SessionsPanelContext.Provider value={panel}>
      <div
        className={cn(
          "isolate min-h-dvh transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "md:pl-[60px]" : "md:pl-56",
        )}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
          Skip to content
        </a>

        {/* Desktop sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-card/40 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:flex",
            collapsed ? "w-[60px]" : "w-56",
          )}
        >
          <div className={cn("flex h-14 items-center border-b border-border", collapsed ? "justify-center" : "px-4")}>
            <Link to="/home" aria-label="SkillBridge home" className="transition-opacity hover:opacity-80">
              <Logo compact={collapsed} />
            </Link>
          </div>
          <nav aria-label="Main" className="flex-1 space-y-0.5 p-2">
            {items.map(({ to, label, icon: Icon, badge }) => (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                aria-label={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    "group relative flex h-9 items-center rounded-lg text-[13px] font-medium transition-colors duration-150",
                    collapsed ? "justify-center" : "gap-2.5 px-2.5",
                    isActive ? "bg-foreground/[0.07] text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute -left-2 top-2 h-5 w-[3px] rounded-r-full bg-primary animate-in fade-in-0 duration-200" aria-hidden />}
                    <Icon className={cn("size-[17px] shrink-0 transition-transform duration-200 group-hover:scale-105", isActive && "text-primary")} aria-hidden />
                    {!collapsed && <span className="flex-1 truncate">{label}</span>}
                    {collapsed ? badge ? <span className="absolute right-2.5 top-2 size-1.5 rounded-full bg-primary" aria-hidden /> : null : <CountDot count={badge} />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className={cn("border-t border-border p-2", collapsed && "flex justify-center")}>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              title={`${collapsed ? "Expand" : "Collapse"} sidebar  [`}
              className={cn("flex h-9 items-center gap-2.5 rounded-lg text-[13px] text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground", collapsed ? "w-9 justify-center" : "w-full px-2.5")}
            >
              {collapsed ? <PanelLeftOpen className="size-[17px]" /> : <PanelLeftClose className="size-[17px]" />}
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Collapse</span>
                  <kbd className="rounded border border-border px-1 font-sans text-[10px] text-muted-foreground/70">[</kbd>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 px-3 backdrop-blur-md sm:px-4">
          <Link to="/home" className="md:hidden" aria-label="SkillBridge home">
            <Logo />
          </Link>
          <span className="hidden md:block" />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              className={cn("relative", panelOpen && "bg-foreground/[0.07] text-foreground")}
              onClick={panel.toggle}
              aria-label={sessionsDue ? `Sessions, ${sessionsDue} to confirm` : "Sessions"}
              aria-expanded={panelOpen}
              aria-controls="sessions-panel"
              title="Sessions"
            >
              <CalendarDays />
              {sessionsDue > 0 && <CountDot count={sessionsDue} className="absolute -right-0.5 -top-0.5 h-4 min-w-4 text-[9px]" />}
            </Button>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden />
            <UserMenu />
          </div>
        </header>

        <main id="main" className={cn("transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]", pushContent && "xl:pr-[380px]")}>
          <Outlet />
        </main>

        <SessionsPanel open={panelOpen} onClose={() => setPanelOpen(false)} meId={user.id} />

        {/* Mobile tab bar */}
        <nav aria-label="Main" className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
          <ul className="grid grid-cols-4">
            {items
              .filter((i) => i.mobile)
              .map(({ to, label, icon: Icon, badge }) => (
                <li key={to}>
                  <NavLink to={to} className={({ isActive }) => cn("relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:scale-95", isActive ? "text-primary" : "text-muted-foreground")}>
                    <span className="relative">
                      <Icon className="size-5" aria-hidden />
                      <CountDot count={badge} className="absolute -right-3 -top-1.5 h-4 min-w-4 text-[9px]" />
                    </span>
                    {label}
                  </NavLink>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </SessionsPanelContext.Provider>
  );
}
