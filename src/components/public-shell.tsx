import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Github, Menu, X } from "lucide-react";
import { ButtonLink, Logo } from "./kit";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from "./ui/drawer";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const SECTIONS = [
  { id: "how", label: "How it works" },
  { id: "safety", label: "Safety" },
  { id: "faq", label: "FAQ" },
] as const;

/** Which landing section is in the middle of the screen. */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    const onScroll = () => window.scrollY < 300 && setActive(null);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [enabled]);
  return active;
}

export function PublicHeader() {
  const { user } = useAuth();
  const onLanding = useLocation().pathname === "/";
  const active = useActiveSection(onLanding);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const href = (id: string) => (onLanding ? `#${id}` : `/#${id}`);

  return (
    <header className={cn("sticky top-0 z-30 border-b transition-[background-color,border-color,backdrop-filter] duration-300", scrolled ? "border-border/70 bg-background/80 backdrop-blur-xl" : "border-transparent bg-transparent")}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="SkillBridge home" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        <nav aria-label="Sections" className="hidden items-center gap-1 rounded-full p-1 md:flex">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={href(s.id)}
              aria-current={active === s.id ? "location" : undefined}
              className={cn(
                "relative rounded-md px-3 py-1.5 text-[13px] transition-colors duration-200",
                active === s.id ? "bg-foreground/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <ButtonLink to="/home" size="sm" className="group">
              Open app <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </ButtonLink>
          ) : (
            <>
              <ButtonLink to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Log in
              </ButtonLink>
              <ButtonLink to="/signup" size="sm" className="group">
                Get started <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </ButtonLink>
            </>
          )}
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground md:hidden">
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      <Drawer open={menuOpen} onOpenChange={setMenuOpen} direction="right">
        <DrawerContent className="w-[min(20rem,85vw)] border-border bg-card p-0">
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <DrawerTitle className="text-base">Menu</DrawerTitle>
            <DrawerDescription className="sr-only">Jump to a section or sign in</DrawerDescription>
            <DrawerClose className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close menu">
              <X className="size-5" />
            </DrawerClose>
          </div>
          <nav aria-label="Sections" className="flex flex-col p-3">
            {SECTIONS.map((s) => (
              <a key={s.id} href={href(s.id)} onClick={() => setMenuOpen(false)} className="flex h-12 items-center justify-between rounded-xl px-3 text-base hover:bg-accent">
                {s.label}
                <ArrowRight className="size-4 text-muted-foreground" />
              </a>
            ))}
          </nav>
          <div className="mt-auto space-y-2 border-t border-border p-4">
            {user ? (
              <ButtonLink to="/home" className="w-full">
                Open app
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to="/signup" className="w-full">
                  Create free account
                </ButtonLink>
                <ButtonLink to="/login" variant="secondary" className="w-full">
                  Log in
                </ButtonLink>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </header>
  );
}

const FOOTER_COLUMNS: { title: string; links: { label: string; to: string; external?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "How it works", to: "/#how" },
      { label: "Safety", to: "/#safety" },
      { label: "FAQ", to: "/#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Create account", to: "/signup" },
      { label: "Log in", to: "/login" },
      { label: "Reset password", to: "/forgot-password" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About SkillBridge", to: "/about" },
      { label: "Help", to: "/help" },
      { label: "Source code", to: "https://github.com/Shin7806/SkillBridge", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_2fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">A free peer-to-peer skill exchange. Teach what you know, learn what you don't.</p>
          <a href="https://github.com/Shin7806/SkillBridge" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <Github className="size-4" aria-hidden /> Open source on GitHub
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-[13px] font-medium tracking-normal text-foreground">{col.title}</h2>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external || l.to.includes("#") ? (
                      <a href={l.to} {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {l.label}
                      </a>
                    ) : (
                      <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">Built as a BCA final-year project. Free to use, with no ads and no tracking.</p>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <PublicHeader />
      <main id="content" className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
