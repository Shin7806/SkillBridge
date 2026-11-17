import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, CalendarClock, CheckCircle2, Compass, Inbox, MessageSquare, Sparkles, ThumbsUp, type LucideIcon } from "lucide-react";
import { Avatar, ButtonLink, Card, LoadError, Page, SkeletonCards, SwapStrip } from "@/components/kit";
import { groupSessions } from "@/components/sessions";
import { useMe } from "@/lib/auth";
import { useDocumentTitle, useMatches, usePerson, useSessions, useSwaps } from "@/lib/hooks";
import { displayName, firstName, formatDateTime } from "@/lib/utils";

interface Todo {
  key: string;
  icon: LucideIcon;
  text: string;
  to: string;
}

function Stat({ value, label, to, tone }: { value: number | undefined; label: string; to: string; tone?: "teach" | "learn" }) {
  return (
    <Link to={to} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <p className={tone === "teach" ? "font-display text-3xl font-bold tabular-nums text-primary" : tone === "learn" ? "font-display text-3xl font-bold tabular-nums text-learn" : "font-display text-3xl font-bold tabular-nums"}>
        {value ?? "–"}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}

export default function Home() {
  useDocumentTitle("Home");
  const { user, profile } = useMe();
  const swaps = useSwaps();
  const sessions = useSessions();
  const matches = useMatches();
  const me = usePerson(user.id);

  const active = (swaps.data ?? []).filter((s) => s.status === "accepted");
  const g = sessions.data ? groupSessions(sessions.data, user.id) : null;
  const nextSession = g?.upcoming[0];
  const nextOther = nextSession ? (nextSession.teacher_id === user.id ? nextSession.learner : nextSession.teacher) : null;
  const twoWay = (matches.data ?? []).filter((m) => m.kind === "two_way");

  const todos: Todo[] = [];
  for (const s of swaps.data ?? []) {
    if (s.status === "proposed" && !s.i_proposed) todos.push({ key: `p-${s.id}`, icon: Inbox, text: `${firstName(s.other.full_name)} proposed a swap: ${s.i_teach.name} for ${s.i_learn.name}`, to: "/swaps" });
    if (s.status === "accepted" && s.unread_count > 0)
      todos.push({ key: `m-${s.id}`, icon: MessageSquare, text: `${s.unread_count} new ${s.unread_count === 1 ? "message" : "messages"} from ${firstName(s.other.full_name)}`, to: `/swaps/${s.id}` });
  }
  for (const s of g?.toAnswer ?? []) todos.push({ key: `a-${s.id}`, icon: CalendarClock, text: `Confirm a session on ${formatDateTime(s.starts_at)}`, to: "/sessions" });
  for (const s of g?.toFinish ?? []) todos.push({ key: `f-${s.id}`, icon: CheckCircle2, text: `Mark your ${s.skill?.name ?? ""} session as done`, to: "/sessions" });
  for (const s of g?.toVouch ?? []) todos.push({ key: `v-${s.id}`, icon: ThumbsUp, text: `Vouch for ${firstName(s.teacher?.full_name)} after your ${s.skill?.name ?? ""} session`, to: "/sessions" });

  const loading = swaps.isPending || sessions.isPending;
  const failed = swaps.isError ? swaps : sessions.isError ? sessions : null;

  return (
    <Page>
      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Hi {firstName(profile.full_name)}</h1>
        <p className="mt-1 text-muted-foreground">
          {loading ? "Checking what's new…" : todos.length ? `${todos.length} ${todos.length === 1 ? "thing needs" : "things need"} you.` : "You're all caught up."}
        </p>
      </header>

      {failed ? (
        <LoadError error={failed.error} retry={() => failed.refetch()} />
      ) : loading ? (
        <SkeletonCards count={2} />
      ) : (
        <div className="space-y-6">
          {todos.length > 0 && (
            <section aria-labelledby="needs-you">
              <h2 id="needs-you" className="mb-3 font-sans text-base font-semibold tracking-normal">
                Needs you
              </h2>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.04]">
                {todos.map(({ key, icon: Icon, text, to }) => (
                  <li key={key}>
                    <Link to={to} className="flex min-h-14 items-center gap-3 px-4 py-3 text-sm hover:bg-primary/[0.06]">
                      <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0 flex-1">{text}</span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {nextSession && (
            <section aria-labelledby="next-session">
              <h2 id="next-session" className="mb-3 font-sans text-base font-semibold tracking-normal">
                Next session
              </h2>
              <Card className="flex flex-wrap items-center gap-4 p-5">
                <span className="grid size-12 place-items-center rounded-2xl bg-success/10 text-success">
                  <CalendarCheck className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {nextSession.teacher_id === user.id ? `You teach ${nextSession.skill?.name} to ${firstName(nextOther?.full_name)}` : `${firstName(nextOther?.full_name)} teaches you ${nextSession.skill?.name}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(nextSession.starts_at)} · {nextSession.duration_minutes} min
                  </p>
                </div>
                <ButtonLink to={`/swaps/${nextSession.swap_id}`} variant="secondary" size="sm">
                  Open swap
                </ButtonLink>
              </Card>
            </section>
          )}

          <section aria-label="Your numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat value={matches.data ? twoWay.length : undefined} label="Two-way matches" to="/discover" />
            <Stat value={active.length} label="Active swaps" to="/swaps" />
            <Stat value={me.data?.sessions_given} label="Sessions taught" to="/sessions" tone="teach" />
            <Stat value={me.data?.sessions_received} label="Sessions learned" to="/sessions" tone="learn" />
          </section>

          {active.length > 0 ? (
            <section aria-labelledby="your-swaps">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="your-swaps" className="font-sans text-base font-semibold tracking-normal">
                  Your swaps
                </h2>
                <Link to="/swaps" className="text-sm text-primary hover:underline">
                  See all
                </Link>
              </div>
              <ul className="grid gap-3 md:grid-cols-2">
                {active.slice(0, 4).map((s) => (
                  <li key={s.id}>
                    <Link to={`/swaps/${s.id}`} className="block space-y-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20">
                      <span className="flex items-center gap-3">
                        <Avatar name={s.other.full_name} src={s.other.avatar_url} size="sm" />
                        <span className="min-w-0 flex-1 truncate font-medium">{displayName(s.other.full_name)}</span>
                      </span>
                      <SwapStrip teach={s.i_teach.name} learn={s.i_learn.name} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : (swaps.data ?? []).some((s) => s.status === "proposed") ? null : (
            <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                {twoWay.length ? <Sparkles className="size-5" aria-hidden /> : <Compass className="size-5" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-sans text-base font-semibold tracking-normal">
                  {twoWay.length ? `You have ${twoWay.length} two-way ${twoWay.length === 1 ? "match" : "matches"}` : "Start your first swap"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {twoWay.length
                    ? "Someone teaches what you want and wants what you teach. Propose a swap to get going."
                    : "Browse people by skill, or post an Ask saying what you'd like to learn."}
                </p>
              </div>
              <ButtonLink to={twoWay.length ? "/discover" : "/discover?tab=explore"}>
                {twoWay.length ? "See matches" : "Explore people"} <ArrowRight />
              </ButtonLink>
            </Card>
          )}
        </div>
      )}
    </Page>
  );
}
