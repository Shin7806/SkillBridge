import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Github, Linkedin } from "lucide-react";
import { Avatar, Card, Section, SkillChip } from "./kit";
import { PersonMeta } from "./people";
import type { Person, SkillRef } from "@/lib/types";
import { displayName, formatDay } from "@/lib/utils";

const LEVEL_LABEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } as const;

function SkillList({ title, skills, tone, empty }: { title: string; skills: SkillRef[]; tone: "teach" | "learn"; empty: string }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-medium tracking-normal text-muted-foreground">
        <span className={tone === "teach" ? "size-1.5 rounded-full bg-primary" : "size-1.5 rounded-full bg-learn"} aria-hidden />
        {title}
      </h3>
      {skills.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <li key={s.id}>
              <SkillChip tone={tone} className="text-[13px]">
                {s.name}
                {s.level && <span className="font-normal opacity-60">· {LEVEL_LABEL[s.level]}</span>}
              </SkillChip>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

/** Shared between a member's public page and your own profile. */
export function ProfileView({ person, actions, avatar }: { person: Person; actions?: ReactNode; avatar?: ReactNode }) {
  const name = displayName(person.full_name);
  const stats = [
    { value: person.sessions_given, label: "taught" },
    { value: person.sessions_received, label: "learned" },
    { value: person.vouch_count, label: person.vouch_count === 1 ? "vouch" : "vouches" },
  ];
  const since = new Date(person.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const socials = [
    person.github_url && { href: person.github_url, label: "GitHub", icon: Github },
    person.linkedin_url && { href: person.linkedin_url, label: "LinkedIn", icon: Linkedin },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Github }[];
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden">
        <div aria-hidden className="h-20 bg-[radial-gradient(120%_140%_at_0%_0%,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_60%),radial-gradient(100%_140%_at_100%_0%,color-mix(in_oklab,var(--learn)_18%,transparent),transparent_60%)] sm:h-24" />
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="-mt-10 flex items-end justify-between gap-3 sm:-mt-12">
            <div className="rounded-full ring-4 ring-card">{avatar ?? <Avatar name={person.full_name} src={person.avatar_url} size="xl" />}</div>
            {actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
          </div>
          <div className="mt-3 min-w-0">
            <h1 className="text-2xl">{name}</h1>
            {person.headline && <p className="mt-0.5 text-[15px] text-muted-foreground">{person.headline}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <PersonMeta location={person.location} organization={person.organization} />
              <span className="text-[13px] text-muted-foreground">Joined {since}</span>
            </div>
            {socials.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {socials.map(({ href, label, icon: Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[13px] text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground">
                    <Icon className="size-3.5" aria-hidden /> {label}
                  </a>
                ))}
              </div>
            )}
          </div>
          <dl className="mt-4 grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-background/40">
            {stats.map((s) => (
              <div key={s.label} className="px-3 py-2.5 text-center">
                <dd className="text-lg font-semibold tabular-nums text-foreground">{s.value}</dd>
                <dt className="text-[12px] text-muted-foreground">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      {(person.bio || person.learning_goals.length > 0) && (
        <Section title="About">
          <Card className="space-y-3 p-4">
            {person.bio && <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed text-foreground/85">{person.bio}</p>}
            {person.learning_goals.length > 0 && (
              <p className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
                Here to
                {person.learning_goals.map((g) => (
                  <SkillChip key={g}>{g}</SkillChip>
                ))}
              </p>
            )}
          </Card>
        </Section>
      )}

      <Section title="Skills">
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <SkillList title="Can teach" skills={person.teaches} tone="teach" empty="No teaching skills listed yet." />
          </Card>
          <Card className="p-4">
            <SkillList title="Wants to learn" skills={person.learns} tone="learn" empty="No learning goals listed yet." />
          </Card>
        </div>
      </Section>

      <Section title="Vouches" count={person.vouch_count}>
        {person.vouches.length ? (
          <Card className="divide-y divide-border">
            {person.vouches.map((v) => (
              <div key={v.id} className="flex gap-3 p-4">
                <Avatar name={v.from_name} src={v.from_avatar} size="sm" />
                <div className="min-w-0 text-[13px]">
                  <p>
                    <Link to={`/people/${v.from_id}`} className="font-medium hover:underline">
                      {displayName(v.from_name)}
                    </Link>{" "}
                    <span className="text-muted-foreground">learned</span> <span className="font-medium text-primary">{v.skill}</span>
                    <span className="text-muted-foreground"> · {formatDay(v.created_at)}</span>
                  </p>
                  {v.note && <p className="mt-1 text-foreground/80">“{v.note}”</p>}
                </div>
              </div>
            ))}
          </Card>
        ) : (
          <p className="text-[13px] text-muted-foreground">No vouches yet. Learners can vouch after a completed session.</p>
        )}
      </Section>
    </div>
  );
}
