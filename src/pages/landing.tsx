import { useEffect, useState, type PointerEvent, type ReactNode } from "react";
import { AnimatePresence, LazyMotion, MotionConfig, domMax, m } from "motion/react";
import * as Accordion from "@radix-ui/react-accordion";
import { ArrowLeftRight, ArrowRight, BadgeCheck, Check, ChevronDown, EyeOff, Lock, Mail, ShieldCheck, Trash2, type LucideIcon } from "lucide-react";
import { ButtonLink } from "@/components/kit";
import { PublicShell } from "@/components/public-shell";
import { DemoPlayer, type DemoStep } from "@/components/landing/demo-player";
import { BraidedStrings, SkillMarquee } from "@/components/landing/strings";
import { ChatScene, chatSteps, MatchScene, matchSteps, ProposeScene, proposeSteps, ScheduleScene, scheduleSteps } from "@/components/landing/scenes";
import { useAuth } from "@/lib/auth";
import { useDocumentTitle } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

function Reveal({ children, className, delay = 0, as = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "li" }) {
  const Tag = as === "li" ? m.li : m.div;
  return (
    <Tag className={className} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -10% 0px" }} transition={{ duration: 0.55, ease, delay }}>
      {children}
    </Tag>
  );
}

function Heading({ eyebrow, title, children, center }: { eyebrow: string; title: ReactNode; children?: ReactNode; center?: boolean }) {
  return (
    <Reveal className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <p className="mb-3 text-[13px] font-medium text-primary">{eyebrow}</p>
      <h2 className="text-3xl leading-[1.1] tracking-[-0.035em] sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 text-[17px] leading-relaxed text-muted-foreground">{children}</p>}
    </Reveal>
  );
}

function PrimaryCta({ label }: { label?: string }) {
  const { user } = useAuth();
  return (
    <ButtonLink to={user ? "/home" : "/signup"} size="lg" className="group">
      {user ? "Open SkillBridge" : (label ?? "Get started free")}
      <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
    </ButtonLink>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function LivePill() {
  const { user } = useAuth();
  return (
    <a
      href={user ? "/home" : "/signup"}
      className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-card/60 py-1 pl-2 pr-3 text-[13px] text-muted-foreground backdrop-blur transition-[border-color,color,background-color] duration-200 hover:border-learn/40 hover:bg-card hover:text-foreground"
    >
      <span className="flex -space-x-1.5" aria-hidden>
        {["bg-primary", "bg-learn", "bg-foreground/70"].map((c, i) => (
          <span key={c} className={cn("size-4 rounded-full ring-2 ring-background", c)} style={{ opacity: 1 - i * 0.2 }} />
        ))}
      </span>
      <span className="relative flex size-1.5" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-1.5 rounded-full bg-success" />
      </span>
      <span>
        People are swapping skills right now. <span className="font-medium text-foreground">Join in</span>
      </span>
      <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
    </a>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-[560px] opacity-50 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_55%_60%_at_50%_20%,black,transparent)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-[min(56rem,100%)] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_14%,transparent),transparent),radial-gradient(closest-side_at_70%_60%,color-mix(in_oklab,var(--learn)_10%,transparent),transparent)] blur-2xl" aria-hidden />
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-14 text-center sm:px-6 sm:pb-14 sm:pt-24">
        <m.div className="mb-7" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
          <LivePill />
        </m.div>
        <m.h1 className="text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-[4.25rem]" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.05 }}>
          Teach what you know.
          <span className="mt-1 block font-serif text-[1.1em] font-normal italic tracking-[-0.01em] text-primary">Learn what you don't.</span>
        </m.h1>
        <m.p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.12 }}>
          SkillBridge finds people who teach the skill you want and want a skill you have. You swap lessons. Nobody pays.
        </m.p>
        <m.div className="mt-8 flex flex-wrap items-center justify-center gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.18 }}>
          <PrimaryCta />
          <a href="#how" className="inline-flex h-11 items-center rounded-lg px-4 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground">
            How it works
          </a>
        </m.div>
        <m.p className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
          {["Free forever", "No credits", "Two-way matching"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-learn" aria-hidden /> {t}
            </span>
          ))}
        </m.p>
      </div>
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.45 }}>
        <BraidedStrings className="-mt-6 sm:-mt-10" />
        <SkillMarquee className="mx-auto mt-4 max-w-5xl px-4 pb-16 sm:mt-6 sm:pb-24" />
      </m.div>
    </section>
  );
}

// ── How it works: four steps, each with its own short demo ────────────────────
interface Chapter {
  title: string;
  text: string;
  label: string;
  description: string;
  path: string;
  steps: DemoStep[];
  render: (step: number) => ReactNode;
}

const CHAPTERS: Chapter[] = [
  {
    title: "Get matched",
    text: "List what you can teach and what you want to learn. SkillBridge shows people who fit both ways first, with the exact skills.",
    label: "Matching demo",
    description: "Asha teaches Python and wants Photoshop. Rohan teaches Photoshop and wants Python, so he is ranked first as a two-way match, with the exact skills shown.",
    path: "skillbridge · discover",
    steps: matchSteps,
    render: (s) => <MatchScene step={s} />,
  },
  {
    title: "Propose a swap",
    text: "Pick one skill each way, add a short note, send. They accept or decline.",
    label: "Proposal demo",
    description: "Asha proposes Python in exchange for Photoshop with a short note, sends it, and Rohan accepts.",
    path: "skillbridge · people / rohan",
    steps: proposeSteps,
    render: (s) => <ProposeScene step={s} />,
  },
  {
    title: "Chat once they say yes",
    text: "Every accepted swap gets a private conversation in Messages. Nobody can message you before that.",
    label: "Chat demo",
    description: "The chat is locked while the proposal is pending. Rohan accepts, it unlocks, and they agree to start on Saturday.",
    path: "skillbridge · messages",
    steps: chatSteps,
    render: (s) => <ChatScene step={s} />,
  },
  {
    title: "Book sessions together",
    text: "Suggest a time, the other person confirms. Each of you sees it in your own timezone.",
    label: "Scheduling demo",
    description: "Asha in Bengaluru suggests Saturday at 7 PM. Rohan in London sees 1:30 PM, confirms, and it is added to the calendar.",
    path: "skillbridge · sessions",
    steps: scheduleSteps,
    render: (s) => <ScheduleScene step={s} />,
  },
];

function HowItWorks() {
  const [active, setActive] = useState(0);
  const chapter = CHAPTERS[active];

  return (
    <section id="how" className="scroll-mt-16 border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Heading eyebrow="How it works" title="Four steps. That's the whole thing." />
        <div className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <ol className="space-y-1" aria-label="Steps">
            {CHAPTERS.map((c, i) => {
              const on = i === active;
              return (
                <li key={c.title}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={on ? "step" : undefined}
                    className={cn("group relative w-full rounded-xl px-4 py-3.5 text-left transition-colors duration-200", on ? "bg-card ring-1 ring-border" : "hover:bg-card/60")}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold tabular-nums transition-colors duration-200", on ? "bg-primary text-primary-foreground" : "bg-raised text-muted-foreground ring-1 ring-border group-hover:text-foreground")}>{i + 1}</span>
                      <span className={cn("text-[15px] font-medium transition-colors", on ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>{c.title}</span>
                    </span>
                    <AnimatePresence initial={false}>
                      {on && (
                        <m.span className="block overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }}>
                          <span className="block pl-9 pt-1.5 text-[14px] leading-relaxed text-muted-foreground">{c.text}</span>
                        </m.span>
                      )}
                    </AnimatePresence>
                  </button>
                </li>
              );
            })}
            <li className="px-4 pt-4">
              <PrimaryCta label="Start your first swap" />
            </li>
          </ol>
          <Reveal>
            <AnimatePresence mode="wait" initial={false}>
              <m.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease }}>
                <DemoPlayer label={chapter.label} description={chapter.description} steps={chapter.steps} path={chapter.path} onEnd={() => setActive((a) => (a + 1) % CHAPTERS.length)}>
                  {chapter.render}
                </DemoPlayer>
              </m.div>
            </AnimatePresence>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Safety ────────────────────────────────────────────────────────────────────
const SAFETY: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Mail, title: "Email never shown", text: "Members see your name and skills, never your address." },
  { icon: Lock, title: "Chat only after a yes", text: "Nobody can message you until you accept their swap." },
  { icon: EyeOff, title: "Hide when you like", text: "Leave Discover any time. Swap partners still see you." },
  { icon: ShieldCheck, title: "Block and report", text: "Blocking ends the swap and keeps them away." },
  { icon: BadgeCheck, title: "Enforced by the database", text: "Who can read what is checked by Postgres, not just the app." },
  { icon: Trash2, title: "Delete everything", text: "One button removes your account and what you added." },
];

/** Feeds the pointer position to each card so its spotlight follows the cursor. */
function trackSpotlight(e: PointerEvent<HTMLElement>) {
  const els = [e.currentTarget, ...e.currentTarget.querySelectorAll<HTMLElement>(".spotlight")];
  for (const el of els) {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
}

function Safety() {
  return (
    <section id="safety" className="scroll-mt-16 border-t border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Heading eyebrow="Safety and privacy" title="You're meeting strangers. It should feel safe." />
        <ul onPointerMove={trackSpotlight} className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {SAFETY.map(({ icon: Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={(i % 3) * 0.05} className="spotlight group relative bg-background p-5 transition-colors duration-200 hover:bg-card">
              <Icon className="size-[18px] text-learn transition-transform duration-200 group-hover:-translate-y-0.5" aria-hidden />
              <h3 className="mt-3 text-[15px]">{title}</h3>
              <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS: { q: string; a: string }[] = [
  { q: "Is it really free?", a: "Yes. There's nothing to buy, no subscription and no credits. You can't pay another member through SkillBridge." },
  { q: "How does matching work?", a: "A two-way match teaches something on your learn list and wants something on your teach list. One-way matches fit in one direction and are labelled, so you can still propose a swap." },
  { q: "What if nobody matches me yet?", a: "Add more skills, browse everyone by skill in Explore, or post an Ask. New members are matched to you as they join." },
  { q: "How do sessions happen?", a: "Over any video call you like. Either person suggests a time and the other confirms. You add your own Google Meet or Zoom link." },
  { q: "Who can see my profile?", a: "Signed-in members, unless you hide it from Discover in Settings. Your email address is never shown." },
  { q: "Can I delete my account?", a: "Yes, from Settings. It permanently removes your profile, skills, swaps, messages and sessions." },
];

function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Heading eyebrow="FAQ" title="Questions people ask" />
          <Reveal className="mt-4">
            <p className="text-[15px] text-muted-foreground">
              More in the{" "}
              <a href="/help" className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground">
                help centre
              </a>
              .
            </p>
          </Reveal>
        </div>
        <Reveal>
          <Accordion.Root type="single" collapsible className="divide-y divide-border border-y border-border">
            {FAQS.map(({ q, a }) => (
              <Accordion.Item key={q} value={q}>
                <Accordion.Header asChild>
                  <h3>
                    <Accordion.Trigger className="group flex min-h-14 w-full items-center justify-between gap-6 py-3 text-left text-[15px] font-medium tracking-normal transition-colors hover:text-foreground/80">
                      {q}
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" aria-hidden />
                    </Accordion.Trigger>
                  </h3>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <p className="max-w-prose pb-4 pr-10 text-[14px] leading-relaxed text-muted-foreground">{a}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </Reveal>
      </div>
    </section>
  );
}

const PAIRS: [string, string][] = [
  ["Python", "Photoshop"],
  ["Guitar", "Spanish"],
  ["Figma", "Cooking"],
  ["SQL", "Public speaking"],
  ["Photography", "Piano"],
];

/** A tiny swap card that keeps trading one pair of skills for the next. */
function SwapTicker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % PAIRS.length), 2600);
    return () => clearInterval(id);
  }, []);
  const [teach, learn] = PAIRS[i];
  const chip = "inline-flex h-9 min-w-[7.5rem] items-center justify-center rounded-lg px-3 text-[14px] font-medium ring-1 ring-inset";
  return (
    <div className="flex items-center justify-center gap-3" aria-hidden>
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span key={`t-${teach}`} className={cn(chip, "bg-primary/10 text-primary ring-primary/25")} initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(4px)" }} transition={{ duration: 0.45, ease }}>
          {teach}
        </m.span>
      </AnimatePresence>
      <m.span key={`x-${i}`} className="grid size-8 place-items-center rounded-full bg-background ring-1 ring-border" initial={{ rotate: -180 }} animate={{ rotate: 0 }} transition={{ duration: 0.6, ease }}>
        <ArrowLeftRight className="size-3.5 text-muted-foreground" />
      </m.span>
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span key={`l-${learn}`} className={cn(chip, "bg-learn/10 text-learn ring-learn/25")} initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(4px)" }} transition={{ duration: 0.45, ease, delay: 0.08 }}>
          {learn}
        </m.span>
      </AnimatePresence>
    </div>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
        <Reveal>
          <div onPointerMove={trackSpotlight} className="spotlight-card group relative rounded-3xl border border-border bg-card transition-colors duration-300 hover:border-foreground/15">
            <div className="relative isolate overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12 sm:py-20">
              <SwapTicker />
              <h2 className="mx-auto mt-8 max-w-xl text-3xl leading-tight tracking-[-0.035em] sm:text-5xl">
                Your first swap is <span className="font-serif font-normal italic text-primary">one good match</span> away.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[16px] text-muted-foreground">Add one skill you know and one you want. We'll find the people who fit.</p>
              <div className="mt-8 flex flex-col items-center gap-3">
                <PrimaryCta label="Create your free account" />
                <span className="text-[13px] text-muted-foreground">Free forever · No card · No ads</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Landing() {
  useDocumentTitle("");
  // Arriving from another page at /#section: scroll once this lazily loaded page has rendered.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  }, []);

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <PublicShell>
          <Hero />
          <HowItWorks />
          <Safety />
          <Faq />
          <FinalCta />
        </PublicShell>
      </MotionConfig>
    </LazyMotion>
  );
}
