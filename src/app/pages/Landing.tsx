import { Link } from "react-router-dom";
import { ArrowRight, Users, Zap, MessageSquare, TrendingUp, Star, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedCount({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── Live stats from Supabase ──────────────────────────────────────────────────
function useStats() {
  const [stats, setStats] = useState({ members: 0, swaps: 0, skills: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profilesRes, requestsRes, skillsRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase
            .from("swap_requests")
            .select("id", { count: "exact", head: true })
            .eq("status", "accepted"),
          supabase.from("swap_requests").select("skill_learn, skill_teach"),
        ]);

        const members = profilesRes.count ?? 0;
        const swaps = requestsRes.count ?? 0;

        // Count unique skills across all requests
        const skillSet = new Set<string>();
        (skillsRes.data ?? []).forEach((r: any) => {
          if (r.skill_learn) skillSet.add(r.skill_learn.toLowerCase());
          if (r.skill_teach) skillSet.add(r.skill_teach.toLowerCase());
        });

        setStats({ members, swaps, skills: skillSet.size });
      } catch (err) {
        console.error("[Landing] stats load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { stats, loading };
}

// ── Scroll reveal hook ────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function RevealSection({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Floating skill pill ───────────────────────────────────────────────────────
const FLOATING_SKILLS = [
  "JavaScript", "Guitar", "Spanish", "Python", "Yoga",
  "Photography", "Design", "Piano", "SEO", "French",
];

export default function Landing() {
  const { stats, loading } = useStats();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const swaps = [
    { teach: "JavaScript", learn: "Guitar" },
    { teach: "Spanish", learn: "Photography" },
    { teach: "Yoga", learn: "Python" },
    { teach: "Graphic Design", learn: "SEO" },
    { teach: "Piano", learn: "Video Editing" },
    { teach: "Excel", learn: "Public Speaking" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Google Font — Syne for display headings */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }

        @keyframes float-up {
          0%   { opacity: 0; transform: translateY(60px) scale(0.9); }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-60px) scale(0.95); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes scroll-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-left {
          animation: scroll-left 22s linear infinite;
        }
        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
        .shimmer-text {
          background: linear-gradient(
            90deg,
            hsl(var(--primary)) 0%,
            hsl(48 96% 75%) 40%,
            hsl(var(--primary)) 60%,
            hsl(48 96% 65%) 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3.5s linear infinite;
        }
        .glow-primary {
          box-shadow: 0 0 40px hsl(var(--primary) / 0.25), 0 0 80px hsl(var(--primary) / 0.1);
        }
        .card-hover {
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px hsl(var(--primary) / 0.12);
          border-color: hsl(var(--primary) / 0.35);
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-xl transition-all duration-300"
        style={{ boxShadow: scrollY > 20 ? "0 1px 30px rgba(0,0,0,0.2)" : "none" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="SkillBridge"
              className="size-7 object-contain group-hover:scale-110 transition-transform"
            />
            <span className="font-display font-bold text-base tracking-tight">SkillBridge</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/login"
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all active:scale-95"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto overflow-hidden">
        {/* Background glow blobs */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 size-[500px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
          }}
        />

        {/* Live badge */}
        <div
          className="flex justify-center mb-10"
          style={{ animation: "float-up 0s forwards", opacity: 1, transform: "none" }}
        >
          <span
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-primary"
            style={{ backdropFilter: "blur(8px)" }}
          >
            <span className="relative flex size-2">
              <span
                className="absolute inline-flex size-full rounded-full bg-primary opacity-75"
                style={{ animation: "pulse-ring 1.2s ease-out infinite" }}
              />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Peer-to-peer skill exchange · Free forever
          </span>
        </div>

        {/* Headline */}
        <div className="text-center max-w-4xl mx-auto mb-8">

          {/* Peer-to-peer badge */}
          <div className="flex justify-center mb-5">
            <div className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/15 bg-yellow-500/8 backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:border-yellow-400/25 hover:bg-yellow-500/10">

              {/* blinking dot */}
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-60 animate-ping"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-400"></span>
              </span>

              <span className="text-[11px] sm:text-xs tracking-wide uppercase font-medium text-yellow-300/90">
                Peer to Peer Learning Platform
              </span>
            </div>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            <span className="block">
              Teach what you know.
            </span>

            <span className="block mt-2 learn-premium">
              Learn what you don't.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed font-body">
            SkillBridge connects people with complementary skills. No money,
            no institutions — just humans helping each other grow.
          </p>

        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Link
            to="/signup"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all active:scale-95 glow-primary group"
          >
            Start for free
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto flex items-center justify-center px-7 py-3.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted hover:border-primary/30 transition-all"
          >
            Log in to your account
          </Link>
        </div>

        {/* Floating skill pills — infinite scroll ticker */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="flex gap-3 animate-scroll-left w-max">
            {[...FLOATING_SKILLS, ...FLOATING_SKILLS].map((skill, i) => (
              <span
                key={i}
                className="shrink-0 px-4 py-2 rounded-xl border border-border/60 bg-card/60 text-xs font-medium text-muted-foreground backdrop-blur-sm"
              >
                {skill}
              </span>
            ))}
          </div>
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── LIVE STATS ──────────────────────────────────────────────────────── */}
      <RevealSection className="px-4 sm:px-6 max-w-6xl mx-auto mb-24">
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {[
            {
              icon: <Users className="size-5" />,
              value: stats.members,
              suffix: "+",
              label: "Members",
              sublabel: "and growing",
              color: "text-primary",
              bg: "bg-primary/8",
            },
            {
              icon: <TrendingUp className="size-5" />,
              value: stats.swaps,
              suffix: "",
              label: "Successful swaps",
              sublabel: "completed",
              color: "text-emerald-400",
              bg: "bg-emerald-400/8",
            },
            {
              icon: <Globe className="size-5" />,
              value: stats.skills,
              suffix: "+",
              label: "Unique skills",
              sublabel: "being exchanged",
              color: "text-violet-400",
              bg: "bg-violet-400/8",
            },
          ].map((s, i) => (
            <RevealSection
              key={s.label}
              delay={i * 100}
              className="bg-card border border-border rounded-2xl p-4 sm:p-6 text-center card-hover"
            >
              <div className={`inline-flex items-center justify-center size-10 rounded-xl ${s.bg} ${s.color} mb-3 mx-auto`}>
                {s.icon}
              </div>
              <p className={`font-display text-2xl sm:text-4xl font-bold ${s.color} mb-0.5`}>
                {loading ? (
                  <span className="text-muted-foreground/40">—</span>
                ) : (
                  <AnimatedCount target={s.value} suffix={s.suffix} />
                )}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-foreground">{s.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">{s.sublabel}</p>
            </RevealSection>
          ))}
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-3">
          Live data from our community
        </p>
      </RevealSection>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <RevealSection className="px-4 sm:px-6 max-w-6xl mx-auto mb-28">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">How it works</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold">
            Three steps to your first swap
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 relative">
          {/* Connector line — desktop only */}
          <div className="hidden sm:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent z-0" />

          {[
            {
              step: "01",
              icon: <Users className="size-5" />,
              title: "Build your profile",
              desc: "List what you can teach and what you want to learn. Takes two minutes.",
              color: "text-primary bg-primary/10",
            },
            {
              step: "02",
              icon: <Zap className="size-5" />,
              title: "Get matched",
              desc: "Our algorithm finds people with complementary skills — perfect swap candidates.",
              color: "text-emerald-400 bg-emerald-400/10",
            },
            {
              step: "03",
              icon: <MessageSquare className="size-5" />,
              title: "Start exchanging",
              desc: "Message your match, schedule sessions, and start learning immediately.",
              color: "text-violet-400 bg-violet-400/10",
            },
          ].map((item, i) => (
            <RevealSection
              key={item.step}
              delay={i * 120}
              className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden card-hover z-10"
            >
              <span className="absolute top-4 right-4 font-display text-5xl font-black text-foreground/5 select-none leading-none">
                {item.step}
              </span>
              <div className={`size-11 rounded-xl flex items-center justify-center mb-5 ${item.color}`}>
                {item.icon}
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-base">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </RevealSection>
          ))}
        </div>
      </RevealSection>

      {/* ── REAL SWAPS ──────────────────────────────────────────────────────── */}
      <RevealSection className="px-4 sm:px-6 max-w-6xl mx-auto mb-28">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">Real swaps</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold">What people are exchanging</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {swaps.map((swap, i) => (
            <RevealSection
              key={swap.teach}
              delay={i * 60}
              className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-3 card-hover"
            >
              <span className="text-sm font-semibold text-primary truncate flex-1">{swap.teach}</span>
              <div className="size-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                <ArrowRight className="size-3 text-muted-foreground" />
              </div>
              <span className="text-sm font-semibold text-amber-400 truncate flex-1 text-right">{swap.learn}</span>
            </RevealSection>
          ))}
        </div>
      </RevealSection>

      {/* ── SOCIAL PROOF ────────────────────────────────────────────────────── */}
      <RevealSection className="px-4 sm:px-6 max-w-6xl mx-auto mb-28">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              quote: "I traded my JavaScript skills for guitar lessons. Best decision ever.",
              name: "Alex M.",
              role: "Software Engineer",
              stars: 5,
            },
            {
              quote: "Found a Spanish tutor who wanted to learn photography. We both leveled up.",
              name: "Priya K.",
              role: "Photographer",
              stars: 5,
            },
            {
              quote: "No money, no awkwardness. Just genuine skill sharing.",
              name: "James O.",
              role: "Designer",
              stars: 5,
            },
          ].map((t, i) => (
            <RevealSection
              key={t.name}
              delay={i * 100}
              className="bg-card border border-border rounded-2xl p-6 card-hover"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <Star key={s} className="size-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed mb-5 italic">"{t.quote}"</p>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </RevealSection>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <RevealSection className="px-4 sm:px-6 max-w-6xl mx-auto mb-24">
        <div
          className="rounded-3xl px-6 sm:px-14 py-14 sm:py-20 text-center relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(48 90% 45%) 100%)",
          }}
        >
          {/* Background texture */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <p className="text-xs font-bold text-primary-foreground/60 uppercase tracking-[0.2em] mb-4 relative">
            Join the community
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground mb-4 relative">
            Ready to make your first swap?
          </h2>
          <p className="text-primary-foreground/70 text-sm sm:text-base mb-10 max-w-md mx-auto relative">
            Join thousands already exchanging skills. Free, always. No credit card needed.
          </p>
          <Link
            to="/signup"
            className="relative inline-flex items-center gap-2 px-8 py-3.5 bg-background text-foreground rounded-xl font-bold text-sm hover:bg-muted transition-all active:scale-95 group"
          >
            Create free account
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </RevealSection>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="size-5 object-contain" />
            <span className="font-display font-bold text-sm text-foreground">SkillBridge</span>
          </div>
          <p>© 2026 SkillBridge. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link to="/signup" className="hover:text-foreground transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}