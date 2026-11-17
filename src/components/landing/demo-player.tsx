// A tiny "video player" for code-driven product demos.
// Each scene is drawn on a fixed canvas and scaled to fit, so it looks the same at every width,
// plays only while visible, can be paused or scrubbed, and respects reduced-motion preferences.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DemoStep {
  caption: string;
  ms: number;
}

const DemoContext = createContext({ playing: false, step: 0 });
/** Lets scene parts (typewriters, counters) pause with the player. */
export const useDemo = () => useContext(DemoContext);

export const CANVAS_W = 560;
export const CANVAS_H = 400;

interface Props {
  /** Short name for assistive technology, e.g. "Matching demo". */
  label: string;
  /** What the whole demo shows, read by screen readers instead of the animation. */
  description: string;
  steps: DemoStep[];
  /** Shown in the fake address bar. */
  path?: string;
  children: (step: number) => ReactNode;
  className?: string;
  /** Larger caption and frame for the hero. */
  featured?: boolean;
  /** Called when the last step finishes. Without it the demo loops. */
  onEnd?: () => void;
}

export function DemoPlayer({ label, description, steps, path = "skillbridge", children, className, featured, onEnd }: Props) {
  const reduced = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const elapsed = useRef(0);

  const [scale, setScale] = useState(1);
  const [near, setNear] = useState(false); // mount the scene only once it's close to the viewport
  const [visible, setVisible] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === "visible");

  // Reduced motion: start on the finished frame, paused. The viewer can still press play.
  useEffect(() => {
    if (reduced) {
      setUserPaused(true);
      setStep(steps.length - 1);
    }
  }, [reduced, steps.length]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const resize = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / CANVAS_W));
    resize.observe(el);
    const nearby = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "300px" });
    nearby.observe(el);
    const view = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    view.observe(el);
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      resize.disconnect();
      nearby.disconnect();
      view.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const playing = !userPaused && visible && pageVisible;

  const paintFills = useCallback(
    (current: number, progress: number) => {
      fills.current.forEach((el, i) => {
        if (el) el.style.transform = `scaleX(${i < current ? 1 : i === current ? progress : 0})`;
      });
    },
    [],
  );

  // Paint immediately on step change so segments never lag behind a jump.
  useEffect(() => paintFills(step, elapsed.current / steps[step].ms), [step, steps, paintFills]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      elapsed.current += now - last;
      last = now;
      const duration = steps[step].ms;
      if (elapsed.current >= duration) {
        elapsed.current = 0;
        if (step === steps.length - 1) {
          if (onEnd) {
            paintFills(step, 1);
            onEnd();
            return;
          }
          setCycle((c) => c + 1);
          setStep(0);
        } else setStep(step + 1);
        return;
      }
      paintFills(step, elapsed.current / duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, step, steps, paintFills, onEnd]);

  const jump = (i: number) => {
    elapsed.current = 0;
    if (i === 0) setCycle((c) => c + 1); // replay entrance animations from the top
    setStep(i);
  };

  const finished = userPaused && step === steps.length - 1 && elapsed.current === 0;

  return (
    <figure className={cn("group/demo", className)}>
      <figcaption className="sr-only">
        {label}. {description}
      </figcaption>

      <div className={cn("overflow-hidden rounded-2xl bg-card ring-1 ring-border", featured ? "shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9)]" : "shadow-[0_24px_60px_-30px_rgb(0_0_0/0.8)]")}>
        {/* Window chrome */}
        <div className="flex h-9 items-center gap-3 border-b border-border bg-raised/60 px-3.5" aria-hidden>
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
          </span>
          <span className="mx-auto max-w-[60%] truncate rounded-md bg-background/70 px-3 py-0.5 text-[11px] text-muted-foreground">{path}</span>
          <span className="w-[42px]" />
        </div>

        {/* Scaled canvas */}
        <div ref={frame} className="relative w-full overflow-hidden bg-background" style={{ height: CANVAS_H * scale }} aria-hidden>
          {near && (
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})` }}>
              <DemoContext.Provider value={{ playing, step }}>
                <div key={cycle} className="relative size-full">
                  {children(step)}
                </div>
              </DemoContext.Provider>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 border-t border-border px-3 py-2.5">
          <button
            type="button"
            onClick={() => {
              if (finished) jump(0);
              setUserPaused((p) => !p);
            }}
            aria-label={userPaused ? `Play ${label}` : `Pause ${label}`}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-foreground transition-[background-color,transform] hover:bg-foreground/[0.12] active:scale-90"
          >
            <AnimatePresence mode="wait" initial={false}>
              <m.span key={userPaused ? (finished ? "replay" : "play") : "pause"} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.12 }}>
                {userPaused ? finished ? <RotateCcw className="size-3.5" /> : <Play className="size-3.5 translate-x-px fill-current" /> : <Pause className="size-3.5 fill-current" />}
              </m.span>
            </AnimatePresence>
          </button>
          <div className="flex flex-1 items-center gap-1" role="group" aria-label={`${label} steps`}>
            {steps.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => jump(i)}
                aria-label={`Step ${i + 1} of ${steps.length}: ${s.caption}`}
                aria-current={i === step ? "step" : undefined}
                className="group/seg relative flex h-6 flex-1 items-center"
              >
                <span className="relative h-1 w-full overflow-hidden rounded-full bg-foreground/10 transition-[height] group-hover/seg:h-1.5">
                  <span ref={(el) => void (fills.current[i] = el)} className="absolute inset-0 origin-left rounded-full bg-primary" style={{ transform: `scaleX(${i < step ? 1 : i === step ? Math.min(elapsed.current / s.ms, 1) : 0})` }} />
                </span>
              </button>
            ))}
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground" aria-hidden>
            {step + 1}/{steps.length}
          </span>
        </div>
      </div>

      {/* Caption, outside the scaled canvas so it stays readable on phones */}
      <div className={cn("relative mt-3.5 min-h-12 px-1", featured && "mt-4")} aria-hidden>
        <AnimatePresence mode="wait" initial={false}>
          <m.p
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn("flex gap-2.5 text-muted-foreground", featured ? "text-[15px]" : "text-sm")}
          >
            <span className="mt-px text-xs font-semibold tabular-nums text-primary">{String(step + 1).padStart(2, "0")}</span>
            <span>{steps[step].caption}</span>
          </m.p>
        </AnimatePresence>
      </div>
    </figure>
  );
}

// ── Shared scene parts ─────────────────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;
export const enter = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease } };
export const spring = { type: "spring" as const, stiffness: 260, damping: 26 };

/** A pointer that glides between positions and ripples when it "clicks". */
export function Cursor({ x, y, clickAt, hidden }: { x: number; y: number; clickAt?: number; hidden?: boolean }) {
  return (
    <m.div className="pointer-events-none absolute left-0 top-0 z-50" initial={false} animate={{ x, y, opacity: hidden ? 0 : 1 }} transition={{ type: "spring", stiffness: 160, damping: 24, mass: 0.8 }}>
      {clickAt !== undefined && (
        <m.span
          key={`${x}-${y}-${clickAt}`}
          className="absolute -left-4 -top-4 size-8 rounded-full border-2 border-foreground/70"
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.3, 1.4], opacity: [0, 0.9, 0] }}
          transition={{ delay: clickAt, duration: 0.5, times: [0, 0.2, 1] }}
        />
      )}
      <svg width="20" height="22" viewBox="0 0 20 22" fill="none" className="drop-shadow-[0_2px_6px_rgb(0_0_0/0.6)]">
        <path d="M2 1.5 17 10.2l-6.6 1.6-3 6.5L2 1.5Z" fill="#fff" stroke="#14161a" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </m.div>
  );
}

/** Types text out while the demo plays. `full` shows the finished string (later steps, reduced motion). */
export function useTypewriter(text: string, active: boolean, full: boolean, delayMs = 250, cps = 34) {
  const { playing } = useDemo();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active || !playing || count >= text.length) return;
    const t = setTimeout(() => setCount((c) => c + 1), count === 0 ? delayMs : 1000 / cps);
    return () => clearTimeout(t);
  }, [active, playing, count, text, delayMs, cps]);
  if (full) return text;
  return active ? text.slice(0, count) : "";
}

const PERSONA_TONES = {
  you: "bg-primary text-primary-foreground",
  teal: "bg-learn text-learn-foreground",
  rose: "bg-[#f08a8a] text-[#2a1010]",
  sky: "bg-[#7fb4ff] text-[#0b1a33]",
  plain: "bg-raised text-muted-foreground ring-1 ring-border",
} as const;

export function Face({ name, tone = "plain", size = 28 }: { name: string; tone?: keyof typeof PERSONA_TONES; size?: number }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-full font-semibold", PERSONA_TONES[tone])} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {name[0]}
    </span>
  );
}

export function Chip({ children, tone = "neutral", glow, className }: { children: ReactNode; tone?: "teach" | "learn" | "neutral"; glow?: boolean; className?: string }) {
  const tones = {
    teach: "bg-primary/12 text-primary ring-primary/25",
    learn: "bg-learn/12 text-learn ring-learn/25",
    neutral: "bg-raised text-muted-foreground ring-border",
  };
  return (
    <span className={cn("relative isolate inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-medium ring-1 ring-inset", tones[tone], className)}>
      {glow && (
        <m.span
          className={cn("absolute inset-0 -z-10 rounded-full", tone === "learn" ? "bg-learn/40" : "bg-primary/40")}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: [0, 0.9, 0], scale: [1, 1.35, 1.5] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      {children}
    </span>
  );
}

/** Small toast that slides in from the top of the canvas. */
export function DemoToast({ show, children, delay = 0 }: { show: boolean; children: ReactNode; delay?: number }) {
  return (
    <AnimatePresence>
      {show && (
        <m.div
          className="absolute left-1/2 top-4 z-40 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-xl border border-border bg-popover px-3.5 py-2.5 text-[12.5px] shadow-[0_12px_30px_-10px_rgb(0_0_0/0.8)]"
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ ...spring, delay }}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}
