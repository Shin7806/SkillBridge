import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeftRight, CalendarDays, ChevronRight, MessageSquare } from "lucide-react";
import { Avatar, Badge, Button, ButtonLink, buttonClass, EmptyState, LoadError, Page, PageHeader, Section, SkeletonCards, SwapStrip } from "@/components/kit";
import { ConfirmDialog } from "@/components/modal";
import * as api from "@/lib/api";
import { useAction, useDocumentTitle, useSwaps } from "@/lib/hooks";
import type { Swap } from "@/lib/types";
import { cn, displayName, firstName, formatDateTime, timeAgo } from "@/lib/utils";

const SWAP_KEYS = ["swaps", "swap", "matches", "notifications"];

function Proposal({ swap }: { swap: Swap }) {
  const navigate = useNavigate();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const name = firstName(swap.other.full_name);
  const respond = useAction((accept: boolean) => api.respondToSwap(swap.id, accept), {
    invalidate: SWAP_KEYS,
    success: (_) => undefined,
    onSuccess: (_, accept) => accept && navigate(`/swaps/${swap.id}`),
  });
  const cancel = useAction(() => api.cancelSwap(swap.id), { invalidate: SWAP_KEYS, success: "Proposal cancelled", onSuccess: () => setConfirmCancel(false) });

  return (
    <li className={cn("rounded-xl border bg-card p-4 animate-in fade-in-0 duration-300", swap.i_proposed ? "border-border" : "border-primary/30")}>
      <div className="flex flex-wrap items-center gap-3">
        <Link to={`/people/${swap.other.id}`} className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80">
          <Avatar name={swap.other.full_name} src={swap.other.avatar_url} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{displayName(swap.other.full_name)}</span>
            <span className="block truncate text-[12px] text-muted-foreground">{swap.i_proposed ? `Sent ${timeAgo(swap.created_at)} · waiting for ${name}` : `Proposed ${timeAgo(swap.created_at)}`}</span>
          </span>
        </Link>
        <div className="flex gap-1.5">
          {swap.i_proposed ? (
            <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(true)}>
              Cancel
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" loading={respond.isPending && respond.variables === false} disabled={respond.isPending} onClick={() => respond.mutate(false)}>
                Decline
              </Button>
              <Button size="sm" loading={respond.isPending && respond.variables === true} disabled={respond.isPending} onClick={() => respond.mutate(true)}>
                Accept
              </Button>
            </>
          )}
        </div>
      </div>
      <SwapStrip teach={swap.i_teach.name} learn={swap.i_learn.name} teachLabel="You teach" learnLabel="You learn" className="mt-3" />
      {(swap.message || swap.cadence) && (
        <div className="mt-3 space-y-1 border-l-2 border-border pl-3 text-[13px] text-muted-foreground">
          {swap.message && <p className="whitespace-pre-line text-foreground/85">{swap.message}</p>}
          {swap.cadence && <p>Rhythm: {swap.cadence}</p>}
        </div>
      )}
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this proposal?"
        description={`${name} will no longer see it. You can propose again later.`}
        confirmLabel="Cancel proposal"
        danger
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate(undefined)}
      />
    </li>
  );
}

function ActiveSwap({ swap }: { swap: Swap }) {
  return (
    <li className="group relative flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-foreground/[0.025] sm:flex-row sm:items-center">
      <Link to={`/swaps/${swap.id}`} className="absolute inset-0 rounded-[inherit]" aria-label={`Open swap with ${displayName(swap.other.full_name)}`} />
      <div className="flex min-w-0 items-center gap-3 sm:w-52">
        <Avatar name={swap.other.full_name} src={swap.other.avatar_url} size="sm" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{displayName(swap.other.full_name)}</span>
          <span className="block truncate text-[12px] text-muted-foreground">
            Taught {swap.sessions_given} · Learned {swap.sessions_received}
          </span>
        </span>
      </div>
      <SwapStrip teach={swap.i_teach.name} learn={swap.i_learn.name} className="min-w-0 flex-1" />
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground sm:w-56 sm:justify-end">
        {swap.sessions_to_answer > 0 ? (
          <Badge tone="teach">{swap.sessions_to_answer} to confirm</Badge>
        ) : (
          <span className="inline-flex items-center gap-1.5 truncate">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden />
            {swap.next_session_at ? formatDateTime(swap.next_session_at) : "No session booked"}
          </span>
        )}
        <Link to={`/messages/${swap.id}`} className={buttonClass("ghost", "icon-sm", "relative z-10 ml-auto sm:ml-0")} aria-label={`Message ${firstName(swap.other.full_name)}`} title="Message">
          <MessageSquare />
          {swap.unread_count > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-primary ring-2 ring-card" aria-hidden />}
        </Link>
        <ChevronRight className="hidden size-4 transition-transform duration-150 group-hover:translate-x-0.5 sm:block" aria-hidden />
      </div>
    </li>
  );
}

const PAST_LABEL: Record<string, string> = { declined: "Declined", cancelled: "Cancelled", ended: "Ended" };

export default function Swaps() {
  useDocumentTitle("Swaps");
  const swaps = useSwaps();
  const [showPast, setShowPast] = useState(false);
  const header = <PageHeader title="Swaps" description="Each swap is one agreement with one person: one skill each way." />;

  if (swaps.isPending) return <Page>{header}<SkeletonCards /></Page>;
  if (swaps.isError) return <Page>{header}<LoadError error={swaps.error} retry={swaps.refetch} /></Page>;

  const received = swaps.data.filter((s) => s.status === "proposed" && !s.i_proposed);
  const sent = swaps.data.filter((s) => s.status === "proposed" && s.i_proposed);
  const active = swaps.data.filter((s) => s.status === "accepted");
  const past = swaps.data.filter((s) => !["proposed", "accepted"].includes(s.status));

  return (
    <Page>
      {header}
      {swaps.data.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No swaps yet" action={<ButtonLink to="/discover">Find someone to swap with</ButtonLink>}>
          A swap starts when you propose one from someone's profile, or when someone proposes one to you.
        </EmptyState>
      ) : (
        <div className="space-y-7">
          {received.length > 0 && (
            <Section title="Waiting for your answer" count={received.length}>
              <ul className="space-y-2">
                {received.map((s) => (
                  <Proposal key={s.id} swap={s} />
                ))}
              </ul>
            </Section>
          )}

          <Section title="Active" count={active.length}>
            {active.length ? (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {active.map((s) => (
                  <ActiveSwap key={s.id} swap={s} />
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted-foreground">No active swaps. Accepted proposals appear here.</p>
            )}
          </Section>

          {sent.length > 0 && (
            <Section title="Sent" count={sent.length}>
              <ul className="space-y-2">
                {sent.map((s) => (
                  <Proposal key={s.id} swap={s} />
                ))}
              </ul>
            </Section>
          )}

          {past.length > 0 && (
            <section>
              <button type="button" aria-expanded={showPast} onClick={() => setShowPast((v) => !v)} className="flex h-8 items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground">
                <ChevronRight className={cn("size-3.5 transition-transform duration-200", showPast && "rotate-90")} aria-hidden />
                Past <span className="tabular-nums text-muted-foreground/60">{past.length}</span>
              </button>
              {showPast && (
                <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card animate-in fade-in-0 slide-in-from-top-1 duration-200">
                  {past.map((s) => {
                    const row = (
                      <>
                        <Avatar name={s.other.full_name} src={s.other.avatar_url} size="xs" />
                        <span className="min-w-0 flex-1 truncate text-[13px]">
                          <span className="font-medium">{displayName(s.other.full_name)}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            · {s.i_teach.name} for {s.i_learn.name}
                          </span>
                        </span>
                        <Badge>{PAST_LABEL[s.status]}</Badge>
                      </>
                    );
                    return (
                      <li key={s.id}>
                        {s.status === "ended" ? (
                          <Link to={`/swaps/${s.id}`} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-foreground/[0.03]">
                            {row}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-2.5">{row}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </Page>
  );
}
