import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { useDocumentTitle } from "@/lib/hooks";

function Article({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  useDocumentTitle(title);
  return (
    <PublicShell>
      <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-4xl font-bold">{title}</h1>
        {lead && <p className="mt-4 text-lg text-muted-foreground">{lead}</p>}
        <div className="mt-10 space-y-8 leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h2]:mb-3 [&_h2]:font-sans [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-normal [&_h2]:text-foreground [&_li]:mt-1.5 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </PublicShell>
  );
}

export function About() {
  return (
    <Article title="About SkillBridge" lead="A free platform where people trade what they know for what they want to learn.">
      <section>
        <h2>The idea</h2>
        <p>Many people want to learn a skill but can't afford a course or a tutor. Many others have a useful skill and nobody to teach it to. SkillBridge connects the two by matching people whose skills fit in both directions.</p>
        <p>If you know Python and want to learn Photoshop, and someone else knows Photoshop and wants to learn Python, you're a two-way match. You propose a swap, agree a rhythm, and teach each other.</p>
      </section>
      <section>
        <h2>What it will never have</h2>
        <p>No payments, no subscriptions, no paid tiers and no advertising. Members exchange time and knowledge only.</p>
      </section>
      <section>
        <h2>Who built it</h2>
        <p>
          SkillBridge is a final-year BCA project. The source code is on <a href="https://github.com/Shin7806/SkillBridge" target="_blank" rel="noopener noreferrer">GitHub</a>.
        </p>
      </section>
    </Article>
  );
}

const FAQ: { q: string; a: ReactNode }[] = [
  { q: "Does it cost anything?", a: "No. There is nothing to buy and no way to pay another member through SkillBridge." },
  { q: "How does matching work?", a: "You list skills you can teach and skills you want to learn. A two-way match is someone who teaches a skill on your learn list and wants a skill on your teach list. One-way matches fit in one direction only and are labelled." },
  { q: "I have no matches. What now?", a: "Add more skills on either list, browse everyone under Discover → Explore, or post an Ask describing what you need. New members are matched to you automatically." },
  { q: "What is a swap?", a: "An agreement between two people: one skill each way. Once the other person accepts, the swap gets a private chat and a place to plan sessions." },
  { q: "Can I message someone before they accept?", a: "No. Your proposal can carry one short message. Chat opens only after it is accepted, which keeps unwanted messages out." },
  { q: "How do sessions work?", a: "Either person suggests a time. The other confirms or suggests another. Times are stored once and shown to each of you in your own timezone. You add your own meeting link, such as Google Meet or Zoom." },
  { q: "What is a vouch?", a: "After a session is marked as done, the learner can vouch for the teacher with an optional short note. Vouches appear on the teacher's profile." },
  { q: "Who can see my profile?", a: "Signed-in members. Your email address is never shown. You can hide your profile from Discover in Settings; people you already have a swap with will still see it." },
  { q: "Someone is bothering me.", a: "Open their profile or your swap with them, choose Block, and they can no longer find you or propose swaps. Use Report to tell us what happened." },
  { q: "How do I delete my account?", a: "Settings → Delete account. Your profile, skills, swaps, messages and sessions are removed permanently." },
];

export function Help() {
  return (
    <Article title="Help" lead="Short answers to the questions people ask most.">
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {FAQ.map(({ q, a }) => (
          <details key={q} className="group px-5">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium text-foreground [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="pb-5 text-sm">{a}</p>
          </details>
        ))}
      </div>
      <p>
        Still stuck? Open an issue on <a href="https://github.com/Shin7806/SkillBridge/issues" target="_blank" rel="noopener noreferrer">GitHub</a>.
      </p>
    </Article>
  );
}

export function Privacy() {
  return (
    <Article title="Privacy" lead="What SkillBridge stores about you, who can see it, and how to remove it. This is a student project and this page is a plain description of how the app works, not legal advice.">
      <section>
        <h2>What we store</h2>
        <ul>
          <li>Your email address and password (handled by Supabase Auth; the password is stored hashed and we never see it). If you sign in with Google, your name and profile photo from Google.</li>
          <li>What you add to your profile: name, photo, headline, bio, location, college or organisation, links, and your skills.</li>
          <li>Your swaps, messages, sessions, vouches, Asks, blocks and reports.</li>
          <li>Your timezone, so session times can be shown correctly.</li>
        </ul>
      </section>
      <section>
        <h2>Who can see what</h2>
        <ul>
          <li>Your email address is never shown to other members.</li>
          <li>Your profile and skills are visible to signed-in members. If you turn off “Show me in Discover”, only people you have a swap with can see them.</li>
          <li>A swap, its messages and its sessions are visible only to the two people in it.</li>
          <li>Vouches you give appear on the other person's profile with your name.</li>
          <li>Reports are visible only to the project owner.</li>
          <li>People who are not signed in can see nothing except three totals on the home page: members, skills and swaps.</li>
        </ul>
      </section>
      <section>
        <h2>What we don't do</h2>
        <p>No advertising, no analytics trackers, and no selling or sharing of data. The app sets only the storage it needs to keep you signed in.</p>
      </section>
      <section>
        <h2>Where it lives</h2>
        <p>Data is stored with Supabase. The website is served by Vercel. Fonts are loaded from Google Fonts.</p>
      </section>
      <section>
        <h2>Deleting your data</h2>
        <p>
          Settings → Delete account removes your account and everything attached to it, including messages you sent. See <Link to="/help">Help</Link> for more.
        </p>
      </section>
    </Article>
  );
}

export function Terms() {
  return (
    <Article title="Terms of use" lead="The ground rules for using SkillBridge. This is a student project offered as is; this page is not a substitute for legal advice.">
      <section>
        <h2>The basics</h2>
        <ul>
          <li>SkillBridge is free. Don't ask for or offer payment for a swap.</li>
          <li>Be honest about what you can teach, and show up for sessions you confirm.</li>
          <li>Treat people with respect. No harassment, hate, sexual content, spam or impersonation, in profiles, photos or messages.</li>
          <li>Keep your account to yourself and use your real name or the name you go by.</li>
        </ul>
      </section>
      <section>
        <h2>Your safety</h2>
        <p>Members are not verified or vetted. Use your judgement when meeting someone new, prefer video calls, and don't share passwords, financial details or anything you wouldn't want made public. Block and report anyone who makes you uncomfortable.</p>
      </section>
      <section>
        <h2>Content and removal</h2>
        <p>You are responsible for what you post. Accounts or content that break these rules may be removed.</p>
      </section>
      <section>
        <h2>No guarantees</h2>
        <p>The service is provided as is, without warranty. It may change, be unavailable or be discontinued. Lessons are given by members, not by SkillBridge, and we can't vouch for their accuracy.</p>
      </section>
    </Article>
  );
}
