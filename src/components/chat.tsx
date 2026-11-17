import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Lock, MessageSquare, SendHorizontal } from "lucide-react";
import { Button, EmptyState, LoadError, Spinner } from "./kit";
import * as api from "@/lib/api";
import { useAction, useMessages, useSendMessage } from "@/lib/hooks";
import type { Message, Swap } from "@/lib/types";
import { cn, displayName, firstName, formatDay, formatTime } from "@/lib/utils";

/** The conversation for one swap: history, live updates, composer. */
export function Chat({ swap, meId }: { swap: Swap; meId: string }) {
  const active = swap.status === "accepted";
  const messages = useMessages(swap.id);
  const send = useSendMessage(swap.id, meId);
  const markRead = useAction(() => api.markSwapRead(swap.id), { invalidate: ["swaps", "notifications"] });
  const [draft, setDraft] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const stickToBottom = useRef(true);
  const prevHeight = useRef(0);
  const list = messages.data ?? [];
  const lastId = list[list.length - 1]?.id;

  // Keep the newest message in view unless the reader scrolled up; keep position when older pages load.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (stickToBottom.current) el.scrollTop = el.scrollHeight;
    else el.scrollTop += el.scrollHeight - prevHeight.current;
    prevHeight.current = el.scrollHeight;
  }, [list.length]);

  // Opening a conversation focuses the composer on larger screens.
  useEffect(() => {
    if (active && window.matchMedia("(min-width: 768px)").matches) input.current?.focus();
    setDraft("");
    stickToBottom.current = true;
  }, [swap.id, active]);

  // Reading the conversation clears its unread state, now and as new messages arrive.
  const { mutate: markReadNow } = markRead;
  useEffect(() => {
    if (!lastId || document.visibilityState !== "visible") return;
    const last = list[list.length - 1];
    if (last.sender_id !== meId || swap.unread_count > 0) markReadNow(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId, swap.id]);

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
  const name = firstName(swap.other.full_name);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6"
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
            <EmptyState icon={MessageSquare} title={active ? `Say hello to ${name}` : "No messages"}>
              {active ? "Agree how you'd like to work, then plan your first session." : "This swap ended before any messages were sent."}
            </EmptyState>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            {messages.hasNextPage && (
              <div className="mb-3 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  loading={messages.isFetchingNextPage}
                  onClick={() => {
                    stickToBottom.current = false;
                    messages.fetchNextPage();
                  }}
                >
                  Load earlier messages
                </Button>
              </div>
            )}
            {groups.map((group) => (
              <div key={group.day}>
                <p className="my-4 flex items-center gap-3 text-[11px] font-medium text-muted-foreground/80 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">{group.day}</p>
                <ul className="space-y-0.5">
                  {group.items.map((m, i) => {
                    const mine = m.sender_id === meId;
                    const next = group.items[i + 1];
                    const prev = group.items[i - 1];
                    const lastOfRun = !next || next.sender_id !== m.sender_id;
                    const firstOfRun = !prev || prev.sender_id !== m.sender_id;
                    return (
                      <li key={m.id} className={cn("flex animate-in fade-in-0 slide-in-from-bottom-1 duration-200", mine ? "justify-end" : "justify-start", lastOfRun && "pb-2.5")}>
                        <div className={cn("group/msg flex max-w-[85%] items-end gap-2 sm:max-w-[70%]", mine && "flex-row-reverse")}>
                          <p
                            className={cn(
                              "whitespace-pre-wrap break-words px-3 py-1.5 text-[14px] leading-relaxed",
                              mine ? "bg-primary text-primary-foreground" : "bg-raised",
                              mine ? cn("rounded-2xl", !firstOfRun && "rounded-tr-md", !lastOfRun && "rounded-br-md") : cn("rounded-2xl", !firstOfRun && "rounded-tl-md", !lastOfRun && "rounded-bl-md"),
                            )}
                          >
                            <span className="sr-only">{mine ? "You: " : `${name}: `}</span>
                            {m.body}
                          </p>
                          <time dateTime={m.created_at} className={cn("shrink-0 pb-1 text-[10px] tabular-nums text-muted-foreground transition-opacity", lastOfRun ? "opacity-100" : "opacity-0 group-hover/msg:opacity-100")}>
                            {formatTime(m.created_at)}
                          </time>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {active ? (
        <form onSubmit={submit} className="border-t border-border bg-background p-3">
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-input bg-card p-1.5 transition-[border-color,box-shadow] focus-within:border-primary/60 focus-within:ring-[3px] focus-within:ring-primary/10">
            <label htmlFor="message" className="sr-only">
              Message {name}
            </label>
            <textarea
              ref={input}
              id="message"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={2000}
              placeholder={`Message ${name}`}
              className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-[16px] leading-snug text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:text-sm [field-sizing:content]"
            />
            <Button type="submit" size="icon-sm" aria-label="Send message" loading={send.isPending} disabled={!draft.trim()} className="mb-0.5">
              {!send.isPending && <SendHorizontal />}
            </Button>
          </div>
          <p className="mx-auto mt-1.5 hidden max-w-3xl px-1 text-[11px] text-muted-foreground/70 sm:block">Enter to send · Shift + Enter for a new line</p>
        </form>
      ) : (
        <p className="flex items-center justify-center gap-2 border-t border-border px-4 py-4 text-[13px] text-muted-foreground">
          <Lock className="size-3.5" aria-hidden /> This swap has ended. The conversation is read-only.
        </p>
      )}
    </div>
  );
}
