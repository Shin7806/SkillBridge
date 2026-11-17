import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, LazyMotion, MotionConfig, domMax, m, useInView } from "motion/react";
import NumberFlow from "@number-flow/react";
import * as Accordion from "@radix-ui/react-accordion";
import { ArrowRight, BadgeCheck, Check, ChevronDown, EyeOff, Lock, Mail, ShieldCheck, Trash2, type LucideIcon } from "lucide-react";
import { ButtonLink } from "@/components/kit";
import { PublicShell } from "@/components/public-shell";
import { DemoPlayer, type DemoStep } from "@/components/landing/demo-player";
import { ChatScene, chatSteps, MatchScene, matchSteps, ProposeScene, proposeSteps, ScheduleScene, scheduleSteps } from "@/components/landing/scenes";
import { useAuth } from "@/lib/auth";
import { useDocumentTitle, usePublicStats } from "@/lib/hooks";
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
function LiveNumbers() {
  const stats = usePublicStats();
  const ref = useRef<HTMLParagraphElement>(null);
  const seen = useInView(ref, { once: true });
  const d = stats.data;
  return (
    <p ref={ref} className="flex min-h-5 items-center justify-center gap-2 text-[13px] text-muted-foreground">
      {d && d.members > 0 && (
        <>
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-1.5 rounded-full bg-success" />
          </span>
          <span>
            <NumberFlow value={seen ? d.members : 0} className="font-medium tabular-nums text-foreground" /> members sharing <NumberFlow value={seen ? d.skills : 0} className="font-medium tabular-nums text-foreground" /> skills
          </span>
        </>
      )}
    </p>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-[560px] opacity-50 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_55%_60%_at_50%_20%,black,transparent)]"
        aria-hidden
      />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pb-28 sm:pt-24">
        <m.p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[12px] text-muted-foreground" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
          Free peer-to-peer skill exchange
        </m.p>
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
        <m.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.35 }}>
          <LiveNumbers />
        </m.div>
      </div>
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

function Safety() {
  return (
    <section id="safety" className="scroll-mt-16 border-t border-border bg-card/30">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <Heading eyebrow="Safety and privacy" title="You're meeting strangers. It should feel safe." />
        <ul className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {SAFETY.map(({ icon: Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={(i % 3) * 0.05} className="group bg-background p-5 transition-colors duration-200 hover:bg-card">
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

function FinalCta() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <Reveal>
          <p className="font-serif text-2xl italic text-primary">Everyone has something to teach.</p>
          <h2 className="mt-2 text-3xl leading-tight tracking-[-0.035em] sm:text-4xl">Your first swap is one good match away.</h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">Free to join. Two minutes to set up.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <PrimaryCta label="Create your account" />
            <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Check className="size-3.5 text-learn" aria-hidden /> No card. No credits. No ads.
            </span>
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
