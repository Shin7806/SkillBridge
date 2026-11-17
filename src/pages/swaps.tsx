import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, CalendarDays, ChevronRight } from "lucide-react";
import { Avatar, Badge, Button, ButtonLink, Card, EmptyState, LoadError, Page, PageHeader, SkeletonCards, SwapStrip } from "@/components/kit";
import { ConfirmDialog } from "@/components/modal";
import * as api from "@/lib/api";
import { useAction, useDocumentTitle, useSwaps } from "@/lib/hooks";
import type { Swap } from "@/lib/types";
import { displayName, firstName, formatDateTime, timeAgo } from "@/lib/utils";

const SWAP_KEYS = ["swaps", "swap", "matches", "notifications"];

function Who({ swap, meta }: { swap: Swap; meta: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={swap.other.full_name} src={swap.other.avatar_url} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          <Link to={`/people/${swap.other.id}`} className="hover:underline">
            {displayName(swap.other.full_name)}
          </Link>
        </p>
        <p className="truncate text-sm text-muted-foreground">{meta}</p>
      </div>
    </div>
  );
}

function Proposal({ swap }: { swap: Swap }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const name = firstName(swap.other.full_name);
  const respond = useAction((accept: boolean) => api.respondToSwap(swap.id, accept), {
    invalidate: SWAP_KEYS,
    success: (_) => undefined,
  });
  const cancel = useAction(() => api.cancelSwap(swap.id), { invalidate: SWAP_KEYS, success: "Proposal cancelled", onSuccess: () => setConfirmCancel(false) });

  return (
    <Card as="li" className="space-y-4 p-5">
      <Who swap={swap} meta={swap.i_proposed ? `Sent ${timeAgo(swap.created_at)} · waiting for ${name}` : `Proposed ${timeAgo(swap.created_at)}`} />
      <SwapStrip teach={swap.i_teach.name} learn={swap.i_learn.name} />
      {swap.message && <blockquote className="whitespace-pre-line border-l-2 border-border pl-3.5 text-sm text-muted-foreground">{swap.message}</blockquote>}
      {swap.cadence && <p className="text-sm text-muted-foreground">Suggested rhythm: {swap.cadence}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        {swap.i_proposed ? (
          <Button variant="secondary" size="sm" onClick={() => setConfirmCancel(true)}>
            Cancel proposal
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" loading={respond.isPending && respond.variables === false} disabled={respond.isPending} onClick={() => respond.mutate(false)}>
              Decline
            </Button>
            <Button size="sm" loading={respond.isPending && respond.variables === true} disabled={respond.isPending} onClick={() => respond.mutate(true)}>
              Accept swap
            </Button>
          </>
        )}
      </div>
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
    </Card>
  );
}

function ActiveSwap({ swap }: { swap: Swap }) {
  const preview = swap.last_message ? swap.last_message.body : "No messages yet. Say hello.";
  return (
    <li>
      <Link to={`/swaps/${swap.id}`} className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/20">
        <div className="flex items-center gap-3">
          <Avatar name={swap.other.full_name} src={swap.other.avatar_url} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-medium">
              <span className="truncate">{displayName(swap.other.full_name)}</span>
              {swap.unread_count > 0 && <Badge tone="teach">{swap.unread_count} new</Badge>}
            </p>
            <p className={swap.unread_count > 0 ? "truncate text-sm text-foreground" : "truncate text-sm text-muted-foreground"}>{preview}</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </div>
        <SwapStrip teach={swap.i_teach.name} learn={swap.i_learn.name} className="mt-4" />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden />
            {swap.next_session_at ? `Next session ${formatDateTime(swap.next_session_at)}` : "No session booked"}
          </span>
          {swap.sessions_to_answer > 0 && <span className="text-primary">{swap.sessions_to_answer} session to confirm</span>}
          <span>
            Taught {swap.sessions_given} · Learned {swap.sessions_received}
          </span>
        </div>
      </Link>
    </li>
  );
}

const PAST_LABEL: Record<string, string> = { declined: "Declined", cancelled: "Cancelled", ended: "Ended" };

export default function Swaps() {
  useDocumentTitle("Swaps");
  const swaps = useSwaps();
  const [showPast, setShowPast] = useState(false);

  if (swaps.isPending) return <Page><PageHeader title="Swaps" /><SkeletonCards /></Page>;
  if (swaps.isError) return <Page><PageHeader title="Swaps" /><LoadError error={swaps.error} retry={swaps.refetch} /></Page>;

  const received = swaps.data.filter((s) => s.status === "proposed" && !s.i_proposed);
  const sent = swaps.data.filter((s) => s.status === "proposed" && s.i_proposed);
  const active = swaps.data.filter((s) => s.status === "accepted");
  const past = swaps.data.filter((s) => !["proposed", "accepted"].includes(s.status));

  return (
    <Page>
      <PageHeader title="Swaps" description="Each swap is one agreement with one person: its chat, its sessions, its progress." />

      {swaps.data.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No swaps yet" action={<ButtonLink to="/discover">Find someone to swap with</ButtonLink>}>
          A swap starts when you propose one from someone's profile, or when someone proposes one to you.
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {received.length > 0 && (
            <section aria-labelledby="received">
              <h2 id="received" className="mb-3 font-sans text-base font-semibold tracking-normal">
                Waiting for your answer <span className="font-normal text-muted-foreground">· {received.length}</span>
              </h2>
              <ul className="space-y-3">
                {received.map((s) => (
                  <Proposal key={s.id} swap={s} />
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="active">
            <h2 id="active" className="mb-3 font-sans text-base font-semibold tracking-normal">
              Active <span className="font-normal text-muted-foreground">· {active.length}</span>
            </h2>
            {active.length ? (
              <ul className="space-y-3">
                {active.map((s) => (
                  <ActiveSwap key={s.id} swap={s} />
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">No active swaps. Accepted proposals appear here with their chat and sessions.</p>
            )}
          </section>

          {sent.length > 0 && (
            <section aria-labelledby="sent">
              <h2 id="sent" className="mb-3 font-sans text-base font-semibold tracking-normal">
                Sent <span className="font-normal text-muted-foreground">· {sent.length}</span>
              </h2>
              <ul className="space-y-3">
                {sent.map((s) => (
                  <Proposal key={s.id} swap={s} />
                ))}
              </ul>
            </section>
          )}

          {past.length > 0 && (
            <section aria-labelledby="past">
              <button type="button" id="past" aria-expanded={showPast} onClick={() => setShowPast((v) => !v)} className="flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ChevronRight className={showPast ? "size-4 rotate-90 transition-transform" : "size-4 transition-transform"} aria-hidden />
                Past swaps · {past.length}
              </button>
              {showPast && (
                <ul className="mt-2 divide-y divide-border rounded-2xl border border-border bg-card">
                  {past.map((s) => {
                    const row = (
                      <>
                        <Avatar name={s.other.full_name} src={s.other.avatar_url} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{displayName(s.other.full_name)}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {s.i_teach.name} for {s.i_learn.name}
                          </span>
                        </span>
                        <Badge>{PAST_LABEL[s.status]}</Badge>
                      </>
                    );
                    return (
                      <li key={s.id}>
                        {s.status === "ended" ? (
                          <Link to={`/swaps/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50">
                            {row}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-4 py-3">{row}</div>
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
