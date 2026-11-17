import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { ArrowLeftRight, Bell, CalendarDays, CircleHelp, Compass, Home, LogOut, Settings, User, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Button, Logo } from "@/components/kit";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationList } from "@/pages/notifications";
import { markNotificationsRead, signOut } from "@/lib/api";
import { useMe } from "@/lib/auth";
import { useAction, useNotifications, useRealtime, useSessions, useSwaps } from "@/lib/hooks";
import { cn, displayName, errorMessage } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

function useNavItems(userId: string): NavItem[] {
  const { data: swaps } = useSwaps();
  const { data: sessions } = useSessions();
  const swapBadge = (swaps ?? []).reduce((n, s) => n + (s.status === "proposed" && !s.i_proposed ? 1 : 0) + (s.status === "accepted" && s.unread_count > 0 ? 1 : 0), 0);
  const sessionBadge = (sessions ?? []).filter((s) => s.status === "proposed" && s.proposed_by !== userId).length;
  return [
    { to: "/home", label: "Home", icon: Home },
    { to: "/discover", label: "Discover", icon: Compass },
    { to: "/swaps", label: "Swaps", icon: ArrowLeftRight, badge: swapBadge },
    { to: "/sessions", label: "Sessions", icon: CalendarDays, badge: sessionBadge },
    { to: "/me", label: "Me", icon: User },
  ];
}

function CountDot({ count, className }: { count?: number; className?: string }) {
  if (!count) return null;
  return (
    <span className={cn("grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold tabular-nums text-primary-foreground", className)}>
      {count > 9 ? "9+" : count}
      <span className="sr-only"> waiting for you</span>
    </span>
  );
}

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
          {unread > 0 && <span className="absolute right-2.5 top-2.5 size-2.5 rounded-full bg-primary ring-2 ring-background" aria-hidden />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-sans text-sm font-semibold tracking-normal">Notifications</h2>
          {unread > 0 && (
            <button type="button" onClick={() => markAll.mutate(undefined)} className="text-sm text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="scrollbar-thin max-h-[min(26rem,60dvh)] overflow-y-auto">
          <NotificationList limit={8} compact onNavigate={() => setOpen(false)} />
        </div>
        <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-border px-4 py-3 text-center text-sm text-muted-foreground hover:text-foreground">
          See all notifications
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
        <button type="button" aria-label="Account menu" className="rounded-full">
          <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-medium">{displayName(profile.full_name)}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/me")} className="min-h-10">
          <User /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/settings")} className="min-h-10">
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/help")} className="min-h-10">
          <CircleHelp /> Help
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} disabled={busy} className="min-h-10">
          <LogOut /> {busy ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AppShell() {
  const { user } = useMe();
  const navigate = useNavigate();
  const items = useNavItems(user.id);
  useRealtime(user.id, navigate);

  return (
    <div className="isolate min-h-dvh md:pl-60">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card/40 md:flex">
        <Link to="/home" className="flex h-16 items-center px-5" aria-label="SkillBridge home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-2">
          {items.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )
              }
            >
              <Icon className="size-[18px]" aria-hidden />
              <span className="flex-1">{label}</span>
              <CountDot count={badge} />
            </NavLink>
          ))}
        </nav>
        <p className="px-5 pb-5 text-xs leading-relaxed text-muted-foreground">Free, always. Skills are the only currency here.</p>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:h-16 md:px-6">
        <Link to="/home" className="md:hidden" aria-label="SkillBridge home">
          <Logo />
        </Link>
        <span className="hidden md:block" />
        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <UserMenu />
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>

      {/* Mobile tab bar */}
      <nav aria-label="Main" className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        <ul className="grid grid-cols-5">
          {items.map(({ to, label, icon: Icon, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}
              >
                <span className="relative">
                  <Icon className="size-5" aria-hidden />
                  <CountDot count={badge} className="absolute -right-3.5 -top-2 h-4 min-w-4 text-[10px]" />
                </span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
