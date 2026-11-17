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
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {avatar ?? <Avatar name={person.full_name} src={person.avatar_url} size="xl" />}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl">{name}</h1>
          {person.headline && <p className="mt-0.5 text-[15px] text-muted-foreground">{person.headline}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <PersonMeta location={person.location} organization={person.organization} />
            <span className="text-[13px] text-muted-foreground">Member since {formatDay(person.created_at)}</span>
          </div>
          <dl className="mt-3 flex gap-5 text-[13px]">
            {stats.map((s) => (
              <div key={s.label} className="flex items-baseline gap-1.5">
                <dd className="text-base font-semibold tabular-nums text-foreground">{s.value}</dd>
                <dt className="text-muted-foreground">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>

      {person.bio && (
        <Section title="About">
          <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed text-foreground/85">{person.bio}</p>
        </Section>
      )}

      <Section title="Skills">
        <Card className="grid gap-5 p-4 sm:grid-cols-2">
          <SkillList title="Can teach" skills={person.teaches} tone="teach" empty="No teaching skills listed yet." />
          <SkillList title="Wants to learn" skills={person.learns} tone="learn" empty="No learning goals listed yet." />
        </Card>
      </Section>

      {(person.learning_goals.length > 0 || person.github_url || person.linkedin_url) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {person.learning_goals.length > 0 && (
            <p className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
              Here to
              {person.learning_goals.map((g) => (
                <SkillChip key={g}>{g}</SkillChip>
              ))}
            </p>
          )}
          {person.github_url && (
            <a href={person.github_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
              <Github className="size-3.5" aria-hidden /> GitHub
            </a>
          )}
          {person.linkedin_url && (
            <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
              <Linkedin className="size-3.5" aria-hidden /> LinkedIn
            </a>
          )}
        </div>
      )}

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
