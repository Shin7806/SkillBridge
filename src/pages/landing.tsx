import { useEffect, useState } from "react";
import { ArrowLeftRight, ArrowRight, CalendarCheck, HandCoins, MessageSquare, Search, ShieldCheck, Sparkles, ThumbsUp, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/kit";
import { PublicShell } from "@/components/public-shell";
import { useAuth } from "@/lib/auth";
import { useDocumentTitle, usePublicStats } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const PAIRS = [
  { a: "Asha", teach: "Python", b: "Rohan", learn: "Photoshop" },
  { a: "Meera", teach: "Public Speaking", b: "Dev", learn: "UI Design" },
  { a: "Kabir", teach: "Guitar", b: "Nisha", learn: "Video Editing" },
  { a: "Sara", teach: "Spanish", b: "Arjun", learn: "Excel" },
];

const SKILLS = ["Python", "Guitar", "UI Design", "Marketing", "Spanish", "Photography", "Excel", "Public Speaking", "React", "Video Editing", "Figma", "Japanese", "Data Analysis", "Singing"];

/** The page's one moving piece: an example exchange that changes every few seconds. */
function ExchangeCard() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % PAIRS.length), 3200);
    return () => clearInterval(t);
  }, []);
  const pair = PAIRS[index];

  return (
    <div className="relative mx-auto w-full max-w-md" aria-label="Example skill exchange" role="img">
      <div className="glow-primary absolute -left-24 -top-24 -z-10 size-72 rounded-full" aria-hidden />
      <div className="glow-learn absolute -bottom-24 -right-24 -z-10 size-72 rounded-full" aria-hidden />
      <div className="rounded-3xl border border-border bg-card p-5 shadow-2xl shadow-black/40">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">An example swap</p>
        <div key={index} className="animate-in fade-in slide-in-from-bottom-2 space-y-3 duration-500">
          <div className="flex items-center gap-3 rounded-2xl bg-primary/[0.09] p-4 ring-1 ring-inset ring-primary/20">
            <span className="grid size-10 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">{pair.a[0]}</span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{pair.a} teaches</p>
              <p className="truncate font-display text-xl font-bold text-primary">{pair.teach}</p>
            </div>
          </div>
          <div className="flex justify-center">
            <span className="grid size-9 place-items-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
              <ArrowLeftRight className="size-4 rotate-90" />
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-learn/[0.09] p-4 ring-1 ring-inset ring-learn/20">
            <span className="grid size-10 place-items-center rounded-full bg-learn font-semibold text-learn-foreground">{pair.b[0]}</span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{pair.b} teaches</p>
              <p className="truncate font-display text-xl font-bold text-learn">{pair.learn}</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">Nobody pays. Both learn.</p>
      </div>
    </div>
  );
}

const STEPS = [
  { icon: UserRound, title: "List your skills", text: "Say what you can teach and what you want to learn. It takes about two minutes." },
  { icon: Search, title: "Find your match", text: "See people who teach what you want and want what you teach, with the exact skills shown." },
  { icon: ArrowLeftRight, title: "Swap", text: "Propose a swap, chat once it's accepted, and book sessions you both confirm." },
];

const FEATURES = [
  { icon: Sparkles, title: "Real two-way matching", text: "Matches come from your actual skill lists. Two-way fits come first, one-way fits are labelled." },
  { icon: ArrowLeftRight, title: "Swap agreements", text: "One clear agreement per person: what you teach, what you learn, how often." },
  { icon: MessageSquare, title: "Private chat", text: "Chat opens only after a swap is accepted, and only the two of you can read it." },
  { icon: CalendarCheck, title: "Sessions you both confirm", text: "Suggest a time, the other person confirms, each sees it in their own timezone." },
  { icon: ThumbsUp, title: "Vouches, not star ratings", text: "After a session the learner can vouch for the teacher. It shows on their profile." },
  { icon: ShieldCheck, title: "Private by default", text: "Your email is never shown. Hide your profile, block or report anyone, delete your account any time." },
];

function Stats() {
  const stats = usePublicStats();
  if (!stats.data || stats.data.members === 0) return null;
  const items = [
    { value: stats.data.members, label: stats.data.members === 1 ? "member" : "members" },
    { value: stats.data.skills, label: "skills being shared" },
    { value: stats.data.swaps, label: stats.data.swaps === 1 ? "swap agreed" : "swaps agreed" },
  ].filter((i) => i.value > 0);
  return (
    <dl className="mx-auto mt-14 flex max-w-2xl flex-wrap justify-center gap-x-12 gap-y-6 text-center">
      {items.map((i) => (
        <div key={i.label}>
          <dd className="font-display text-4xl font-bold tabular-nums">{i.value.toLocaleString()}</dd>
          <dt className="mt-1 text-sm text-muted-foreground">{i.label}</dt>
        </div>
      ))}
    </dl>
  );
}

export default function Landing() {
  useDocumentTitle("");
  const { user } = useAuth();
  const cta = user ? { to: "/home", label: "Open SkillBridge" } : { to: "/signup", label: "Start for free" };

  return (
    <PublicShell>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:pb-24">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-raised px-3 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-border">
            <HandCoins className="size-3.5 text-primary" aria-hidden /> Peer-to-peer skill exchange · no money involved
          </p>
          <h1 className="text-[2.75rem] font-extrabold leading-[1.02] sm:text-6xl xl:text-7xl">
            Teach what you know.
            <span className="mt-1 block font-serif text-[1.08em] font-normal italic tracking-normal text-primary">Learn what you don't.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            SkillBridge pairs you with someone who teaches the skill you want and wants a skill you have. You trade lessons, not money.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to={cta.to} size="lg">
              {cta.label} <ArrowRight />
            </ButtonLink>
            {!user && (
              <ButtonLink to="/login" size="lg" variant="secondary">
                Log in
              </ButtonLink>
            )}
          </div>
        </div>
        <ExchangeCard />
      </section>

      <div className="overflow-hidden border-y border-border py-4" aria-hidden>
        <div className="flex w-max animate-marquee gap-3 motion-reduce:animate-none">
          {[...SKILLS, ...SKILLS].map((s, i) => (
            <span key={i} className={cn("rounded-full px-4 py-1.5 text-sm ring-1 ring-inset", i % 2 ? "bg-learn/[0.07] text-learn ring-learn/20" : "bg-primary/[0.07] text-primary ring-primary/20")}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="how">
        <h2 id="how" className="text-center text-3xl font-bold sm:text-4xl">
          How it works
        </h2>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="font-display text-4xl font-bold text-border" aria-hidden>
                  {i + 1}
                </span>
              </div>
              <h3 className="font-sans text-lg font-semibold tracking-normal">{title}</h3>
              <p className="mt-2 text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
        <Stats />
      </section>

      <section className="border-t border-border bg-card/40" aria-labelledby="features">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h2 id="features" className="max-w-xl text-3xl font-bold sm:text-4xl">
            Everything a swap needs, and nothing it doesn't
          </h2>
          <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <Icon className="mb-3 size-5 text-primary" aria-hidden />
                <h3 className="font-sans text-base font-semibold tracking-normal">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.12] via-card to-learn/[0.08] px-6 py-14 text-center sm:px-12">
          <h2 className="mx-auto max-w-xl text-3xl font-bold sm:text-4xl">Everyone has something to teach, and something to learn</h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">Free to join and free to use. Skills are the only currency.</p>
          <ButtonLink to={cta.to} size="lg" className="mt-8">
            {user ? cta.label : "Create your account"} <ArrowRight />
          </ButtonLink>
        </div>
      </section>
    </PublicShell>
  );
}
