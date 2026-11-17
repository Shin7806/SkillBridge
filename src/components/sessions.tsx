import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, Check, Clock, Link2, MoreHorizontal, Video, X } from "lucide-react";
import { Badge, Button, buttonClass, FormError, SelectField, TextArea, TextField } from "./kit";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { ConfirmDialog, Modal } from "./modal";
import * as api from "@/lib/api";
import { useAction } from "@/lib/hooks";
import type { Session, Swap } from "@/lib/types";
import { cleanHttpsUrl, cn, downloadIcs, firstName, formatDay, formatTime, myTimezone, sessionEnd, toLocalInput } from "@/lib/utils";

const DURATIONS = [30, 45, 60, 90, 120];
const SESSION_KEYS = ["sessions", "swaps", "swap", "person", "notifications"];

const STATUS: Record<Session["status"], { label: string; tone: "neutral" | "teach" | "success" | "danger" }> = {
  proposed: { label: "Awaiting confirmation", tone: "teach" },
  confirmed: { label: "Confirmed", tone: "success" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

/** Propose a new session in a swap, or suggest a new time for an existing one. */
export function SessionDialog({ swap, session, meId, open, onOpenChange }: { swap: Pick<Swap, "id" | "other" | "i_teach" | "i_learn">; session?: Session | null; meId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const editing = !!session;
  const defaultStart = () => {
    const d = new Date(Date.now() + 24 * 3600_000);
    d.setMinutes(0, 0, 0);
    return toLocalInput(d);
  };
  const [iTeach, setITeach] = useState(true);
  const [when, setWhen] = useState(defaultStart);
  const [minutes, setMinutes] = useState(45);
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (session) {
      setWhen(toLocalInput(new Date(Math.max(new Date(session.starts_at).getTime(), Date.now() + 3600_000))));
      setMinutes(session.duration_minutes);
    } else {
      setWhen(defaultStart());
    }
  }, [open, session]);

  const done = () => onOpenChange(false);
  const propose = useAction(api.proposeSession, { invalidate: SESSION_KEYS, success: `Sent to ${firstName(swap.other.full_name)} to confirm`, onSuccess: () => { done(); setNotes(""); } });
  const reschedule = useAction((v: { startsAt: string; minutes: number }) => api.rescheduleSession(session!.id, v.startsAt, v.minutes), {
    invalidate: SESSION_KEYS,
    success: `New time sent to ${firstName(swap.other.full_name)}`,
    onSuccess: done,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const start = new Date(when);
    if (Number.isNaN(start.getTime())) return setError("Choose a date and time.");
    if (start.getTime() <= Date.now()) return setError("Choose a time in the future.");
    const url = link.trim() ? cleanHttpsUrl(link) : null;
    if (link.trim() && !url) return setError("The meeting link needs to be a valid https address.");
    setError(null);
    if (editing) reschedule.mutate({ startsAt: start.toISOString(), minutes });
    else propose.mutate({ swapId: swap.id, teacherId: iTeach ? meId : swap.other.id, startsAt: start.toISOString(), minutes, meetingUrl: url, notes });
  };

  const other = firstName(swap.other.full_name);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Suggest a new time" : "Plan a session"}
      description={editing ? `${other} will need to confirm the new time.` : `${other} confirms before it's booked.`}
      footer={
        <>
          <Button variant="ghost" onClick={done}>
            Cancel
          </Button>
          <Button type="submit" form="session-form" loading={propose.isPending || reschedule.isPending}>
            {editing ? "Send new time" : "Send to confirm"}
          </Button>
        </>
      }
    >
      <form id="session-form" onSubmit={submit} className="space-y-4">
        {!editing && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Who teaches this time?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { mine: true, title: `You teach ${swap.i_teach.name}`, tone: "border-primary/50 bg-primary/[0.07]" },
                { mine: false, title: `${other} teaches ${swap.i_learn.name}`, tone: "border-learn/50 bg-learn/[0.07]" },
              ].map((opt) => (
                <label key={String(opt.mine)} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2 text-sm", iTeach === opt.mine ? opt.tone : "border-input hover:border-foreground/30")}>
                  <input type="radio" name="teacher" checked={iTeach === opt.mine} onChange={() => setITeach(opt.mine)} className="size-4 accent-[var(--primary)]" />
                  {opt.title}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <TextField label="Date and time" type="datetime-local" value={when} min={toLocalInput(new Date())} onChange={(e) => setWhen(e.target.value)} required hint={`Your time (${myTimezone().replace(/_/g, " ")}). ${other} sees it in theirs.`} />
          <SelectField label="Length" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </SelectField>
        </div>
        {!editing && (
          <>
            <TextField label="Meeting link" optional value={link} onChange={(e) => setLink(e.target.value)} inputMode="url" placeholder="https://meet.google.com/…" hint="Google Meet, Zoom or any https link. You can add it later." />
            <TextArea label="What you'll cover" optional value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} className="min-h-20" />
          </>
        )}
        <FormError>{error}</FormError>
      </form>
    </Modal>
  );
}

function LinkDialog({ session, open, onOpenChange }: { session: Session; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [link, setLink] = useState(session.meeting_url ?? "");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) setLink(session.meeting_url ?? "");
  }, [open, session.meeting_url]);
  const save = useAction((url: string | null) => api.setSessionLink(session.id, url), { invalidate: ["sessions"], success: "Meeting link saved", onSuccess: () => onOpenChange(false) });
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Meeting link"
      description="Both of you will see it on the session."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            loading={save.isPending}
            onClick={() => {
              const url = link.trim() ? cleanHttpsUrl(link) : null;
              if (link.trim() && !url) return setError("Enter a valid https link.");
              setError(null);
              save.mutate(url);
            }}
          >
            Save link
          </Button>
        </>
      }
    >
      <TextField label="Link" value={link} onChange={(e) => setLink(e.target.value)} inputMode="url" placeholder="https://meet.google.com/…" error={error} />
    </Modal>
  );
}

function VouchDialog({ session, teacherName, open, onOpenChange }: { session: Session; teacherName: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [note, setNote] = useState("");
  const vouch = useAction(() => api.addVouch(session.id, note), { invalidate: SESSION_KEYS, success: `Thanks. Your vouch is on ${teacherName}'s profile.`, onSuccess: () => onOpenChange(false) });
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Vouch for ${teacherName}`}
      description={`Confirms that ${teacherName} taught you ${session.skill?.name ?? "this skill"}. It appears on their profile with your name.`}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button loading={vouch.isPending} onClick={() => vouch.mutate(undefined)}>
            Vouch
          </Button>
        </>
      }
    >
      <TextArea label="A line about the session" optional value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} placeholder="Clear, patient, and I finally understand layer masks." className="min-h-20" />
    </Modal>
  );
}

/** Small, scannable session row. The teach/learn indicator says who teaches what; secondary actions live in a menu. */
export function SessionCard({ session, swap, meId, showSwapLink, compact }: { session: Session; swap?: Pick<Swap, "id" | "other" | "i_teach" | "i_learn"> | null; meId: string; showSwapLink?: boolean; compact?: boolean }) {
  const [dialog, setDialog] = useState<"reschedule" | "link" | "vouch" | "cancel" | null>(null);
  const iTeach = session.teacher_id === meId;
  const other = iTeach ? session.learner : session.teacher;
  const otherName = firstName(other?.full_name);
  const skill = session.skill?.name ?? "a skill";
  const started = new Date(session.starts_at).getTime() <= Date.now();
  const mine = session.proposed_by === meId;
  const open = session.status === "proposed" || session.status === "confirmed";
  const vouched = session.vouches.some((v) => v.from_id === meId);
  const status = STATUS[session.status];
  const toAnswer = session.status === "proposed" && !mine;

  const respond = useAction((accept: boolean) => api.respondToSession(session.id, accept), { invalidate: SESSION_KEYS, success: (_) => undefined });
  const cancel = useAction(() => api.cancelSession(session.id), { invalidate: SESSION_KEYS, success: "Session cancelled", onSuccess: () => setDialog(null) });
  const complete = useAction(() => api.completeSession(session.id), { invalidate: SESSION_KEYS, success: "Marked as done" });

  // The swap is needed to suggest a new time; fall back to what the session itself knows.
  const swapForDialog = swap ?? {
    id: session.swap_id,
    other: { id: other?.id ?? "", full_name: other?.full_name ?? null, avatar_url: other?.avatar_url ?? null },
    i_teach: { id: "", name: iTeach ? skill : "" },
    i_learn: { id: "", name: iTeach ? "" : skill },
  };
  const calendar = () =>
    downloadIcs({
      id: session.id,
      title: iTeach ? `Teach ${skill} to ${otherName}` : `Learn ${skill} with ${otherName}`,
      startsAt: session.starts_at,
      minutes: session.duration_minutes,
      url: session.meeting_url,
      description: session.notes ?? "SkillBridge session",
    });
  const hasMenu = open || (session.status === "confirmed" && !started);

  return (
    <li
      className={cn(
        "group relative rounded-lg border bg-card transition-colors duration-200 hover:border-foreground/15",
        toAnswer ? "border-primary/35" : "border-border",
        session.status === "cancelled" && "opacity-55",
        compact ? "p-3" : "p-3.5",
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn("mt-1 size-2 shrink-0 rounded-full", iTeach ? "bg-primary" : "bg-learn")} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-muted-foreground">
            <span className={cn("font-medium", iTeach ? "text-primary" : "text-learn")}>{iTeach ? "You teach" : "You learn"}</span> {skill} <span className="text-muted-foreground/60">·</span> {iTeach ? "to" : "from"} {otherName}
          </p>
          <p className="mt-0.5 text-sm font-medium tabular-nums">
            <time dateTime={session.starts_at}>
              {formatDay(session.starts_at)}, {formatTime(session.starts_at)}
            </time>
            <span className="font-normal text-muted-foreground"> · {session.duration_minutes} min</span>
          </p>
        </div>
        <Badge tone={status.tone}>{session.status === "proposed" && mine ? `Waiting for ${otherName}` : status.label}</Badge>
        {hasMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="-mr-1.5 -mt-1" aria-label="Session options">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-lg">
              {session.status === "confirmed" && !started && (
                <DropdownMenuItem onSelect={calendar}>
                  <CalendarPlus /> Add to calendar
                </DropdownMenuItem>
              )}
              {open && (
                <DropdownMenuItem onSelect={() => setDialog("link")}>
                  <Link2 /> {session.meeting_url ? "Change meeting link" : "Add meeting link"}
                </DropdownMenuItem>
              )}
              {open && (session.status === "confirmed" || mine) && (
                <DropdownMenuItem onSelect={() => setDialog("reschedule")}>
                  <Clock /> Change time
                </DropdownMenuItem>
              )}
              {open && (session.status === "confirmed" || mine) && (
                <DropdownMenuItem onSelect={() => setDialog("cancel")} className="text-destructive focus:text-destructive">
                  <X /> Cancel session
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {session.notes && !compact && <p className="mt-2 pl-5 text-[13px] text-muted-foreground">{session.notes}</p>}

      {(toAnswer || (session.status === "confirmed" && (started || session.meeting_url)) || (session.status === "completed" && !iTeach) || showSwapLink) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-5">
          {toAnswer && (
            <>
              <Button size="sm" loading={respond.isPending && respond.variables === true} disabled={respond.isPending || started} onClick={() => respond.mutate(true)}>
                <Check /> Confirm
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setDialog("reschedule")}>
                Other time
              </Button>
              <Button size="sm" variant="ghost" loading={respond.isPending && respond.variables === false} disabled={respond.isPending} onClick={() => respond.mutate(false)}>
                Decline
              </Button>
            </>
          )}
          {session.status === "confirmed" && started && (
            <Button size="sm" loading={complete.isPending} onClick={() => complete.mutate(undefined)}>
              <Check /> Mark as done
            </Button>
          )}
          {open && session.meeting_url && (
            <a href={session.meeting_url} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
              <Video /> Join call
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}
          {session.status === "completed" &&
            !iTeach &&
            (vouched ? (
              <Badge tone="success">
                <Check className="size-3" aria-hidden /> You vouched
              </Badge>
            ) : (
              <Button size="sm" variant="learn" onClick={() => setDialog("vouch")}>
                Vouch for {otherName}
              </Button>
            ))}
          {showSwapLink && (
            <Link to={`/swaps/${session.swap_id}`} className="ml-auto text-[12px] text-muted-foreground transition-colors hover:text-foreground">
              View swap →
            </Link>
          )}
        </div>
      )}

      <SessionDialog swap={swapForDialog} session={session} meId={meId} open={dialog === "reschedule"} onOpenChange={(o) => setDialog(o ? "reschedule" : null)} />
      <LinkDialog session={session} open={dialog === "link"} onOpenChange={(o) => setDialog(o ? "link" : null)} />
      <VouchDialog session={session} teacherName={otherName} open={dialog === "vouch"} onOpenChange={(o) => setDialog(o ? "vouch" : null)} />
      <ConfirmDialog
        open={dialog === "cancel"}
        onOpenChange={(o) => setDialog(o ? "cancel" : null)}
        title="Cancel this session?"
        description={`${otherName} will be told. You can plan a new one any time.`}
        confirmLabel="Cancel session"
        danger
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate(undefined)}
      />
    </li>
  );
}

/** Splits sessions into the groups every sessions view uses. */
export function groupSessions(sessions: Session[], meId: string) {
  const now = Date.now();
  const live = (s: Session) => sessionEnd(s.starts_at, s.duration_minutes).getTime() > now;
  return {
    toAnswer: sessions.filter((s) => s.status === "proposed" && s.proposed_by !== meId),
    toFinish: sessions.filter((s) => s.status === "confirmed" && new Date(s.starts_at).getTime() <= now),
    upcoming: sessions.filter((s) => s.status === "confirmed" && new Date(s.starts_at).getTime() > now),
    waiting: sessions.filter((s) => s.status === "proposed" && s.proposed_by === meId && live(s)),
    toVouch: sessions.filter((s) => s.status === "completed" && s.learner_id === meId && !s.vouches.some((v) => v.from_id === meId)),
    past: sessions
      .filter((s) => s.status === "completed" || s.status === "cancelled" || (s.status === "proposed" && s.proposed_by === meId && !live(s)))
      .sort((a, b) => b.starts_at.localeCompare(a.starts_at)),
  };
}
