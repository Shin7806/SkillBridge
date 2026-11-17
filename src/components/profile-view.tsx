import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Github, Linkedin, Quote } from "lucide-react";
import { Avatar, Card, SkillChip } from "./kit";
import { PersonMeta } from "./people";
import type { Person, SkillRef } from "@/lib/types";
import { displayName, formatDay } from "@/lib/utils";

const LEVEL_LABEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } as const;

function SkillList({ title, skills, tone, empty }: { title: string; skills: SkillRef[]; tone: "teach" | "learn"; empty: string }) {
  return (
    <div>
      <h3 className={tone === "teach" ? "mb-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-primary" : "mb-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-learn"}>{title}</h3>
      {skills.length ? (
        <ul className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <li key={s.id}>
              <SkillChip tone={tone} className="py-1.5 text-sm">
                {s.name}
                {s.level && <span className="font-normal opacity-70">· {LEVEL_LABEL[s.level]}</span>}
              </SkillChip>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-4 py-3 text-center">
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/** Shared between a member's public page and your own profile. */
export function ProfileView({ person, actions, avatar }: { person: Person; actions?: ReactNode; avatar?: ReactNode }) {
  const name = displayName(person.full_name);
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/5 to-learn/15 sm:h-24" aria-hidden />
        <div className="px-5 pb-5 sm:px-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-3">
            {avatar ?? <Avatar name={person.full_name} src={person.avatar_url} size="xl" className="ring-4 ring-card" />}
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
          <h1 className="mt-4 text-2xl font-bold">{name}</h1>
          {person.headline && <p className="mt-0.5 text-muted-foreground">{person.headline}</p>}
          <div className="mt-3 space-y-2">
            <PersonMeta location={person.location} organization={person.organization} />
            <p className="text-xs text-muted-foreground">Member since {formatDay(person.created_at)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
          <Stat value={person.sessions_given} label="Sessions taught" />
          <Stat value={person.sessions_received} label="Sessions learned" />
          <Stat value={person.vouch_count} label="Vouches" />
        </div>
      </Card>

      {person.bio && (
        <Card className="p-5 sm:p-6">
          <h2 className="mb-2 font-sans text-sm font-semibold tracking-normal">About</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{person.bio}</p>
        </Card>
      )}

      <Card className="space-y-5 p-5 sm:p-6">
        <SkillList title="Can teach" skills={person.teaches} tone="teach" empty="No teaching skills listed yet." />
        <SkillList title="Wants to learn" skills={person.learns} tone="learn" empty="No learning goals listed yet." />
        {person.learning_goals.length > 0 && (
          <div>
            <h3 className="mb-2.5 font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">Here to</h3>
            <ul className="flex flex-wrap gap-2">
              {person.learning_goals.map((g) => (
                <li key={g}>
                  <SkillChip className="py-1.5 text-sm">{g}</SkillChip>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {(person.github_url || person.linkedin_url) && (
        <Card className="flex flex-wrap gap-x-6 gap-y-3 p-5 sm:p-6">
          {person.github_url && (
            <a href={person.github_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Github className="size-4" aria-hidden /> GitHub
            </a>
          )}
          {person.linkedin_url && (
            <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Linkedin className="size-4" aria-hidden /> LinkedIn
            </a>
          )}
        </Card>
      )}

      <Card className="p-5 sm:p-6">
        <h2 className="mb-1 font-sans text-sm font-semibold tracking-normal">Vouches</h2>
        <p className="mb-4 text-sm text-muted-foreground">Left by learners after a completed session.</p>
        {person.vouches.length ? (
          <ul className="space-y-4">
            {person.vouches.map((v) => (
              <li key={v.id} className="flex gap-3">
                <Avatar name={v.from_name} src={v.from_avatar} size="sm" />
                <div className="min-w-0 text-sm">
                  <p>
                    <Link to={`/people/${v.from_id}`} className="font-medium hover:underline">
                      {displayName(v.from_name)}
                    </Link>{" "}
                    <span className="text-muted-foreground">learned</span> <span className="font-medium text-primary">{v.skill}</span>
                  </p>
                  {v.note && (
                    <p className="mt-1 flex gap-1.5 text-muted-foreground">
                      <Quote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      {v.note}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{formatDay(v.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No vouches yet.</p>
        )}
      </Card>
    </div>
  );
}
