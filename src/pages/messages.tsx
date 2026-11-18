import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Ban, CalendarDays, Flag, MessagesSquare, MoreHorizontal, Search, X, XCircle } from "lucide-react";
import { Avatar, Button, ButtonLink, buttonClass, CountDot, EmptyState, LoadError, Spinner } from "@/components/kit";
import { Chat } from "@/components/chat";
import { ConfirmDialog } from "@/components/modal";
import { ReportDialog } from "@/components/people";
import { SwapSessions } from "@/components/swap-sessions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as api from "@/lib/api";
import { useMe } from "@/lib/auth";
import { useAction, useDocumentTitle, useSwaps } from "@/lib/hooks";
import type { Swap } from "@/lib/types";
import { cn, displayName, firstName, formatDay, formatTime, isUuid } from "@/lib/utils";

const stamp = (iso: string) => (formatDay(iso) === "Today" ? formatTime(iso) : formatDay(iso));

function preview(swap: Swap, meId: string) {
  const last = swap.last_message;
  if (!last) return swap.status === "ended" ? "Swap ended" : "No messages yet";
  const who = last.sender_id === meId ? "You: " : "";
  return `${who}${last.body || "Sent an attachment"}`;
}

function ConversationRow({ swap, meId }: { swap: Swap; meId: string }) {
  const last = swap.last_message;
  const unread = swap.unread_count > 0;
  return (
    <li>
      <NavLink to={`/messages/${swap.id}`} className={({ isActive }) => cn("flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors duration-150", isActive ? "bg-foreground/[0.07]" : "hover:bg-foreground/[0.04]")}>
        <span className="relative">
          <Avatar name={swap.other.full_name} src={swap.other.avatar_url} size="md" />
          {unread && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>{displayName(swap.other.full_name)}</span>
            {last && <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{stamp(last.created_at)}</span>}
          </span>
          <span className={cn("mt-0.5 block truncate text-[13px]", unread ? "text-foreground" : "text-muted-foreground")}>{preview(swap, meId)}</span>
        </span>
        {unread && <CountDot count={swap.unread_count} />}
      </NavLink>
    </li>
  );
}

/** Header, chat and this swap's sessions panel. */
function Conversation({ swap, meId }: { swap: Swap; meId: string }) {
  const navigate = useNavigate();
  const [showSessions, setShowSessions] = useState(false);
  const [dialog, setDialog] = useState<"end" | "report" | "block" | null>(null);
  const name = firstName(swap.other.full_name);

  useEffect(() => setShowSessions(false), [swap.id]);
  useEffect(() => {
    if (!showSessions) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShowSessions(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSessions]);

  const end = useAction(() => api.endSwap(swap.id), { invalidate: ["swaps", "swap", "sessions", "matches"], success: "Swap ended", onSuccess: () => setDialog(null) });
  const block = useAction(() => api.blockUser(swap.other.id), {
    invalidate: ["swaps", "swap", "sessions", "matches", "explore", "blocked", "person", "notifications"],
    success: "Blocked. They can no longer contact you.",
    onSuccess: () => navigate("/messages", { replace: true }),
  });

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-4">
        <button type="button" onClick={() => navigate("/messages")} className={buttonClass("ghost", "icon-sm", "-ml-1 md:hidden")} aria-label="Back to conversations">
          <ArrowLeft />
        </button>
        <Link to={`/people/${swap.other.id}`} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80">
          <Avatar name={swap.other.full_name} src={swap.other.avatar_url} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{displayName(swap.other.full_name)}</span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {swap.status === "ended" ? "Swap ended" : swap.next_session_at ? `Next session ${formatDay(swap.next_session_at)}, ${formatTime(swap.next_session_at)}` : "Active swap"}
            </span>
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", showSessions && "bg-foreground/[0.07] text-foreground")}
          onClick={() => setShowSessions((o) => !o)}
          aria-label={`Sessions with ${name}`}
          aria-expanded={showSessions}
          aria-controls="chat-sessions"
          title="Sessions"
        >
          <CalendarDays />
          {swap.sessions_to_answer > 0 && <CountDot count={swap.sessions_to_answer} className="absolute -right-0.5 -top-0.5 h-4 min-w-4 text-[9px]" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Conversation options">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-lg">
            {swap.status === "accepted" && (
              <>
                <DropdownMenuItem onSelect={() => setDialog("end")}>
                  <XCircle /> End swap
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onSelect={() => setDialog("report")}>
              <Flag /> Report {name}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDialog("block")} className="text-destructive focus:text-destructive">
              <Ban /> Block {name}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <Chat key={swap.id} swap={swap} meId={meId} />
        <aside
          id="chat-sessions"
          aria-label={`Sessions with ${name}`}
          aria-hidden={!showSessions}
          inert={!showSessions}
          className={cn(
            "absolute inset-y-0 right-0 z-10 flex w-full flex-col border-l border-border bg-background transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[360px] lg:static lg:transition-[width,transform]",
            showSessions ? "translate-x-0" : "translate-x-full lg:w-0 lg:overflow-hidden lg:border-l-0",
          )}
        >
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-border pl-4 pr-2">
            <p className="text-[13px] font-medium">Sessions with {name}</p>
            <Button variant="ghost" size="icon-sm" onClick={() => setShowSessions(false)} aria-label="Close sessions">
              <X />
            </Button>
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto p-4 lg:w-[360px]">{showSessions && <SwapSessions swap={swap} meId={meId} compact />}</div>
        </aside>
      </div>

      <ConfirmDialog
        open={dialog === "end"}
        onOpenChange={(o) => setDialog(o ? "end" : null)}
        title={`End your swap with ${name}?`}
        description="Upcoming sessions are cancelled and the chat becomes read-only for both of you. Completed sessions and vouches stay."
        confirmLabel="End swap"
        danger
        loading={end.isPending}
        onConfirm={() => end.mutate(undefined)}
      />
      <ConfirmDialog
        open={dialog === "block"}
        onOpenChange={(o) => setDialog(o ? "block" : null)}
        title={`Block ${name}?`}
        description="This swap ends and its sessions are cancelled. They won't see you in Discover and can't propose swaps. You can unblock them in Settings."
        confirmLabel="Block"
        danger
        loading={block.isPending}
        onConfirm={() => block.mutate(undefined)}
      />
      <ReportDialog personId={swap.other.id} personName={name} open={dialog === "report"} onOpenChange={(o) => setDialog(o ? "report" : null)} />
    </>
  );
}

export default function Messages() {
  const { id } = useParams();
  const { user } = useMe();
  const swaps = useSwaps();
  const [query, setQuery] = useState("");

  const conversations = useMemo(
    () =>
      (swaps.data ?? [])
        .filter((s) => s.status === "accepted" || (s.status === "ended" && s.last_message))
        .sort((a, b) => (b.last_message?.created_at ?? b.responded_at ?? b.created_at).localeCompare(a.last_message?.created_at ?? a.responded_at ?? a.created_at)),
    [swaps.data],
  );
  const shown = conversations.filter((c) => !query.trim() || displayName(c.other.full_name).toLowerCase().includes(query.trim().toLowerCase()));
  const current = isUuid(id) ? conversations.find((c) => c.id === id) : undefined;
  // On phones an open chat owns the screen: stop the page behind it from scrolling.
  useEffect(() => {
    if (!id) return;
    document.documentElement.classList.add("chat-open");
    return () => document.documentElement.classList.remove("chat-open");
  }, [id]);
  useDocumentTitle(current ? `${firstName(current.other.full_name)} · Messages` : "Messages");

  return (
    <div className={cn("flex md:h-[calc(100dvh-3.5rem)]", id ? "pb-safe fixed inset-x-0 top-0 z-40 h-dvh bg-background md:static md:z-auto md:pb-0" : "h-[calc(100dvh-3.5rem-3.5rem-env(safe-area-inset-bottom))]")}>
      <section aria-label="Conversations" className={cn("flex w-full shrink-0 flex-col border-r border-border md:w-80", id && "hidden md:flex")}>
        <div className="space-y-3 border-b border-border p-3">
          <h1 className="px-1 text-lg">Messages</h1>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
              className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-[16px] placeholder:text-muted-foreground/60 transition-[border-color] focus:border-primary/60 focus:outline-none sm:text-[13px]"
            />
          </div>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto p-2">
          {swaps.isPending ? (
            <Spinner />
          ) : swaps.isError ? (
            <LoadError error={swaps.error} retry={swaps.refetch} />
          ) : conversations.length === 0 ? (
            <div className="p-2">
              <EmptyState icon={MessagesSquare} title="No conversations yet" action={<ButtonLink to="/discover" size="sm">Find someone</ButtonLink>}>
                A conversation opens when someone accepts your swap, or you accept theirs.
              </EmptyState>
            </div>
          ) : shown.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">No one matches “{query}”.</p>
          ) : (
            <ul className="space-y-0.5">
              {shown.map((s) => (
                <ConversationRow key={s.id} swap={s} meId={user.id} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-label="Conversation" className={cn("min-w-0 flex-1 flex-col", id ? "flex" : "hidden md:flex")}>
        {current ? (
          <Conversation swap={current} meId={user.id} />
        ) : id && !swaps.isPending ? (
          <div className="grid flex-1 place-items-center p-6">
            <EmptyState icon={MessagesSquare} title="Conversation not found" action={<ButtonLink to="/messages" variant="secondary" size="sm">All messages</ButtonLink>}>
              It may belong to a swap that was declined or cancelled.
            </EmptyState>
          </div>
        ) : (
          <div className="grid flex-1 place-items-center p-6 text-center">
            <div>
              <span className="mx-auto mb-3 grid size-10 place-items-center rounded-lg bg-raised text-muted-foreground ring-1 ring-border">
                <MessagesSquare className="size-[18px]" aria-hidden />
              </span>
              <p className="text-sm font-medium">Pick a conversation</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Every accepted swap gets its own private chat.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
