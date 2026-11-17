import { CalendarDays } from "lucide-react";
import { ButtonLink, EmptyState, LoadError, Page, PageHeader, SkeletonCards } from "@/components/kit";
import { groupSessions, SessionCard } from "@/components/sessions";
import { useMe } from "@/lib/auth";
import { useDocumentTitle, useSessions, useSwaps } from "@/lib/hooks";
import type { Session } from "@/lib/types";
import { myTimezone } from "@/lib/utils";

export default function Sessions() {
  useDocumentTitle("Sessions");
  const { user } = useMe();
  const sessions = useSessions();
  const swaps = useSwaps();
  const header = <PageHeader title="Sessions" description={`Every session across your swaps, in your time (${myTimezone().replace(/_/g, " ")}).`} />;

  if (sessions.isPending) return <Page>{header}<SkeletonCards /></Page>;
  if (sessions.isError) return <Page>{header}<LoadError error={sessions.error} retry={sessions.refetch} /></Page>;

  const g = groupSessions(sessions.data, user.id);
  const swapFor = (s: Session) => swaps.data?.find((x) => x.id === s.swap_id) ?? null;
  const needsYou = [...g.toAnswer, ...g.toFinish, ...g.toVouch];
  const needsIds = new Set(needsYou.map((s) => s.id));

  const sections: { id: string; title: string; note?: string; items: Session[] }[] = [
    { id: "needs", title: "Needs you", note: "Confirm a time, mark a finished session as done, or vouch for your teacher.", items: needsYou },
    { id: "upcoming", title: "Upcoming", items: g.upcoming },
    { id: "waiting", title: "Waiting on them", items: g.waiting },
    { id: "past", title: "Past", items: g.past.filter((s) => !needsIds.has(s.id)) },
  ].filter((s) => s.items.length > 0);

  return (
    <Page>
      {header}
      {sections.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No sessions yet" action={<ButtonLink to="/swaps">Go to your swaps</ButtonLink>}>
          Sessions are planned inside a swap. Open one, suggest a time, and it appears here once sent.
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={`sessions-${section.id}`}>
              <h2 id={`sessions-${section.id}`} className="font-sans text-base font-semibold tracking-normal">
                {section.title} <span className="font-normal text-muted-foreground">· {section.items.length}</span>
              </h2>
              {section.note && <p className="mt-1 text-sm text-muted-foreground">{section.note}</p>}
              <ul className="mt-3 space-y-3">
                {section.items.map((s) => (
                  <SessionCard key={s.id} session={s} swap={swapFor(s)} meId={user.id} showSwapLink />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}
