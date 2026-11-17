import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Ban, CalendarPlus, Flag, Lock, MessageSquare, MoreHorizontal, SendHorizontal, XCircle } from "lucide-react";
import { Avatar, Button, ButtonLink, EmptyState, LoadError, Spinner, SwapStrip } from "@/components/kit";
import { ConfirmDialog } from "@/components/modal";
import { ReportDialog } from "@/components/people";
import { groupSessions, SessionCard, SessionDialog } from "@/components/sessions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as api from "@/lib/api";
import { useMe } from "@/lib/auth";
import { useAction, useDocumentTitle, useMediaQuery, useMessages, useSendMessage, useSessions, useSwap } from "@/lib/hooks";
import type { Message, Swap } from "@/lib/types";
import { cn, displayName, firstName, formatDay, formatTime, isUuid } from "@/lib/utils";

function Chat({ swap, meId }: { swap: Swap; meId: string }) {
  const active = swap.status === "accepted";
  const messages = useMessages(swap.id);
  const send = useSendMessage(swap.id, meId);
  const markRead = useAction(() => api.markSwapRead(swap.id), { invalidate: ["swaps", "notifications"] });
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const prevHeight = useRef(0);
  const list = messages.data ?? [];
  const lastId = list[list.length - 1]?.id;

  // Keep the newest message in view unless the reader has scrolled up; keep position when older pages load.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (stickToBottom.current) el.scrollTop = el.scrollHeight;
    else el.scrollTop += el.scrollHeight - prevHeight.current;
    prevHeight.current = el.scrollHeight;
  }, [list.length]);

  // Reading the conversation clears its unread state, now and as new messages arrive.
  const { mutate: markReadNow } = markRead;
  useEffect(() => {
    if (!lastId || document.visibilityState !== "visible") return;
    const last = list[list.length - 1];
    if (last.sender_id !== meId || swap.unread_count > 0) markReadNow(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId]);

  const groups = useMemo(() => {
    const out: { day: string; items: Message[] }[] = [];
    for (const m of list) {
      const day = formatDay(m.created_at);
      if (out[out.length - 1]?.day === day) out[out.length - 1].items.push(m);
      else out.push({ day, items: [m] });
    }
    return out;
  }, [list]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || send.isPending) return;
    stickToBottom.current = true;
    send.mutate(body, { onSuccess: () => setDraft("") });
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-4"
        role="log"
        aria-label={`Messages with ${displayName(swap.other.full_name)}`}
        aria-live="polite"
      >
        {messages.isPending ? (
          <Spinner label="Loading messages" />
        ) : messages.isError ? (
          <LoadError error={messages.error} retry={messages.refetch} />
        ) : list.length === 0 ? (
          <div className="grid h-full place-items-center">
            <EmptyState icon={MessageSquare} title={active ? `Say hello to ${firstName(swap.other.full_name)}` : "No messages"}>
              {active ? "Agree how you'd like to work, then plan your first session." : "This swap ended before any messages were sent."}
            </EmptyState>
          </div>
        ) : (
          <>
            {messages.hasNextPage && (
              <div className="mb-3 text-center">
                <Button variant="ghost" size="sm" loading={messages.isFetchingNextPage} onClick={() => { stickToBottom.current = false; messages.fetchNextPage(); }}>
                  Load earlier messages
                </Button>
              </div>
            )}
            {groups.map((group) => (
              <div key={group.day}>
                <p className="my-4 text-center text-xs text-muted-foreground">{group.day}</p>
                <ul className="space-y-1">
                  {group.items.map((m, i) => {
                    const mine = m.sender_id === meId;
                    const next = group.items[i + 1];
                    const lastOfRun = !next || next.sender_id !== m.sender_id;
                    return (
                      <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start", lastOfRun && "pb-2")}>
                        <div className={cn("max-w-[85%] sm:max-w-[70%]", mine && "text-right")}>
                          <p className={cn("inline-block whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-left text-[15px] leading-relaxed", mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-raised")}>
                            <span className="sr-only">{mine ? "You: " : `${firstName(swap.other.full_name)}: `}</span>
                            {m.body}
                          </p>
                          {lastOfRun && <p className="mt-1 text-[11px] text-muted-foreground">{formatTime(m.created_at)}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </>
        )}
      </div>

      {active ? (
        <form onSubmit={submit} className="flex items-end gap-2 border-t border-border p-3">
          <label htmlFor="message" className="sr-only">
            Message
          </label>
          <textarea
            id="message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={2000}
            placeholder={`Message ${firstName(swap.other.full_name)}`}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 leading-snug text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 [field-sizing:content]"
          />
          <Button type="submit" size="icon" aria-label="Send message" loading={send.isPending} disabled={!draft.trim()}>
            {!send.isPending && <SendHorizontal />}
          </Button>
        </form>
      ) : (
        <p className="flex items-center justify-center gap-2 border-t border-border px-4 py-4 text-sm text-muted-foreground">
          <Lock className="size-3.5" aria-hidden /> This swap has ended. The conversation is read-only.
        </p>
      )}
    </div>
  );
}

function SessionsPanel({ swap, meId }: { swap: Swap; meId: string }) {
  const sessions = useSessions(swap.id);
  const [planning, setPlanning] = useState(false);
  const active = swap.status === "accepted";
  const groups = sessions.data ? groupSessions(sessions.data, meId) : null;
  const current = groups ? [...groups.toAnswer, ...groups.toFinish, ...groups.upcoming, ...groups.waiting] : [];

  return (
    <div className="scrollbar-thin min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-primary/[0.08] px-4 py-3">
          <p className="font-display text-2xl font-bold tabular-nums text-primary">{swap.sessions_given}</p>
          <p className="text-xs text-muted-foreground">Sessions you taught</p>
        </div>
        <div className="rounded-xl bg-learn/[0.08] px-4 py-3">
          <p className="font-display text-2xl font-bold tabular-nums text-learn">{swap.sessions_received}</p>
          <p className="text-xs text-muted-foreground">Sessions you learned</p>
        </div>
      </div>
      {active && swap.sessions_given !== swap.sessions_received && (
        <p className="text-sm text-muted-foreground">
          {swap.sessions_given > swap.sessions_received ? `${firstName(swap.other.full_name)}'s turn to teach next keeps things even.` : "Your turn to teach next keeps things even."}
        </p>
      )}

      {active && (
        <Button className="w-full" onClick={() => setPlanning(true)}>
          <CalendarPlus /> Plan a session
        </Button>
      )}

      {sessions.isPending ? (
        <Spinner label="Loading sessions" />
      ) : sessions.isError ? (
        <LoadError error={sessions.error} retry={sessions.refetch} />
      ) : sessions.data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {active ? "No sessions yet. Suggest a time and the other person confirms." : "No sessions were planned in this swap."}
        </p>
      ) : (
        <>
          {current.length > 0 && (
            <section aria-label="Current sessions">
              <ul className="space-y-3">
                {current.map((s) => (
                  <SessionCard key={s.id} session={s} swap={swap} meId={meId} />
                ))}
              </ul>
            </section>
          )}
          {groups!.past.length > 0 && (
            <section aria-labelledby="past-sessions">
              <h3 id="past-sessions" className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Earlier
              </h3>
              <ul className="space-y-3">
                {groups!.past.map((s) => (
                  <SessionCard key={s.id} session={s} swap={swap} meId={meId} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
      <SessionDialog swap={swap} meId={meId} open={planning} onOpenChange={setPlanning} />
    </div>
  );
}

export default function SwapDetail() {
  const { id } = useParams();
  const { user } = useMe();
  const navigate = useNavigate();
  const swap = useSwap(id);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [tab, setTab] = useState<"chat" | "sessions">("chat");
  const [dialog, setDialog] = useState<"end" | "report" | "block" | null>(null);
  useDocumentTitle(swap.data ? `Swap with ${firstName(swap.data.other.full_name)}` : "Swap");

  const end = useAction(() => api.endSwap(id!), { invalidate: ["swaps", "swap", "sessions", "matches"], success: "Swap ended", onSuccess: () => setDialog(null) });
  const block = useAction(() => api.blockUser(swap.data!.other.id), {
    invalidate: ["swaps", "swap", "sessions", "matches", "explore", "blocked", "person", "notifications"],
    success: "Blocked. They can no longer contact you.",
    onSuccess: () => navigate("/swaps", { replace: true }),
  });

  if (!isUuid(id)) return <Navigate to="/swaps" replace />;
  if (swap.isPending) return <div className="p-6"><Spinner /></div>;
  if (swap.isError) return <div className="mx-auto max-w-xl p-6"><LoadError error={swap.error} retry={swap.refetch} /></div>;
  if (!swap.data) {
    return (
      <div className="mx-auto max-w-xl p-6">
        <EmptyState icon={XCircle} title="Swap not found" action={<ButtonLink to="/swaps" variant="secondary" size="sm">Back to swaps</ButtonLink>}>
          It may have been cancelled, or it belongs to someone else.
        </EmptyState>
      </div>
    );
  }

  const s = swap.data;
  // Proposals are answered from the list; declined and cancelled ones have no workspace.
  if (s.status !== "accepted" && s.status !== "ended") return <Navigate to="/swaps" replace />;
  const name = firstName(s.other.full_name);

  return (
    <div className="flex h-[calc(100dvh-3.5rem-4rem-env(safe-area-inset-bottom))] flex-col md:h-[calc(100dvh-4rem)]">
      <header className="border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <ButtonLink to="/swaps" variant="ghost" size="icon" aria-label="Back to swaps" className="-ml-2 shrink-0">
            <ArrowLeft />
          </ButtonLink>
          <Avatar name={s.other.full_name} src={s.other.avatar_url} size="sm" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-sans text-base font-semibold tracking-normal">
              <Link to={`/people/${s.other.id}`} className="hover:underline">
                {displayName(s.other.full_name)}
              </Link>
            </h1>
            <p className="truncate text-xs text-muted-foreground">{s.status === "ended" ? "Swap ended" : s.cadence || "Active swap"}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Swap options">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl">
              {s.status === "accepted" && (
                <DropdownMenuItem onSelect={() => setDialog("end")} className="min-h-10">
                  <XCircle /> End swap
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => setDialog("report")} className="min-h-10">
                <Flag /> Report {name}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setDialog("block")} className="min-h-10">
                <Ban /> Block {name}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <SwapStrip teach={s.i_teach.name} learn={s.i_learn.name} className="mt-3" />
      </header>

      {desktop ? (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_24rem]">
          <section aria-label="Chat" className="flex min-h-0 flex-col border-r border-border">
            <Chat swap={s} meId={user.id} />
          </section>
          <section aria-label="Sessions and progress" className="flex min-h-0 flex-col">
            <SessionsPanel swap={s} meId={user.id} />
          </section>
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="Swap sections" className="grid grid-cols-2 border-b border-border">
            {(["chat", "sessions"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                id={`tab-${t}`}
                aria-selected={tab === t}
                aria-controls={`panel-${t}`}
                onClick={() => setTab(t)}
                className={cn("h-11 border-b-2 text-sm font-medium", tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground")}
              >
                {t === "chat" ? "Chat" : "Sessions"}
                {t === "sessions" && s.sessions_to_answer > 0 && <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{s.sessions_to_answer}</span>}
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="flex min-h-0 flex-1 flex-col">
            {tab === "chat" ? <Chat swap={s} meId={user.id} /> : <SessionsPanel swap={s} meId={user.id} />}
          </div>
        </>
      )}

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
      <ReportDialog personId={s.other.id} personName={name} open={dialog === "report"} onOpenChange={(o) => setDialog(o ? "report" : null)} />
    </div>
  );
}
