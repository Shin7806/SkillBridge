import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, EyeOff, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Button, ButtonLink, FormError, LoadError, Page, Spinner, TextArea, TextField } from "@/components/kit";
import { Modal } from "@/components/modal";
import { ProfileView } from "@/components/profile-view";
import { SkillPicker } from "@/components/skill-picker";
import * as api from "@/lib/api";
import { useAuth, useMe } from "@/lib/auth";
import { useAction, useDocumentTitle, usePerson, useSkills } from "@/lib/hooks";
import { LEARNING_GOALS, type Person, type Profile } from "@/lib/types";
import { cleanHttpsUrl, cn, errorMessage } from "@/lib/utils";

/** Avatar with a camera button. Uploads straight away and reports real success or failure. */
export function AvatarUploader({ size = "xl", className }: { size?: "lg" | "xl"; className?: string }) {
  const { user, profile } = useMe();
  const { refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      await api.uploadAvatar(user.id, file, profile.avatar_url);
      await Promise.all([refreshProfile(), queryClient.invalidateQueries({ queryKey: ["person", user.id] })]);
      toast.success("Photo updated");
    } catch (err) {
      toast.error(errorMessage(err, "Could not upload that photo."));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <Avatar name={profile.full_name} src={profile.avatar_url} size={size} className="ring-4 ring-card" />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label="Change profile photo"
        className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-card hover:brightness-110"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}

export function GoalsField({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">What are you here for?</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {LEARNING_GOALS.map((goal) => {
          const checked = value.includes(goal);
          return (
            <label key={goal} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3.5 text-sm transition-colors", checked ? "border-primary/50 bg-primary/[0.07]" : "border-input hover:border-foreground/30")}>
              <input type="checkbox" checked={checked} onChange={() => onChange(checked ? value.filter((g) => g !== goal) : [...value, goal])} className="size-4 accent-[var(--primary)]" />
              {goal}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function EditProfileDialog({ profile, open, onOpenChange }: { profile: Profile; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { refreshProfile } = useAuth();
  const blank = () => ({
    full_name: profile.full_name ?? "",
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    location: profile.location ?? "",
    organization: profile.organization ?? "",
    github_url: profile.github_url ?? "",
    linkedin_url: profile.linkedin_url ?? "",
  });
  const [form, setForm] = useState(blank);
  const [goals, setGoals] = useState(profile.learning_goals);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setForm(blank());
      setGoals(profile.learning_goals);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = useAction((values: Parameters<typeof api.updateMyProfile>[1]) => api.updateMyProfile(profile.id, values), {
    invalidate: ["person"],
    success: "Profile saved",
    onSuccess: async () => {
      await refreshProfile();
      onOpenChange(false);
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (form.full_name.trim().length < 2) return setError("Enter your name.");
    const github = form.github_url.trim() ? cleanHttpsUrl(form.github_url) : null;
    const linkedin = form.linkedin_url.trim() ? cleanHttpsUrl(form.linkedin_url) : null;
    if (form.github_url.trim() && !github) return setError("The GitHub link doesn't look right.");
    if (form.linkedin_url.trim() && !linkedin) return setError("The LinkedIn link doesn't look right.");
    setError(null);
    save.mutate({
      full_name: form.full_name.trim(),
      headline: form.headline.trim() || null,
      bio: form.bio.trim() || null,
      location: form.location.trim() || null,
      organization: form.organization.trim() || null,
      github_url: github,
      linkedin_url: linkedin,
      learning_goals: goals,
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit profile"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="edit-profile" loading={save.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form id="edit-profile" onSubmit={submit} className="space-y-4">
        <TextField label="Full name" value={form.full_name} onChange={set("full_name")} maxLength={80} required autoComplete="name" />
        <TextField label="Headline" optional value={form.headline} onChange={set("headline")} maxLength={120} placeholder="Design student who loves teaching Figma" />
        <TextArea label="About you" optional value={form.bio} onChange={set("bio")} maxLength={600} placeholder="What you do, how you like to teach, what you're hoping to learn." />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Location" optional value={form.location} onChange={set("location")} maxLength={80} placeholder="Bengaluru, India" />
          <TextField label="College or organisation" optional value={form.organization} onChange={set("organization")} maxLength={80} />
        </div>
        <GoalsField value={goals} onChange={setGoals} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="GitHub" optional value={form.github_url} onChange={set("github_url")} inputMode="url" placeholder="github.com/you" />
          <TextField label="LinkedIn" optional value={form.linkedin_url} onChange={set("linkedin_url")} inputMode="url" placeholder="linkedin.com/in/you" />
        </div>
        <FormError>{error}</FormError>
      </form>
    </Modal>
  );
}

function EditSkillsDialog({ person, open, onOpenChange }: { person: Person; open: boolean; onOpenChange: (o: boolean) => void }) {
  const skills = useSkills();
  const toChoices = (list: Person["teaches"]) => list.map((s) => ({ skill_id: s.id, level: s.level ?? null }));
  const [teach, setTeach] = useState(() => toChoices(person.teaches));
  const [learn, setLearn] = useState(() => toChoices(person.learns));
  useEffect(() => {
    if (open) {
      setTeach(toChoices(person.teaches));
      setLearn(toChoices(person.learns));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = useAction(() => api.setMySkills(teach, learn), {
    invalidate: ["person", "matches", "explore"],
    success: "Skills saved",
    onSuccess: () => onOpenChange(false),
  });
  const incomplete = teach.length === 0 || learn.length === 0;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit skills"
      description="Matches update as soon as you save."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={save.isPending} disabled={incomplete || skills.isPending} onClick={() => save.mutate(undefined)}>
            Save skills
          </Button>
        </>
      }
    >
      {skills.isPending ? (
        <Spinner />
      ) : skills.isError ? (
        <LoadError error={skills.error} retry={skills.refetch} />
      ) : (
        <div className="space-y-6">
          <SkillPicker tone="teach" label="Skills you can teach" value={teach} onChange={setTeach} skills={skills.data} exclude={learn.map((l) => l.skill_id)} />
          <SkillPicker tone="learn" label="Skills you want to learn" value={learn} onChange={setLearn} skills={skills.data} exclude={teach.map((t) => t.skill_id)} />
          {incomplete && <p className="text-sm text-muted-foreground">Keep at least one skill on each side so you can be matched.</p>}
        </div>
      )}
    </Modal>
  );
}

export default function Me() {
  useDocumentTitle("Your profile");
  const { user, profile } = useMe();
  const person = usePerson(user.id);
  const [editing, setEditing] = useState<"profile" | "skills" | null>(null);

  if (person.isPending) return <Page width="narrow"><Spinner /></Page>;
  if (person.isError || !person.data) return <Page width="narrow"><LoadError error={person.error} retry={person.refetch} /></Page>;

  return (
    <Page width="narrow">
      {!profile.is_discoverable && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-raised px-4 py-3 text-sm">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <EyeOff className="size-4" aria-hidden /> Your profile is hidden from Discover. Only swap partners can see it.
          </span>
          <ButtonLink to="/settings" variant="ghost" size="sm">
            Change
          </ButtonLink>
        </div>
      )}
      <ProfileView
        person={person.data}
        avatar={<AvatarUploader />}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditing("skills")}>
              Edit skills
            </Button>
            <Button size="sm" onClick={() => setEditing("profile")}>
              <Pencil /> Edit profile
            </Button>
          </>
        }
      />
      <EditProfileDialog profile={profile} open={editing === "profile"} onOpenChange={(o) => setEditing(o ? "profile" : null)} />
      <EditSkillsDialog person={person.data} open={editing === "skills"} onOpenChange={(o) => setEditing(o ? "skills" : null)} />
    </Page>
  );
}
