import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowLeftRight, MessagesSquare, Search } from "lucide-react";
import { Avatar, ButtonLink, buttonClass, EmptyState, LoadError, Spinner } from "@/components/kit";
import { Chat } from "@/components/chat";
import { useMe } from "@/lib/auth";
import { useDocumentTitle, useSwaps } from "@/lib/hooks";
import type { Swap } from "@/lib/types";
import { cn, displayName, firstName, formatDay, formatTime, isUuid } from "@/lib/utils";

const stamp = (iso: string) => (formatDay(iso) === "Today" ? formatTime(iso) : formatDay(iso));

function ConversationRow({ swap, meId }: { swap: Swap; meId: string }) {
  const last = swap.last_message;
  const unread = swap.unread_count > 0;
  return (
    <li>
      <NavLink
        to={`/messages/${swap.id}`}
        className={({ isActive }) =>
          cn("flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors duration-150", isActive ? "bg-foreground/[0.07]" : "hover:bg-foreground/[0.04]")
        }
      >
        <span className="relative">
          <Avatar name={swap.other.full_name} src={swap.other.avatar_url} size="md" />
          {unread && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>{displayName(swap.other.full_name)}</span>
            {last && <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{stamp(last.created_at)}</span>}
          </span>
          <span className={cn("mt-0.5 block truncate text-[13px]", unread ? "text-foreground" : "text-muted-foreground")}>
            {last ? `${last.sender_id === meId ? "You: " : ""}${last.body}` : swap.status === "ended" ? "Swap ended" : "No messages yet"}
          </span>
        </span>
        {unread && (
          <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {swap.unread_count}
            <span className="sr-only"> unread</span>
          </span>
        )}
      </NavLink>
    </li>
  );
}

export default function Messages() {
  const { id } = useParams();
  const { user } = useMe();
  const navigate = useNavigate();
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
  useDocumentTitle(current ? `${firstName(current.other.full_name)} · Messages` : "Messages");

  return (
    <div className="flex h-[calc(100dvh-3.5rem-3.5rem-env(safe-area-inset-bottom))] md:h-[calc(100dvh-3.5rem)]">
      {/* Conversation list */}
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

      {/* Conversation */}
      <section aria-label="Conversation" className={cn("min-w-0 flex-1 flex-col", id ? "flex" : "hidden md:flex")}>
        {current ? (
          <>
            <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 sm:px-4">
              <button type="button" onClick={() => navigate("/messages")} className={buttonClass("ghost", "icon-sm", "-ml-1 md:hidden")} aria-label="Back to conversations">
                <ArrowLeft />
              </button>
              <Link to={`/people/${current.other.id}`} className="flex min-w-0 items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80">
                <Avatar name={current.other.full_name} src={current.other.avatar_url} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{displayName(current.other.full_name)}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{current.status === "ended" ? "Swap ended" : current.next_session_at ? `Next session ${formatDay(current.next_session_at)}, ${formatTime(current.next_session_at)}` : "Active swap"}</span>
                </span>
              </Link>
              <ButtonLink to={`/swaps/${current.id}`} variant="secondary" size="sm" className="ml-auto">
                <ArrowLeftRight /> <span className="hidden sm:inline">View swap</span>
              </ButtonLink>
            </header>
            <Chat key={current.id} swap={current} meId={user.id} />
          </>
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
