// Decorative motion for the landing page: a two-strand helix in the brand's two accents,
// and a calm marquee of skills. Drawn each frame so the helix can breathe and react to the pointer.
import { useMediaQuery } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const PERIOD = 400; // one full wave, in viewBox units; the loop shifts by exactly this, so it's seamless
const WIDTH = 1200;

function wave(amp: number, phase: number, mid: number) {
  const pts: string[] = [];
  for (let x = -PERIOD; x <= WIDTH + PERIOD; x += 10) {
    const y = mid + amp * Math.sin(((x / PERIOD) * 2 + phase) * Math.PI);
    pts.push(`${x === -PERIOD ? "M" : "L"}${x},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

function Strand({ d, color, width, opacity, dur, reverse }: { d: string; color: string; width: number; opacity: number; dur: number; reverse?: boolean }) {
  const still = useMediaQuery("(prefers-reduced-motion: reduce)");
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" opacity={opacity} vectorEffect="non-scaling-stroke" />
      {!still && <animateTransform attributeName="transform" type="translate" from={reverse ? `-${PERIOD} 0` : "0 0"} to={reverse ? "0 0" : `-${PERIOD} 0`} dur={`${dur}s`} repeatCount="indefinite" />}
    </g>
  );
}

/** Two strings that weave over and under each other forever: teaching and learning. */
export function BraidedStrings({ className }: { className?: string }) {
  const mid = 80;
  const a = wave(34, 0, mid);
  const b = wave(34, 1, mid); // opposite phase: crosses the first every half period
  const aEcho = wave(22, 0.15, mid);
  const bEcho = wave(22, 1.15, mid);
  return (
    <div className={cn("pointer-events-none relative select-none", className)} aria-hidden>
      <svg viewBox={`0 0 ${WIDTH} 160`} preserveAspectRatio="none" className="h-28 w-full sm:h-40">
        <defs>
          <linearGradient id="sb-fade" x1="0" x2="1">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="0.18" stopColor="white" stopOpacity="1" />
            <stop offset="0.82" stopColor="white" stopOpacity="1" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="sb-mask">
            <rect width={WIDTH} height="160" fill="url(#sb-fade)" />
          </mask>
          <filter id="sb-glow" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <g mask="url(#sb-mask)">
          <g filter="url(#sb-glow)" opacity="0.55">
            <Strand d={a} color="var(--primary)" width={4} opacity={0.6} dur={14} />
            <Strand d={b} color="var(--learn)" width={4} opacity={0.6} dur={14} />
          </g>
          <Strand d={aEcho} color="var(--primary)" width={1} opacity={0.25} dur={22} reverse />
          <Strand d={bEcho} color="var(--learn)" width={1} opacity={0.25} dur={22} reverse />
          <Strand d={a} color="var(--primary)" width={2} opacity={0.95} dur={14} />
          <Strand d={b} color="var(--learn)" width={2} opacity={0.95} dur={14} />
        </g>
      </svg>
    </div>
  );
}

const SKILLS: [string, "teach" | "learn"][] = [
  ["Python", "teach"], ["Photoshop", "learn"], ["Guitar", "teach"], ["Spanish", "learn"], ["Figma", "teach"],
  ["Cooking", "learn"], ["Public speaking", "teach"], ["SQL", "learn"], ["Photography", "teach"], ["Piano", "learn"],
  ["React", "teach"], ["Animation", "learn"], ["Chess", "teach"], ["Data analysis", "learn"],
];

function Track({ hidden }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center gap-8 pr-8 sm:gap-10 sm:pr-10" aria-hidden={hidden || undefined}>
      {SKILLS.map(([s, tone]) => (
        <li key={s} className="flex items-center gap-2 whitespace-nowrap text-[14px] text-muted-foreground transition-colors duration-200 hover:text-foreground">
          <span className={cn("size-1.5 rounded-full", tone === "teach" ? "bg-primary" : "bg-learn")} aria-hidden />
          {s}
        </li>
      ))}
    </ul>
  );
}

/** One calm row of skills people swap, drifting past. Pauses on hover. */
export function SkillMarquee({ className }: { className?: string }) {
  return (
    <div className={cn("text-center", className)}>
      <p className="sr-only">For example Python, Photoshop, guitar, Spanish, Figma, cooking and many more.</p>
      <div className="group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
        <div className="flex animate-[sb-marquee_50s_linear_infinite] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          <Track />
          <Track hidden />
        </div>
      </div>
    </div>
  );
}
