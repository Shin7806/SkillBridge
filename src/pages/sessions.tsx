import { useMemo, useState } from "react";
import { CalendarPlus, ChevronRight } from "lucide-react";
import { Avatar, Button, ButtonLink, Card, EmptyState, LoadError, Page, PageHeader, Section, Spinner } from "@/components/kit";
import { Modal } from "@/components/modal";
import { groupSessions, SessionCard, SessionDialog } from "@/components/sessions";
import { useMe } from "@/lib/auth";
import { useDocumentTitle, useSessions, useSwaps } from "@/lib/hooks";
import type { Session, Swap } from "@/lib/types";
import { cn, displayName, firstName } from "@/lib/utils";

const partnerOf = (s: Session, meId: string) => (s.teacher_id === meId ? s.learner : s.teacher);

function Group({ title, items, meId, swaps }: { title: string; items: Session[]; meId: string; swaps: Map<string, Swap> }) {
  if (!items.length) return null;
  return (
    <Section title={title} count={items.length}>
      <ul className="space-y-2">
        {items.map((s) => (
          <SessionCard key={s.id} session={s} swap={swaps.get(s.swap_id)} meId={meId} showSwapLink />
        ))}
      </ul>
    </Section>
  );
}

/** Step one of a new session: pick who it's with. Step two is the usual SessionDialog. */
function PickPartner({ open, onOpenChange, swaps, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; swaps: Swap[]; onPick: (s: Swap) => void }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="New session" description="Pick the swap this session belongs to.">
      {swaps.length === 0 ? (
        <EmptyState icon={CalendarPlus} title="No active swaps" action={<ButtonLink to="/discover" size="sm">Find someone</ButtonLink>}>
          Sessions happen inside an accepted swap.
        </EmptyState>
      ) : (
        <ul className="-mx-2 max-h-80 space-y-0.5 overflow-y-auto">
          {swaps.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => onPick(s)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-foreground/[0.05] focus-visible:bg-foreground/[0.05] focus-visible:outline-none">
                <Avatar name={s.other.full_name} src={s.other.avatar_url} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{displayName(s.other.full_name)}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">
                    You teach {s.i_teach.name} · learn {s.i_learn.name}
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export default function Sessions() {
  useDocumentTitle("Sessions");
  const { user } = useMe();
  const sessions = useSessions();
  const swaps = useSwaps();
  const [person, setPerson] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [planFor, setPlanFor] = useState<Swap | null>(null);

  const swapMap = useMemo(() => new Map((swaps.data ?? []).map((s) => [s.id, s])), [swaps.data]);
  const active = useMemo(() => (swaps.data ?? []).filter((s) => s.status === "accepted"), [swaps.data]);

  const people = useMemo(() => {
    const m = new Map<string, { id: string; name: string | null; avatar: string | null; count: number }>();
    for (const s of sessions.data ?? []) {
      const p = partnerOf(s, user.id);
      if (!p) continue;
      const e = m.get(p.id) ?? { id: p.id, name: p.full_name, avatar: p.avatar_url, count: 0 };
      e.count++;
      m.set(p.id, e);
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [sessions.data, user.id]);

  const filtered = (sessions.data ?? []).filter((s) => !person || partnerOf(s, user.id)?.id === person);
  const g = groupSessions(filtered, user.id);
  const needsYou = [...g.toAnswer, ...g.toFinish, ...g.toVouch];
  const vouchIds = new Set(g.toVouch.map((s) => s.id));
  const completed = filtered.filter((s) => s.status === "completed");
  const hours = completed.reduce((n, s) => n + s.duration_minutes, 0) / 60;

  const stats = [
    { label: "Upcoming", value: g.upcoming.length },
    { label: "Needs you", value: needsYou.length },
    { label: "Completed", value: completed.length },
    { label: "Hours", value: Math.round(hours * 10) / 10 },
  ];

  return (
    <Page>
      <PageHeader
        title="Sessions"
        description="Every session across all your swaps."
        action={
          <Button size="md" onClick={() => setPicking(true)}>
            <CalendarPlus /> New session
          </Button>
        }
      />

      {sessions.isPending || swaps.isPending ? (
        <Spinner label="Loading sessions" />
      ) : sessions.isError ? (
        <LoadError error={sessions.error} retry={sessions.refetch} />
      ) : sessions.data.length === 0 ? (
        <EmptyState icon={CalendarPlus} title="No sessions yet" action={active.length ? <Button size="sm" onClick={() => setPicking(true)}>Plan your first</Button> : <ButtonLink to="/discover" size="sm">Find someone</ButtonLink>}>
          Plan a time with someone you're swapping with. They confirm, and it shows up here.
        </EmptyState>
      ) : (
        <div className="space-y-6">
          <Card className="grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
            {stats.map((s) => (
              <div key={s.label} className="px-4 py-3">
                <p className="text-[12px] text-muted-foreground">{s.label}</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums">{s.value}</p>
              </div>
            ))}
          </Card>

          {people.length > 1 && (
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by person">
              <button type="button" onClick={() => setPerson(null)} aria-pressed={!person} className={cn("h-8 shrink-0 rounded-full border px-3 text-[13px] transition-colors", !person ? "border-foreground/20 bg-foreground/[0.08] text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
                Everyone
              </button>
              {people.map((p) => (
                <button key={p.id} type="button" onClick={() => setPerson(person === p.id ? null : p.id)} aria-pressed={person === p.id} className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-full border pl-1 pr-3 text-[13px] transition-colors", person === p.id ? "border-foreground/20 bg-foreground/[0.08] text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
                  <Avatar name={p.name} src={p.avatar} size="xs" />
                  {firstName(p.name)}
                  <span className="tabular-nums text-muted-foreground/70">{p.count}</span>
                </button>
              ))}
            </div>
          )}

          <Group title="Needs you" items={needsYou} meId={user.id} swaps={swapMap} />
          <Group title="Upcoming" items={g.upcoming} meId={user.id} swaps={swapMap} />
          <Group title="Waiting on them" items={g.waiting} meId={user.id} swaps={swapMap} />
          <Group title="Past" items={g.past.filter((s) => !vouchIds.has(s.id))} meId={user.id} swaps={swapMap} />
        </div>
      )}

      <PickPartner
        open={picking}
        onOpenChange={setPicking}
        swaps={active}
        onPick={(s) => {
          setPicking(false);
          setPlanFor(s);
        }}
      />
      {planFor && <SessionDialog swap={planFor} meId={user.id} open={!!planFor} onOpenChange={(o) => !o && setPlanFor(null)} />}
    </Page>
  );
}
