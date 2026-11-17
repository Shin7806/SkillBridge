import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, ImageIcon, Loader2, Lock, MessageSquare, Paperclip, Plus, SendHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, LoadError, Spinner } from "./kit";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import * as api from "@/lib/api";
import { useAction, useMessages, useSendMessage } from "@/lib/hooks";
import type { Message, Swap } from "@/lib/types";
import { cn, displayName, firstName, formatDay, formatTime } from "@/lib/utils";

const sizeLabel = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
const isImage = (type: string | null) => !!type && api.IMAGE_TYPES.includes(type);

/** An image or file attached to a message, fetched through a short-lived private link. */
function Attachment({ message, mine }: { message: Message; mine: boolean }) {
  const image = isImage(message.attachment_type);
  const url = useQuery({
    queryKey: ["attachment", message.attachment_path],
    queryFn: () => api.attachmentUrl(message.attachment_path!),
    staleTime: 50 * 60_000,
  });
  const download = async () => {
    try {
      window.open(await api.attachmentUrl(message.attachment_path!, message.attachment_name ?? "file"), "_blank", "noopener");
    } catch {
      toast.error("Could not open that file. Try again.");
    }
  };

  if (image) {
    return (
      <a
        href={url.data}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-xl bg-raised ring-1 ring-border transition-opacity hover:opacity-90"
        aria-label={`Open image ${message.attachment_name}`}
      >
        {url.data ? (
          <img src={url.data} alt={message.attachment_name ?? "Image"} loading="lazy" className="max-h-72 max-w-full object-contain" />
        ) : (
          <span className="grid h-40 w-56 place-items-center text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
          </span>
        )}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={download}
      className={cn(
        "group flex w-64 max-w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition-colors",
        mine ? "bg-primary/90 text-primary-foreground ring-primary hover:bg-primary" : "bg-raised ring-border hover:bg-accent",
      )}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", mine ? "bg-black/10" : "bg-background")}>
        <FileText className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{message.attachment_name}</span>
        <span className={cn("block text-[11px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{sizeLabel(message.attachment_size ?? 0)}</span>
      </span>
      <Download className="size-4 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" aria-label="Download" />
    </button>
  );
}

/** The conversation for one swap: history, live updates, composer with attachments. */
export function Chat({ swap, meId }: { swap: Swap; meId: string }) {
  const active = swap.status === "accepted";
  const messages = useMessages(swap.id);
  const send = useSendMessage(swap.id, meId);
  const markRead = useAction(() => api.markSwapRead(swap.id), { invalidate: ["swaps", "notifications"] });
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const imagePicker = useRef<HTMLInputElement>(null);
  const filePicker = useRef<HTMLInputElement>(null);
  const stickToBottom = useRef(true);
  const prevHeight = useRef(0);
  const list = messages.data ?? [];
  const lastId = list[list.length - 1]?.id;

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (stickToBottom.current) el.scrollTop = el.scrollHeight;
    else el.scrollTop += el.scrollHeight - prevHeight.current;
    prevHeight.current = el.scrollHeight;
  }, [list.length]);

  useEffect(() => {
    if (active && window.matchMedia("(min-width: 768px)").matches) input.current?.focus();
    setDraft("");
    setFile(null);
    stickToBottom.current = true;
  }, [swap.id, active]);

  // Local preview for a chosen image; released when it changes.
  useEffect(() => {
    if (!file || !isImage(file.type)) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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

  const pick = (chosen?: File) => {
    if (!chosen) return;
    const problem = api.attachmentProblem(chosen);
    if (problem) return toast.error(problem);
    setFile(chosen);
    input.current?.focus();
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const body = draft.trim();
    if ((!body && !file) || send.isPending) return;
    stickToBottom.current = true;
    send.mutate(
      { body, file },
      {
        onSuccess: () => {
          setDraft("");
          setFile(null);
          if (imagePicker.current) imagePicker.current.value = "";
          if (filePicker.current) filePicker.current.value = "";
        },
      },
    );
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
                          <div className={cn("flex min-w-0 flex-col gap-1", mine ? "items-end" : "items-start")}>
                            {m.attachment_path && <Attachment message={m} mine={mine} />}
                            {m.body && (
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
                            )}
                          </div>
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
          <div className="mx-auto max-w-3xl rounded-xl border border-input bg-card transition-[border-color,box-shadow] focus-within:border-primary/60 focus-within:ring-[3px] focus-within:ring-primary/10">
            {file && (
              <div className="flex items-center gap-3 border-b border-border p-2 animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
                {preview ? (
                  <img src={preview} alt="" className="size-12 rounded-md object-cover ring-1 ring-border" />
                ) : (
                  <span className="grid size-12 place-items-center rounded-md bg-raised text-muted-foreground ring-1 ring-border">
                    <FileText className="size-5" aria-hidden />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{file.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{sizeLabel(file.size)}</span>
                </span>
                <Button variant="ghost" size="icon-sm" aria-label="Remove attachment" onClick={() => setFile(null)} disabled={send.isPending}>
                  <X />
                </Button>
              </div>
            )}
            <div className="flex items-end gap-1.5 p-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Attach a photo or file" className="group mb-0.5" disabled={send.isPending}>
                    <Plus className="transition-transform duration-200 group-data-[state=open]:rotate-45" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-52 rounded-lg">
                  <DropdownMenuItem onSelect={() => imagePicker.current?.click()}>
                    <ImageIcon /> Photo
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => filePicker.current?.click()}>
                    <Paperclip /> File
                  </DropdownMenuItem>
                  <p className="px-2 pb-1 pt-1.5 text-[11px] text-muted-foreground">Up to 4 MB each</p>
                </DropdownMenuContent>
              </DropdownMenu>
              <input ref={imagePicker} type="file" accept={api.IMAGE_TYPES.join(",")} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => pick(e.target.files?.[0])} />
              <input ref={filePicker} type="file" accept={api.FILE_TYPES.join(",")} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => pick(e.target.files?.[0])} />
              <label htmlFor="message" className="sr-only">
                Message {name}
              </label>
              <textarea
                ref={input}
                id="message"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                onPaste={(e) => {
                  const pasted = [...e.clipboardData.files][0];
                  if (pasted) {
                    e.preventDefault();
                    pick(pasted);
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder={file ? "Add a message (optional)" : `Message ${name}`}
                className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-[16px] leading-snug text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:text-sm [field-sizing:content]"
              />
              <Button type="submit" size="icon-sm" aria-label="Send message" loading={send.isPending} disabled={!draft.trim() && !file} className="mb-0.5">
                {!send.isPending && <SendHorizontal />}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <p className="flex items-center justify-center gap-2 border-t border-border px-4 py-4 text-[13px] text-muted-foreground">
          <Lock className="size-3.5" aria-hidden /> This swap has ended. The conversation is read-only.
        </p>
      )}
    </div>
  );
}
