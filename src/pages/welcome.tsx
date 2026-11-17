import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Search } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Badge, Button, Card, FormError, LoadError, Logo, Spinner, SwapStrip, TextField } from "@/components/kit";
import { SkillPicker } from "@/components/skill-picker";
import { AvatarUploader, GoalsField } from "./me";
import * as api from "@/lib/api";
import { useAuth, useMe } from "@/lib/auth";
import { useDocumentTitle, useMatches, usePerson, useSkills } from "@/lib/hooks";
import { cn, displayName, errorMessage, myTimezone } from "@/lib/utils";

const STEPS = ["About you", "You teach", "You learn", "Your matches"];

function Progress({ step }: { step: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2" aria-label="Setup progress">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 flex-col gap-2" aria-current={i === step ? "step" : undefined}>
          <span className={cn("h-1.5 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-raised")} />
          <span className={cn("hidden text-xs sm:block", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>
            {i < step && <Check className="mr-1 inline size-3" aria-hidden />}
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function MatchResults({ onDone, finishing }: { onDone: (hasMatches: boolean) => void; finishing: boolean }) {
  const matches = useMatches();
  const twoWay = (matches.data ?? []).filter((m) => m.kind === "two_way");
  const oneWay = (matches.data ?? []).filter((m) => m.kind !== "two_way");
  const shown = (twoWay.length ? twoWay : oneWay).slice(0, 3);

  if (matches.isPending) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center" role="status">
        <span className="relative grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" aria-hidden />
          <Search className="size-6" aria-hidden />
        </span>
        <p className="text-muted-foreground">Looking for people whose skills fit yours…</p>
      </div>
    );
  }
  if (matches.isError) return <LoadError error={matches.error} retry={matches.refetch} />;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">
          {twoWay.length ? `${twoWay.length} two-way ${twoWay.length === 1 ? "match" : "matches"} found` : oneWay.length ? "No two-way match yet, but there's a start" : "No matches yet"}
        </h2>
        <p className="mt-1.5 text-muted-foreground">
          {twoWay.length
            ? "Each of these people teaches something you want and wants something you teach."
            : oneWay.length
              ? "Nobody fits in both directions right now. These people fit in one, and you can still propose a swap."
              : "Nobody's skills overlap with yours right now. Your profile is live, so new members will be matched to you, and you can browse everyone or post an Ask."}
        </p>
      </div>
      {shown.length > 0 && (
        <ul className="space-y-3">
          {shown.map((m) => (
            <Card as="li" key={m.id} className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={m.full_name} src={m.avatar_url} size="sm" />
                <span className="min-w-0 flex-1 truncate font-medium">{displayName(m.full_name)}</span>
                <Badge tone={m.kind === "can_teach_me" ? "learn" : "teach"}>{m.kind === "two_way" ? "Two-way" : m.kind === "can_teach_me" ? "Can teach you" : "Wants your skill"}</Badge>
              </div>
              {m.kind === "two_way" ? (
                <SwapStrip teach={m.they_want.map((s) => s.name).join(", ")} learn={m.they_teach.map((s) => s.name).join(", ")} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {m.kind === "can_teach_me" ? `Teaches ${m.they_teach.map((s) => s.name).join(", ")}` : `Wants to learn ${m.they_want.map((s) => s.name).join(", ")}`}
                </p>
              )}
            </Card>
          ))}
        </ul>
      )}
      <Button size="lg" className="w-full" loading={finishing} onClick={() => onDone(shown.length > 0)}>
        {shown.length ? "See all matches" : "Go to SkillBridge"} <ArrowRight />
      </Button>
    </div>
  );
}

export default function Welcome() {
  useDocumentTitle("Set up your profile");
  const { user, profile } = useMe();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const skills = useSkills();
  const existing = usePerson(user.id);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.full_name ?? "");
  const [organization, setOrganization] = useState(profile.organization ?? (user.user_metadata?.organization as string | undefined) ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [goals, setGoals] = useState<string[]>(profile.learning_goals);
  const [teach, setTeach] = useState<api.SkillChoice[]>([]);
  const [learn, setLearn] = useState<api.SkillChoice[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // People who started before keep the skills they already entered.
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (seeded || !existing.data) return;
    setTeach(existing.data.teaches.map((s) => ({ skill_id: s.id, level: s.level ?? null })));
    setLearn(existing.data.learns.map((s) => ({ skill_id: s.id, level: s.level ?? null })));
    setSeeded(true);
  }, [existing.data, seeded]);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveAbout = () =>
    run(async () => {
      if (name.trim().length < 2) throw new Error("Enter your name so people know who they're swapping with.");
      await api.updateMyProfile(user.id, {
        full_name: name.trim(),
        organization: organization.trim() || null,
        location: location.trim() || null,
        learning_goals: goals,
        timezone: myTimezone(),
      });
      await refreshProfile();
      setStep(1);
    });

  const saveSkills = () =>
    run(async () => {
      await api.setMySkills(teach, learn);
      await queryClient.invalidateQueries({ queryKey: ["matches"] });
      setStep(3);
    });

  const finish = (hasMatches: boolean) =>
    run(async () => {
      await api.completeOnboarding();
      await queryClient.invalidateQueries({ queryKey: ["person"] });
      toast.success("You're all set");
      // Refresh first so the app's guards see the completed profile, then go where the matches are.
      await refreshProfile();
      navigate(hasMatches ? "/discover" : "/home", { replace: true });
    });

  return (
    <div className="relative isolate min-h-dvh overflow-hidden">
      <div className="glow-primary pointer-events-none absolute -top-80 left-1/2 -z-10 size-[48rem] -translate-x-1/2 rounded-full" aria-hidden />
      <header className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Logo />
        <Button variant="ghost" size="sm" onClick={() => api.signOut().catch((err) => toast.error(errorMessage(err)))}>
          Sign out
        </Button>
      </header>

      <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-4 sm:pt-8">
        <Progress step={step} />

        {step === 0 && (
          <section className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Welcome to SkillBridge</h1>
              <p className="mt-2 text-muted-foreground">Two minutes to set up. First, a little about you.</p>
            </div>
            <div className="flex items-center gap-4">
              <AvatarUploader size="lg" />
              <p className="text-sm text-muted-foreground">A photo helps people recognise you. JPG, PNG or WebP, up to 2 MB.</p>
            </div>
            <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="College or organisation" optional value={organization} onChange={(e) => setOrganization(e.target.value)} maxLength={80} />
              <TextField label="Location" optional value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} placeholder="Bengaluru, India" />
            </div>
            <GoalsField value={goals} onChange={setGoals} />
            <FormError>{error}</FormError>
            <Button size="lg" className="w-full" loading={busy} onClick={saveAbout}>
              Continue <ArrowRight />
            </Button>
          </section>
        )}

        {(step === 1 || step === 2) &&
          (skills.isPending || existing.isPending ? (
            <Spinner />
          ) : skills.isError ? (
            <LoadError error={skills.error} retry={skills.refetch} />
          ) : (
            <section className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">{step === 1 ? "What can you teach?" : "What do you want to learn?"}</h1>
                <p className="mt-2 text-muted-foreground">
                  {step === 1
                    ? "Anything you could explain to a beginner counts. You don't need to be an expert."
                    : "Pick what you'd like someone to teach you. We'll look for people who fit in both directions."}
                </p>
              </div>
              {step === 1 ? (
                <SkillPicker tone="teach" label="Skills you can teach" hint="Search the list or add your own." value={teach} onChange={setTeach} skills={skills.data} exclude={learn.map((l) => l.skill_id)} />
              ) : (
                <SkillPicker tone="learn" label="Skills you want to learn" hint="Search the list or add your own." value={learn} onChange={setLearn} skills={skills.data} exclude={teach.map((t) => t.skill_id)} />
              )}
              <FormError>{error}</FormError>
              <div className="flex gap-3">
                <Button variant="secondary" size="lg" onClick={() => setStep(step - 1)} disabled={busy}>
                  <ArrowLeft /> Back
                </Button>
                {step === 1 ? (
                  <Button size="lg" className="flex-1" disabled={teach.length === 0} onClick={() => setStep(2)}>
                    Continue <ArrowRight />
                  </Button>
                ) : (
                  <Button size="lg" className="flex-1" disabled={learn.length === 0} loading={busy} onClick={saveSkills}>
                    Find my matches <ArrowRight />
                  </Button>
                )}
              </div>
            </section>
          ))}

        {step === 3 && (
          <section className="space-y-4">
            <MatchResults onDone={finish} finishing={busy} />
            <FormError>{error}</FormError>
            <Button variant="ghost" size="sm" onClick={() => setStep(2)} disabled={busy}>
              <ArrowLeft /> Change my skills
            </Button>
          </section>
        )}
      </main>
    </div>
  );
}
