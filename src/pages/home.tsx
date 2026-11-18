import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck, CalendarClock, CheckCircle2, ChevronRight, Compass, Inbox, MessageSquare, Sparkles, ThumbsUp, type LucideIcon } from "lucide-react";
import { Avatar, ButtonLink, Card, LoadError, Page, Section, SkeletonCards, SwapStrip } from "@/components/kit";
import { groupSessions } from "@/components/sessions";
import { useMe } from "@/lib/auth";
import { useDocumentTitle, useMatches, usePerson, useSessions, useSwaps } from "@/lib/hooks";
import { useSessionsPanel } from "@/lib/sessions-panel";
import { cn, displayName, firstName, formatDateTime } from "@/lib/utils";

interface Todo {
  key: string;
  icon: LucideIcon;
  text: string;
  to?: string;
  sessions?: boolean;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Stat({ value, label, to, onClick, tone }: { value: number | undefined; label: string; to?: string; onClick?: () => void; tone?: "teach" | "learn" }) {
  const body = (
    <>
      <span className={cn("text-xl font-semibold tabular-nums", tone === "teach" && "text-primary", tone === "learn" && "text-learn")}>{value ?? "–"}</span>
      <span className="text-[12px] text-muted-foreground">{label}</span>
    </>
  );
  const cls = "flex flex-col gap-0.5 rounded-lg border border-border bg-card px-3.5 py-3 text-left transition-[border-color,transform] duration-150 hover:-translate-y-px hover:border-foreground/15";
  return to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

const QUOTES: [string, string][] = [
  ["While we teach, we learn.", "Seneca"],
  ["Tell me and I forget. Involve me and I learn.", "Proverb"],
  ["Learning never exhausts the mind.", "Leonardo da Vinci"],
  ["The beautiful thing about learning is nobody can take it away from you.", "B.B. King"],
  ["To teach is to learn twice.", "Joseph Joubert"],
  ["Live as if you were to die tomorrow. Learn as if you were to live forever.", "Gandhi"],
  ["An investment in knowledge pays the best interest.", "Benjamin Franklin"],
  ["Anyone who stops learning is old.", "Henry Ford"],
  ["Knowledge shared is knowledge multiplied.", "Proverb"],
  ["The expert in anything was once a beginner.", "Helen Hayes"],
  ["Real knowledge is to know the extent of one's ignorance.", "Confucius"],
  ["Curiosity is the wick in the candle of learning.", "William Arthur Ward"],
  ["We learn more by looking for the answer than by finding it.", "Lloyd Alexander"],
  ["Every expert started by asking someone for help.", "SkillBridge"],
];

/** Same quote all day, a new one tomorrow. */
function DailyQuote() {
  const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60_000) / 86_400_000);
  const [text, author] = QUOTES[day % QUOTES.length];
  return (
    <figure className="max-w-sm border-l-2 border-primary/50 pl-3 sm:text-right sm:border-l-0 sm:border-r-2 sm:pl-0 sm:pr-3">
      <blockquote className="text-[13px] italic leading-relaxed text-foreground/80">“{text}”</blockquote>
      <figcaption className="mt-1 text-[11px] text-muted-foreground">— {author}</figcaption>
    </figure>
  );
}

export default function Home() {
  useDocumentTitle("Home");
  const { user, profile } = useMe();
  const swaps = useSwaps();
  const sessions = useSessions();
  const matches = useMatches();
  const me = usePerson(user.id);
  const panel = useSessionsPanel();

  const active = (swaps.data ?? []).filter((s) => s.status === "accepted");
  const g = sessions.data ? groupSessions(sessions.data, user.id) : null;
  const next = g?.upcoming[0];
  const nextOther = next ? (next.teacher_id === user.id ? next.learner : next.teacher) : null;
  const twoWay = (matches.data ?? []).filter((m) => m.kind === "two_way");

  const todos: Todo[] = [];
  for (const s of swaps.data ?? []) {
    if (s.status === "proposed" && !s.i_proposed) todos.push({ key: `p-${s.id}`, icon: Inbox, text: `${firstName(s.other.full_name)} proposed a swap: ${s.i_teach.name} for ${s.i_learn.name}`, to: "/swaps" });
    if (s.status === "accepted" && s.unread_count > 0) todos.push({ key: `m-${s.id}`, icon: MessageSquare, text: `${s.unread_count} new ${s.unread_count === 1 ? "message" : "messages"} from ${firstName(s.other.full_name)}`, to: `/messages/${s.id}` });
  }
  for (const s of g?.toAnswer ?? []) todos.push({ key: `a-${s.id}`, icon: CalendarClock, text: `Confirm a session on ${formatDateTime(s.starts_at)}`, sessions: true });
  for (const s of g?.toFinish ?? []) todos.push({ key: `f-${s.id}`, icon: CheckCircle2, text: `Mark your ${s.skill?.name ?? ""} session as done`, sessions: true });
  for (const s of g?.toVouch ?? []) todos.push({ key: `v-${s.id}`, icon: ThumbsUp, text: `Vouch for ${firstName(s.teacher?.full_name)} after your ${s.skill?.name ?? ""} session`, sessions: true });

  const loading = swaps.isPending || sessions.isPending;
  const failed = swaps.isError ? swaps : sessions.isError ? sessions : null;

  return (
    <Page>
      <header className="relative mb-7 overflow-hidden rounded-2xl border border-border bg-card px-5 py-6 sm:px-7 sm:py-7">
        {/* Quiet backdrop: two soft brand glows over a faint grid that fades out. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_90%_at_0%_0%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_70%),radial-gradient(50%_80%_at_100%_100%,color-mix(in_oklab,var(--learn)_12%,transparent),transparent_70%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_6%,transparent)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(80%_100%_at_70%_0%,black,transparent)]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl">
              {greeting()}, {firstName(profile.full_name)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{loading ? "Checking what's new…" : todos.length ? `${todos.length} ${todos.length === 1 ? "thing needs" : "things need"} you.` : "You're all caught up."}</p>
          </div>
          <DailyQuote />
        </div>
      </header>

      {failed ? (
        <LoadError error={failed.error} retry={() => failed.refetch()} />
      ) : loading ? (
        <SkeletonCards count={2} />
      ) : (
        <div className="space-y-7">
          {todos.length > 0 && (
            <Section title="Needs you" count={todos.length}>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.03]">
                {todos.map(({ key, icon: Icon, text, to, sessions: openPanel }) => {
                  const inner = (
                    <>
                      <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0 flex-1">{text}</span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
                    </>
                  );
                  const cls = "group flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-primary/[0.05]";
                  return (
                    <li key={key}>
                      {to ? (
                        <Link to={to} className={cls}>
                          {inner}
                        </Link>
                      ) : (
                        <button type="button" onClick={() => openPanel && panel.setOpen(true)} className={cls}>
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          <section aria-label="Your numbers" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat value={matches.data ? twoWay.length : undefined} label="Two-way matches" to="/discover" />
            <Stat value={active.length} label="Active swaps" to="/swaps" />
            <Stat value={me.data?.sessions_given} label="Sessions taught" onClick={() => panel.setOpen(true)} tone="teach" />
            <Stat value={me.data?.sessions_received} label="Sessions learned" onClick={() => panel.setOpen(true)} tone="learn" />
          </section>

          {next && (
            <Section title="Next session">
              <button type="button" onClick={() => panel.setOpen(true)} className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-foreground/15">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-success/10 text-success">
                  <CalendarCheck className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {next.teacher_id === user.id ? `You teach ${next.skill?.name} to ${firstName(nextOther?.full_name)}` : `${firstName(nextOther?.full_name)} teaches you ${next.skill?.name}`}
                  </span>
                  <span className="block text-[13px] text-muted-foreground">
                    {formatDateTime(next.starts_at)} · {next.duration_minutes} min
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
              </button>
            </Section>
          )}

          {active.length > 0 ? (
            <Section
              title="Your swaps"
              count={active.length}
              action={
                <Link to="/swaps" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
                  See all
                </Link>
              }
            >
              <Card as="section" className="divide-y divide-border">
                {active.slice(0, 5).map((s) => (
                  <Link key={s.id} to={`/swaps/${s.id}`} className="group flex items-center gap-3 px-3.5 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-foreground/[0.03]">
                    <Avatar name={s.other.full_name} src={s.other.avatar_url} size="sm" />
                    <span className="w-28 shrink-0 truncate text-sm font-medium sm:w-40">{displayName(s.other.full_name)}</span>
                    <SwapStrip teach={s.i_teach.name} learn={s.i_learn.name} className="hidden min-w-0 flex-1 sm:flex" />
                    <span className="ml-auto flex items-center gap-2">
                      {s.unread_count > 0 && <span className="size-2 rounded-full bg-primary" aria-label="Unread messages" />}
                      <ChevronRight className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                ))}
              </Card>
            </Section>
          ) : (swaps.data ?? []).some((s) => s.status === "proposed") ? null : (
            <Card className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                {twoWay.length ? <Sparkles className="size-[18px]" aria-hidden /> : <Compass className="size-[18px]" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px]">{twoWay.length ? `You have ${twoWay.length} two-way ${twoWay.length === 1 ? "match" : "matches"}` : "Start your first swap"}</h2>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {twoWay.length ? "Someone teaches what you want and wants what you teach." : "Browse people by skill, or post an Ask saying what you'd like to learn."}
                </p>
              </div>
              <ButtonLink to={twoWay.length ? "/discover" : "/discover?tab=explore"} className="group">
                {twoWay.length ? "See matches" : "Explore people"} <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </ButtonLink>
            </Card>
          )}
        </div>
      )}
    </Page>
  );
}
