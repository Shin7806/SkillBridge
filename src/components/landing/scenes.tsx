// Product demos for the landing page. Each scene is a pure function of the current step,
// drawn on the 560×400 canvas from demo-player.tsx.
import type { ReactNode } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowLeftRight, CalendarCheck, CalendarPlus, Check, Lock, LockOpen, SendHorizontal, Sparkles } from "lucide-react";
import { Chip, Cursor, DemoToast, Face, enter, spring, useTypewriter, type DemoStep } from "./demo-player";
import { cn } from "@/lib/utils";

const card = "rounded-xl border border-border bg-card";
const label = "text-[10px] font-semibold uppercase tracking-[0.08em]";

function Btn({ children, tone = "primary", pressAt, className }: { children: ReactNode; tone?: "primary" | "secondary" | "learn" | "danger"; pressAt?: number; className?: string }) {
  const tones = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-raised text-foreground ring-1 ring-inset ring-border",
    learn: "bg-learn text-learn-foreground",
    danger: "bg-destructive/15 text-destructive",
  };
  return (
    <m.span
      className={cn("inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[12px] font-semibold", tones[tone], className)}
      animate={pressAt !== undefined ? { scale: [1, 0.92, 1] } : { scale: 1 }}
      transition={pressAt !== undefined ? { delay: pressAt, duration: 0.28 } : { duration: 0.1 }}
    >
      {children}
    </m.span>
  );
}

function MiniStrip({ teach, learn, teachLabel = "You teach", learnLabel = "You learn", className }: { teach: string; learn: string; teachLabel?: string; learnLabel?: string; className?: string }) {
  return (
    <div className={cn("relative grid grid-cols-2 overflow-hidden rounded-lg ring-1 ring-inset ring-border", className)}>
      <div className="bg-primary/[0.09] py-2 pl-3 pr-5">
        <p className={cn(label, "text-primary/75")}>{teachLabel}</p>
        <p className="truncate text-[13px] font-semibold text-primary">{teach}</p>
      </div>
      <div className="bg-learn/[0.09] py-2 pl-5 pr-3 text-right">
        <p className={cn(label, "text-learn/75")}>{learnLabel}</p>
        <p className="truncate text-[13px] font-semibold text-learn">{learn}</p>
      </div>
      <span className="absolute left-1/2 top-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
        <ArrowLeftRight className="size-3" />
      </span>
    </div>
  );
}

function Caret() {
  return <m.span className="ml-px inline-block h-3.5 w-px translate-y-0.5 bg-foreground" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />;
}

// ── 1. Matching ─────────────────────────────────────────────────────────────────

export const matchSteps: DemoStep[] = [
  { caption: "You teach Python and want to learn Photoshop.", ms: 1900 },
  { caption: "SkillBridge reads everyone's teach and learn lists.", ms: 1900 },
  { caption: "Rohan teaches Photoshop and wants Python. That fits both ways.", ms: 2300 },
  { caption: "Two-way matches rise to the top. One-way fits are labelled, the rest drop away.", ms: 2300 },
  { caption: "You see exactly what each of you would teach before you ask.", ms: 2800 },
];

interface Candidate {
  id: string;
  name: string;
  tone: "teal" | "rose" | "sky";
  teaches: string;
  wants: string;
}
const CANDIDATES: Candidate[] = [
  { id: "meera", name: "Meera", tone: "rose", teaches: "Photoshop", wants: "Excel" },
  { id: "rohan", name: "Rohan", tone: "teal", teaches: "Photoshop", wants: "Python" },
  { id: "kabir", name: "Kabir", tone: "sky", teaches: "Guitar", wants: "Spanish" },
];

export function MatchScene({ step }: { step: number }) {
  const ranked = step >= 3;
  const list = ranked ? [CANDIDATES[1], CANDIDATES[0]] : CANDIDATES;

  return (
    <div className="absolute inset-0">
      <p className="absolute left-5 top-4 text-[12px] font-semibold text-muted-foreground">
        Discover <span className="text-foreground/30">/</span> <span className="text-foreground">Matches</span>
      </p>

      {/* You */}
      <m.div className={cn(card, "absolute left-5 top-[52px] h-[172px] w-[200px] ring-2 ring-primary/30")} {...enter}>
        <div className="absolute left-3.5 top-3.5 flex items-center gap-2.5">
          <Face name="Asha" tone="you" size={30} />
          <div>
            <p className="text-[13px] font-semibold leading-tight">You</p>
            <p className="text-[11px] text-muted-foreground">Asha · CS student</p>
          </div>
        </div>
        <p className={cn(label, "absolute left-3.5 top-[62px] text-primary/80")}>Teaches</p>
        <div className="absolute left-3.5 top-[78px]">
          <Chip tone="teach" glow={step === 2}>
            Python
          </Chip>
        </div>
        <p className={cn(label, "absolute left-3.5 top-[112px] text-learn/80")}>Wants to learn</p>
        <div className="absolute left-3.5 top-[128px]">
          <Chip tone="learn" glow={step === 2}>
            Photoshop
          </Chip>
        </div>
      </m.div>

      {/* Scanning sweep */}
      <AnimatePresence>
        {step === 1 && (
          <m.div
            className="absolute left-[296px] h-10 w-[248px] rounded-lg bg-gradient-to-b from-transparent via-primary/15 to-transparent"
            initial={{ top: 40, opacity: 0 }}
            animate={{ top: [40, 300, 40], opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>

      {/* Connector lines: Python → Rohan wants, Photoshop ← Rohan teaches */}
      <svg className="pointer-events-none absolute inset-0" width={560} height={400} fill="none">
        <AnimatePresence>
          {step === 2 && (
            <>
              <m.path d="M220 142 C 262 142, 262 239, 300 239" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: "easeInOut" }} />
              <m.path d="M220 192 C 262 192, 262 215, 300 215" stroke="var(--learn)" strokeWidth={2} strokeLinecap="round" initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, delay: 0.25, ease: "easeInOut" }} />
            </>
          )}
        </AnimatePresence>
      </svg>

      {/* Candidates */}
      <div className="absolute left-[300px] top-[52px] flex w-[240px] flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {step >= 1 &&
            list.map((c, i) => {
              const highlight = step === 2 && c.id === "rohan";
              const dim = step === 2 && c.id !== "rohan";
              const badge = ranked ? (c.id === "rohan" ? "Two-way" : "Can teach you") : null;
              return (
                <m.div
                  key={c.id}
                  layout
                  className={cn(card, "relative h-[92px] transition-[border-color,opacity] duration-300", highlight && "border-learn/60", dim && "opacity-40")}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: dim ? 0.4 : 1, x: 0 }}
                  exit={{ opacity: 0, x: 30, transition: { duration: 0.3 } }}
                  transition={{ ...spring, delay: step === 1 ? i * 0.12 : 0 }}
                >
                  <div className="absolute left-3 top-2.5 flex items-center gap-2">
                    <Face name={c.name} tone={c.tone} size={24} />
                    <span className="text-[13px] font-semibold">{c.name}</span>
                  </div>
                  <AnimatePresence>
                    {badge && (
                      <m.span
                        className={cn("absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10.5px] font-semibold", badge === "Two-way" ? "bg-primary text-primary-foreground" : "bg-learn/15 text-learn")}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...spring, delay: 0.35 }}
                      >
                        {badge === "Two-way" && <Sparkles className="mr-1 inline size-2.5 -translate-y-px" />}
                        {badge}
                      </m.span>
                    )}
                  </AnimatePresence>
                  <p className="absolute left-3 top-[46px] flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="w-[42px]">Teaches</span>
                    <Chip tone={c.teaches === "Photoshop" ? "learn" : "neutral"} glow={highlight} className="h-5 text-[10.5px]">
                      {c.teaches}
                    </Chip>
                  </p>
                  <p className="absolute left-3 top-[69px] flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="w-[42px]">Wants</span>
                    <Chip tone={c.wants === "Python" ? "teach" : "neutral"} glow={highlight} className="h-5 text-[10.5px]">
                      {c.wants}
                    </Chip>
                  </p>
                </m.div>
              );
            })}
        </AnimatePresence>
      </div>

      {/* Result */}
      <AnimatePresence>
        {step >= 4 && (
          <m.div className={cn(card, "absolute left-5 top-[268px] flex h-[108px] w-[520px] flex-col justify-center gap-3 px-4")} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <div className="flex items-center justify-between">
              <p className="text-[12.5px] text-muted-foreground">
                <span className="font-semibold text-foreground">You and Rohan</span> are a two-way match
              </p>
              <m.span animate={{ scale: [1, 1.06, 1] }} transition={{ delay: 0.8, duration: 1.2, repeat: Infinity, repeatDelay: 0.6 }}>
                <Btn>Propose a swap</Btn>
              </m.span>
            </div>
            <MiniStrip teach="Python" learn="Photoshop" />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 2. Proposing a swap ─────────────────────────────────────────────────────────

export const proposeSteps: DemoStep[] = [
  { caption: "Open someone's profile and choose Propose a swap.", ms: 1700 },
  { caption: "Pick one skill each way. The overlap is filled in for you.", ms: 1900 },
  { caption: "Add a short note so they know why you're asking.", ms: 2800 },
  { caption: "Send it. Chat stays closed until they say yes.", ms: 2700 },
  { caption: "Rohan sees your proposal and accepts. The swap is on.", ms: 2900 },
];

function Field({ title, value, active, delay = 0, className }: { title: string; value: string; active?: boolean; delay?: number; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-1 text-[11px] font-medium">{title}</p>
      <m.div
        className="flex h-9 items-center justify-between rounded-lg border bg-background px-2.5 text-[12px]"
        initial={false}
        animate={{ borderColor: active ? "var(--primary)" : "var(--input)", boxShadow: active ? "0 0 0 3px rgb(245 179 1 / 0.2)" : "0 0 0 0px rgb(0 0 0 / 0)" }}
        transition={{ delay, duration: 0.25 }}
      >
        <span className="truncate">{value}</span>
        <span className="text-muted-foreground">▾</span>
      </m.div>
    </div>
  );
}

export function ProposeScene({ step }: { step: number }) {
  const message = useTypewriter("Hi Rohan! I can teach you Python if you'll show me Photoshop.", step === 2, step > 2);
  const cursor = [
    { x: 470, y: 72, clickAt: 1.1 },
    { x: 180, y: 140 },
    { x: 300, y: 262 },
    { x: 404, y: 328, clickAt: 1.0 },
    { x: 428, y: 282, clickAt: 1.0 },
  ][step];

  return (
    <div className="absolute inset-0">
      {step < 4 ? (
        <>
          {/* Profile behind the dialog */}
          <div className={cn(card, "absolute left-5 top-5 h-[124px] w-[520px] p-4")}>
            <div className="flex items-start gap-3">
              <Face name="Rohan" tone="teal" size={44} />
              <div className="flex-1">
                <p className="text-[15px] font-semibold">Rohan Mehta</p>
                <p className="text-[11.5px] text-muted-foreground">Design student · Pune</p>
                <div className="mt-2.5 flex gap-1.5">
                  <Chip tone="teach">Photoshop</Chip>
                  <Chip tone="teach">Figma</Chip>
                  <Chip tone="learn">Python</Chip>
                </div>
              </div>
              <Btn pressAt={step === 0 ? 1.1 : undefined} className="mt-2">
                Propose a swap
              </Btn>
            </div>
          </div>
          <div className="absolute left-5 top-[160px] w-[520px] space-y-2.5 px-1">
            {[92, 80, 64, 86].map((w, i) => (
              <div key={i} className="h-2.5 rounded-full bg-raised" style={{ width: `${w}%` }} />
            ))}
          </div>

          {/* Dialog */}
          <AnimatePresence>
            {step >= 1 && (
              <>
                <m.div className="absolute inset-0 bg-black/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                <m.div
                  className={cn(card, "absolute left-[90px] top-[16px] flex w-[380px] flex-col bg-popover p-5 shadow-2xl")}
                  initial={{ opacity: 0, scale: 0.94, y: 10 }}
                  animate={{ opacity: step === 3 ? [1, 1, 0] : 1, scale: 1, y: 0 }}
                  transition={step === 3 ? { duration: 1.7, times: [0, 0.8, 1] } : spring}
                >
                  <p className="text-[16px] font-semibold tracking-tight">Propose a swap with Rohan</p>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">One skill each way. Chat opens once they accept.</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Field title="You teach" value="Python  (they want this)" active={step === 1} />
                    <Field title="Rohan teaches" value="Adobe Photoshop" active={step === 1} delay={0.5} />
                  </div>
                  <Field title="Rhythm" value="Weekly, 45 minutes each" className="mt-3" active={step === 1} delay={1} />
                  <p className="mb-1 mt-3 text-[11px] font-medium">Message</p>
                  <div className={cn("h-[52px] rounded-lg border bg-background px-2.5 py-2 text-[12px] leading-snug", step === 2 ? "border-primary" : "border-input")}>
                    {message}
                    {step === 2 && <Caret />}
                  </div>
                  <div className="mt-3.5 flex justify-end gap-2 border-t border-border pt-3">
                    <Btn tone="secondary">Cancel</Btn>
                    <Btn pressAt={step === 3 ? 1.0 : undefined}>Send proposal</Btn>
                  </div>
                </m.div>
              </>
            )}
          </AnimatePresence>
          <DemoToast show={step === 3} delay={1.35}>
            <m.span className="grid size-5 place-items-center rounded-full bg-success/20 text-success" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.55, ...spring }}>
              <Check className="size-3" />
            </m.span>
            Proposal sent to Rohan
          </DemoToast>
        </>
      ) : (
        <m.div className="absolute inset-0" {...enter}>
          <p className="absolute left-5 top-4 flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
            <Face name="Rohan" tone="teal" size={18} /> Rohan's Swaps <span className="text-foreground/30">/</span> <span className="text-foreground">Waiting for your answer</span>
          </p>
          <div className={cn(card, "absolute left-[70px] top-[56px] h-[260px] w-[420px] p-5")}>
            <div className="flex items-center gap-3">
              <Face name="Asha" tone="you" size={34} />
              <div>
                <p className="text-[13px] font-semibold">Asha</p>
                <p className="text-[11px] text-muted-foreground">Proposed just now</p>
              </div>
            </div>
            <MiniStrip teach="Adobe Photoshop" learn="Python" className="mt-4" />
            <p className="mt-3 border-l-2 border-border pl-3 text-[12px] text-muted-foreground">Hi Rohan! I can teach you Python if you'll show me Photoshop.</p>
            <div className="absolute bottom-5 right-5 flex items-center gap-2">
              <m.span initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 1.3, duration: 0.2 }}>
                <Btn tone="secondary">Decline</Btn>
              </m.span>
              <m.span className="relative" initial={false}>
                <m.span animate={{ opacity: 0 }} transition={{ delay: 1.3, duration: 0.2 }} className="inline-block">
                  <Btn pressAt={1.0}>Accept swap</Btn>
                </m.span>
                <m.span className="absolute inset-0 inline-flex items-center justify-center gap-1 rounded-lg bg-success/15 text-[12px] font-semibold text-success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.35, ...spring }}>
                  <Check className="size-3.5" /> Active
                </m.span>
              </m.span>
            </div>
          </div>
        </m.div>
      )}
      <Cursor x={cursor.x} y={cursor.y} clickAt={cursor.clickAt} />
    </div>
  );
}

// ── 3. Chat that opens on acceptance ────────────────────────────────────────────

export const chatSteps: DemoStep[] = [
  { caption: "Before a proposal is accepted, there is no chat. Nobody can message you out of the blue.", ms: 2100 },
  { caption: "Rohan accepts. The swap gets its own private chat.", ms: 1500 },
  { caption: "Messages arrive live for both of you.", ms: 1700 },
  { caption: "Agree how you want to work…", ms: 2300 },
  { caption: "…then plan the first session. It shows up in your Sessions panel.", ms: 2600 },
];

function Bubble({ mine, children, delay = 0 }: { mine?: boolean; children: ReactNode; delay?: number }) {
  return (
    <m.div className={cn("flex", mine ? "justify-end" : "justify-start")} initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ ...spring, delay }}>
      <p className={cn("max-w-[80%] rounded-2xl px-3 py-1.5 text-[12px] leading-snug", mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-raised")}>{children}</p>
    </m.div>
  );
}

export function ChatScene({ step }: { step: number }) {
  const unlocked = step >= 1;
  const draft = useTypewriter("Yes! Python basics first, then your turn.", step === 3, false, 300, 30);

  return (
    <div className="absolute inset-0 flex">
      {/* Conversation list */}
      <div className="w-[150px] shrink-0 border-r border-border p-2.5">
        <p className="mb-2 px-1 text-[13px] font-semibold">Messages</p>
        {[
          { name: "Rohan", tone: "teal" as const, line: unlocked ? "Free on Saturday?" : "Proposal sent", active: true },
          { name: "Meera", tone: "rose" as const, line: "Thanks for today!" },
          { name: "Kabir", tone: "sky" as const, line: "See you Friday" },
        ].map((c) => (
          <div key={c.name} className={cn("mb-0.5 flex items-center gap-2 rounded-md px-1.5 py-1.5", c.active && "bg-foreground/[0.07]")}>
            <Face name={c.name} tone={c.tone} size={22} />
            <span className="min-w-0">
              <span className="block text-[11.5px] font-medium">{c.name}</span>
              <span className="block truncate text-[10px] text-muted-foreground">{c.line}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-2.5">
        <Face name="Rohan" tone="teal" size={26} />
        <div className="flex-1">
          <p className="text-[12.5px] font-semibold">Rohan Mehta</p>
          <p className="text-[10.5px] text-muted-foreground">{unlocked ? "Active swap" : "Waiting for an answer"}</p>
        </div>
        <span className="inline-flex h-6 items-center gap-1 rounded-md bg-raised px-2 text-[10.5px] font-medium ring-1 ring-inset ring-border">
          <ArrowLeftRight className="size-3" /> View swap
        </span>
      </div>

      <div className="relative flex-1 overflow-hidden px-4 pt-3">
        <AnimatePresence mode="wait">
          {!unlocked ? (
            <m.div key="locked" className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-16 text-center" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25 }}>
              <m.span className="grid size-12 place-items-center rounded-2xl bg-raised text-muted-foreground" animate={{ rotate: [0, -8, 8, 0] }} transition={{ delay: 1, duration: 0.5 }}>
                <Lock className="size-5" />
              </m.span>
              <p className="text-[12px] text-muted-foreground">Chat opens when Rohan accepts your proposal.</p>
            </m.div>
          ) : (
            <m.div key="open" className="flex flex-col gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <m.p className="mx-auto mb-1 flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-[11px] text-success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={spring}>
                <LockOpen className="size-3" /> Rohan accepted · this chat is just for you two
              </m.p>
              {step === 2 && (
                <m.div className="flex gap-1 self-start rounded-2xl rounded-bl-md bg-raised px-3.5 py-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {[0, 1, 2].map((i) => (
                    <m.span key={i} className="size-1.5 rounded-full bg-muted-foreground" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }} />
                  ))}
                </m.div>
              )}
              {step >= 3 && <Bubble>Hey Asha! Free on Saturday evening for the first one?</Bubble>}
              {step >= 4 && <Bubble mine>Yes! Python basics first, then your turn.</Bubble>}
              {step >= 4 && (
                <m.div className="mt-1 flex items-center gap-2.5 self-center rounded-xl border border-border bg-card px-3 py-2 text-[11.5px]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.7 }}>
                  <CalendarCheck className="size-4 text-learn" />
                  <span>
                    <span className="font-semibold">Sat 7:00 PM</span> <span className="text-muted-foreground">· You teach Python · waiting for Rohan</span>
                  </span>
                </m.div>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 border-t border-border p-2.5">
        <div className={cn("flex h-9 flex-1 items-center rounded-lg border px-3 text-[12px] transition-colors duration-500", unlocked ? "border-input" : "border-border bg-raised/50")}>
          {unlocked ? (
            draft ? (
              <span>
                {draft}
                <Caret />
              </span>
            ) : (
              <span className="text-muted-foreground">Message Rohan</span>
            )
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground/70">
              <Lock className="size-3" /> Locked until accepted
            </span>
          )}
        </div>
        <span className={cn("grid size-9 place-items-center rounded-lg transition-colors duration-500", unlocked ? "bg-primary text-primary-foreground" : "bg-raised text-muted-foreground/50")}>
          <SendHorizontal className="size-4" />
        </span>
      </div>
      </div>
    </div>
  );
}

// ── 4. Sessions in two timezones ────────────────────────────────────────────────

export const scheduleSteps: DemoStep[] = [
  { caption: "Suggest a time from inside the swap. You pick it in your own timezone.", ms: 1900 },
  { caption: "Send it to confirm. Nothing is booked until both of you agree.", ms: 2000 },
  { caption: "Rohan, in London, sees the same moment in his time.", ms: 2000 },
  { caption: "He confirms, or suggests another time.", ms: 1500 },
  { caption: "Confirmed for both. Add it to your calendar with one click.", ms: 2700 },
];

function Panel({ who, place, tone, children }: { who: string; place: string; tone: "you" | "teal"; children: ReactNode }) {
  return (
    <div className={cn(card, "flex h-full flex-col overflow-hidden")}>
      <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
        <Face name={who} tone={tone} size={22} />
        <span className="text-[12.5px] font-semibold">{who === "Asha" ? "You" : who}</span>
        <span className="ml-auto text-[10.5px] text-muted-foreground">{place}</span>
      </div>
      <div className="relative flex-1 p-3.5">{children}</div>
    </div>
  );
}

function SessionCard({ time, status, tone, children }: { time: string; status: "waiting" | "request" | "confirmed"; tone: "teach" | "learn"; children?: ReactNode }) {
  return (
    <m.div className="rounded-xl border border-border bg-background p-3" layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
      <p className="text-[12px] font-medium">
        {tone === "teach" ? (
          <>
            You teach <span className="text-primary">Python</span>
          </>
        ) : (
          <>
            Asha teaches you <span className="text-learn">Python</span>
          </>
        )}
      </p>
      <p className="mt-1 text-[17px] font-semibold tabular-nums tracking-tight">{time}</p>
      <p className="text-[10.5px] text-muted-foreground">Saturday · 60 min</p>
      <div className="mt-2.5 flex items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={status}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
              status === "confirmed" ? "bg-success/15 text-success" : status === "request" ? "bg-primary/12 text-primary" : "bg-raised text-muted-foreground",
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {status === "confirmed" ? "Confirmed" : status === "request" ? "Asks you to confirm" : "Waiting for Rohan"}
          </m.span>
        </AnimatePresence>
      </div>
      {children}
    </m.div>
  );
}

export function ScheduleScene({ step }: { step: number }) {
  const confirmed = step >= 4;
  const cursor = [
    { x: 160, y: 136, clickAt: 0.8 },
    { x: 150, y: 246, clickAt: 0.9 },
    { x: 430, y: 300 },
    { x: 352, y: 200, clickAt: 0.9 },
    { x: 150, y: 200, clickAt: 1.4 },
  ][step];

  return (
    <div className="absolute inset-0 grid grid-cols-2 gap-4 p-5">
      <Panel who="Asha" place="Bengaluru · IST" tone="you">
        <AnimatePresence mode="wait" initial={false}>
          {step <= 1 ? (
            <m.div key="form" className="space-y-3" exit={{ opacity: 0, y: -8 }}>
              <p className="text-[12px] font-semibold">Plan a session</p>
              <div>
                <p className="mb-1 text-[10.5px] text-muted-foreground">Date and time</p>
                <m.div className="flex h-9 items-center justify-between rounded-lg border bg-background px-2.5 text-[12px]" animate={{ borderColor: ["var(--input)", "var(--primary)"] }} transition={{ delay: 0.7, duration: 0.2 }}>
                  Sat · 7:00 PM <CalendarPlus className="size-3.5 text-muted-foreground" />
                </m.div>
              </div>
              <div>
                <p className="mb-1 text-[10.5px] text-muted-foreground">Who teaches</p>
                <div className="flex h-9 items-center rounded-lg border border-primary/40 bg-primary/[0.07] px-2.5 text-[12px] text-primary">You teach Python</div>
              </div>
              <Btn className="w-full" pressAt={step === 1 ? 0.9 : undefined}>
                Send to confirm
              </Btn>
            </m.div>
          ) : (
            <m.div key="card" className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SessionCard time="7:00 – 8:00 PM" status={confirmed ? "confirmed" : "waiting"} tone="teach">
                <AnimatePresence>
                  {confirmed && (
                    <m.div className="mt-2.5" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ delay: 0.5 }}>
                      <Btn tone="secondary" pressAt={1.4} className="w-full">
                        <CalendarPlus className="size-3.5" /> Add to calendar
                      </Btn>
                    </m.div>
                  )}
                </AnimatePresence>
              </SessionCard>
            </m.div>
          )}
        </AnimatePresence>
      </Panel>

      <Panel who="Rohan" place="London · GMT" tone="teal">
        <AnimatePresence>
          {step < 2 ? (
            <m.p key="empty" className="absolute inset-0 grid place-items-center px-6 text-center text-[11.5px] text-muted-foreground" exit={{ opacity: 0 }}>
              No sessions planned yet
            </m.p>
          ) : (
            <SessionCard key="req" time="1:30 – 2:30 PM" status={confirmed ? "confirmed" : "request"} tone="learn">
              {!confirmed && (
                <div className="mt-2.5 flex gap-2">
                  <Btn pressAt={step === 3 ? 0.9 : undefined} className="flex-1">
                    <Check className="size-3.5" /> Confirm
                  </Btn>
                  <Btn tone="secondary">Other time</Btn>
                </div>
              )}
            </SessionCard>
          )}
        </AnimatePresence>
      </Panel>

      {/* Same moment */}
      <AnimatePresence>
        {step >= 2 && (
          <m.div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.5 }}>
            <span className="whitespace-nowrap rounded-full bg-raised px-3 py-1.5 text-[11.5px] text-muted-foreground ring-1 ring-border">
              <span className="font-semibold text-primary">7:00 PM</span> in Bengaluru is <span className="font-semibold text-learn">1:30 PM</span> in London. Same moment.
            </span>
          </m.div>
        )}
      </AnimatePresence>
      <DemoToast show={step === 4} delay={0.2}>
        <CalendarCheck className="size-4 text-success" /> Session confirmed for Saturday
      </DemoToast>
      <Cursor x={cursor.x} y={cursor.y} clickAt={cursor.clickAt} />
    </div>
  );
}
