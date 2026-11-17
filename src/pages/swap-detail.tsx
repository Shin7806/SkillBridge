import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Ban, CalendarPlus, Flag, MessageSquare, MoreHorizontal, XCircle } from "lucide-react";
import { Avatar, Badge, Button, ButtonLink, Card, EmptyState, LoadError, Page, Section, Spinner, SwapStrip } from "@/components/kit";
import { ConfirmDialog } from "@/components/modal";
import { ReportDialog } from "@/components/people";
import { groupSessions, SessionCard, SessionDialog } from "@/components/sessions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import * as api from "@/lib/api";
import { useMe } from "@/lib/auth";
import { useAction, useDocumentTitle, useSessions, useSwap } from "@/lib/hooks";
import type { Swap } from "@/lib/types";
import { displayName, firstName, formatDay, isUuid } from "@/lib/utils";

function Progress({ swap }: { swap: Swap }) {
  const total = swap.sessions_given + swap.sessions_received;
  const name = firstName(swap.other.full_name);
  const hint =
    total === 0
      ? "No sessions completed yet."
      : swap.sessions_given === swap.sessions_received
        ? "Even so far."
        : swap.sessions_given > swap.sessions_received
          ? `${name}'s turn to teach keeps it even.`
          : "Your turn to teach keeps it even.";
  return (
    <Card className="p-4">
      <div className="flex items-end justify-between gap-4">
        <dl className="flex gap-6">
          <div>
            <dt className="text-[12px] text-muted-foreground">You taught</dt>
            <dd className="text-2xl font-semibold tabular-nums text-primary">{swap.sessions_given}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">You learned</dt>
            <dd className="text-2xl font-semibold tabular-nums text-learn">{swap.sessions_received}</dd>
          </div>
        </dl>
        <p className="text-right text-[12px] text-muted-foreground">{hint}</p>
      </div>
      <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-raised" aria-hidden>
        {total > 0 && (
          <>
            <span className="h-full bg-primary transition-[width] duration-500" style={{ width: `${(swap.sessions_given / total) * 100}%` }} />
            <span className="h-full bg-learn transition-[width] duration-500" style={{ width: `${(swap.sessions_received / total) * 100}%` }} />
          </>
        )}
      </div>
    </Card>
  );
}

function SessionsSection({ swap, meId }: { swap: Swap; meId: string }) {
  const sessions = useSessions(swap.id);
  const [planning, setPlanning] = useState(false);
  const active = swap.status === "accepted";
  const g = sessions.data ? groupSessions(sessions.data, meId) : null;
  const current = g ? [...g.toAnswer, ...g.toFinish, ...g.upcoming, ...g.waiting] : [];

  return (
    <Section
      title="Sessions"
      count={sessions.data?.length}
      action={
        active ? (
          <Button size="sm" onClick={() => setPlanning(true)}>
            <CalendarPlus /> Plan a session
          </Button>
        ) : undefined
      }
    >
      {sessions.isPending ? (
        <Spinner label="Loading sessions" />
      ) : sessions.isError ? (
        <LoadError error={sessions.error} retry={sessions.refetch} />
      ) : sessions.data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted-foreground">
          {active ? "No sessions yet. Suggest a time and the other person confirms." : "No sessions were planned in this swap."}
        </p>
      ) : (
        <div className="space-y-4">
          {current.length > 0 && (
            <ul className="space-y-2">
              {current.map((s) => (
                <SessionCard key={s.id} session={s} swap={swap} meId={meId} />
              ))}
            </ul>
          )}
          {g!.past.length > 0 && (
            <div>
              <p className="mb-2 text-[12px] text-muted-foreground">Earlier</p>
              <ul className="space-y-2">
                {g!.past.map((s) => (
                  <SessionCard key={s.id} session={s} swap={swap} meId={meId} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <SessionDialog swap={swap} meId={meId} open={planning} onOpenChange={setPlanning} />
    </Section>
  );
}

export default function SwapDetail() {
  const { id } = useParams();
  const { user } = useMe();
  const navigate = useNavigate();
  const swap = useSwap(id);
  const [dialog, setDialog] = useState<"end" | "report" | "block" | null>(null);
  useDocumentTitle(swap.data ? `Swap with ${firstName(swap.data.other.full_name)}` : "Swap");

  const end = useAction(() => api.endSwap(id!), { invalidate: ["swaps", "swap", "sessions", "matches"], success: "Swap ended", onSuccess: () => setDialog(null) });
  const block = useAction(() => api.blockUser(swap.data!.other.id), {
    invalidate: ["swaps", "swap", "sessions", "matches", "explore", "blocked", "person", "notifications"],
    success: "Blocked. They can no longer contact you.",
    onSuccess: () => navigate("/swaps", { replace: true }),
  });

  if (!isUuid(id)) return <Navigate to="/swaps" replace />;
  if (swap.isPending) return <Page width="narrow"><Spinner /></Page>;
  if (swap.isError) return <Page width="narrow"><LoadError error={swap.error} retry={swap.refetch} /></Page>;
  if (!swap.data) {
    return (
      <Page width="narrow">
        <EmptyState icon={XCircle} title="Swap not found" action={<ButtonLink to="/swaps" variant="secondary" size="sm">Back to swaps</ButtonLink>}>
          It may have been cancelled, or it belongs to someone else.
        </EmptyState>
      </Page>
    );
  }

  const s = swap.data;
  // Proposals are answered from the list; declined and cancelled ones have no page.
  if (s.status !== "accepted" && s.status !== "ended") return <Navigate to="/swaps" replace />;
  const name = firstName(s.other.full_name);

  return (
    <Page width="narrow">
      <Link to="/swaps" className="-ml-1 mb-4 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Swaps
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link to={`/people/${s.other.id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-opacity hover:opacity-80">
          <Avatar name={s.other.full_name} src={s.other.avatar_url} size="lg" />
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <h1 className="truncate text-xl">{displayName(s.other.full_name)}</h1>
              {s.status === "ended" ? <Badge>Ended</Badge> : <Badge tone="success">Active</Badge>}
            </span>
            <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
              {s.cadence ? `${s.cadence} · ` : ""}since {formatDay(s.responded_at ?? s.created_at)}
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <ButtonLink to={`/messages/${s.id}`} size="md" className="relative flex-1 sm:flex-none">
            <MessageSquare /> Message
            {s.unread_count > 0 && <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-learn ring-2 ring-background" aria-label={`${s.unread_count} unread`} />}
          </ButtonLink>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" aria-label="Swap options">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-lg">
              {s.status === "accepted" && (
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
        </div>
      </header>

      <div className="mt-6 space-y-6">
        <Section title="Agreement">
          <Card className="p-4">
            <SwapStrip teach={s.i_teach.name} learn={s.i_learn.name} teachLabel="You teach" learnLabel="You learn" />
            {s.message && <p className="mt-3 border-l-2 border-border pl-3 text-[13px] text-muted-foreground">{s.message}</p>}
          </Card>
        </Section>
        <Section title="Progress">
          <Progress swap={s} />
        </Section>
        <SessionsSection swap={s} meId={user.id} />
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
      <ReportDialog personId={s.other.id} personName={name} open={dialog === "report"} onOpenChange={(o) => setDialog(o ? "report" : null)} />
    </Page>
  );
}
