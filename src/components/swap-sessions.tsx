import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Button, LoadError, Section, Spinner } from "./kit";
import { groupSessions, SessionCard, SessionDialog } from "./sessions";
import { useSessions } from "@/lib/hooks";
import type { Swap } from "@/lib/types";

/** Plan, manage and look back on the sessions of one swap. */
export function SwapSessions({ swap, meId, compact }: { swap: Swap; meId: string; compact?: boolean }) {
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
                <SessionCard key={s.id} session={s} swap={swap} meId={meId} compact={compact} />
              ))}
            </ul>
          )}
          {g!.past.length > 0 && (
            <div>
              <p className="mb-2 text-[12px] text-muted-foreground">History</p>
              <ul className="space-y-2">
                {g!.past.map((s) => (
                  <SessionCard key={s.id} session={s} swap={swap} meId={meId} compact={compact} />
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
