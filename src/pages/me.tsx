import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, EyeOff, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Avatar, Button, ButtonLink, FormError, LoadError, Page, Spinner, TextArea, TextField } from "@/components/kit";
import { Modal } from "@/components/modal";
import { ProfileView } from "@/components/profile-view";
import { SkillPicker } from "@/components/skill-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as api from "@/lib/api";
import { useAuth, useMe } from "@/lib/auth";
import { useDocumentTitle, usePerson, useSkills } from "@/lib/hooks";
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
    <div className={cn("group relative inline-block w-fit self-start", className)}>
      <Avatar name={profile.full_name} src={profile.avatar_url} size={size} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label="Change profile photo"
        className="absolute -bottom-0.5 -right-0.5 grid size-7 place-items-center rounded-full bg-foreground text-background ring-[3px] ring-background transition-transform duration-150 hover:scale-110 active:scale-95"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}

export function GoalsField({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px] font-medium">What are you here for?</legend>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {LEARNING_GOALS.map((goal) => {
          const checked = value.includes(goal);
          return (
            <label key={goal} className={cn("flex h-9 cursor-pointer items-center gap-2.5 rounded-lg border px-3 text-[13px] transition-colors duration-150", checked ? "border-primary/40 bg-primary/[0.06]" : "border-input hover:border-foreground/25")}>
              <input type="checkbox" checked={checked} onChange={() => onChange(checked ? value.filter((g) => g !== goal) : [...value, goal])} className="size-3.5 accent-[var(--primary)]" />
              {goal}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** One place to edit everything about you: details and skills. */
function EditProfileDialog({ profile, person, open, onOpenChange }: { profile: Profile; person: Person; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const skills = useSkills();
  const toChoices = (list: Person["teaches"]) => list.map((s) => ({ skill_id: s.id, level: s.level ?? null }));
  const blank = () => ({
    full_name: profile.full_name ?? "",
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    location: profile.location ?? "",
    organization: profile.organization ?? "",
    github_url: profile.github_url ?? "",
    linkedin_url: profile.linkedin_url ?? "",
  });
  const [tab, setTab] = useState("details");
  const [form, setForm] = useState(blank);
  const [goals, setGoals] = useState(profile.learning_goals);
  const [teach, setTeach] = useState(() => toChoices(person.teaches));
  const [learn, setLearn] = useState(() => toChoices(person.learns));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(blank());
    setGoals(profile.learning_goals);
    setTeach(toChoices(person.teaches));
    setLearn(toChoices(person.learns));
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const skillsChanged = JSON.stringify(teach) !== JSON.stringify(toChoices(person.teaches)) || JSON.stringify(learn) !== JSON.stringify(toChoices(person.learns));

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (form.full_name.trim().length < 2) {
      setTab("details");
      return setError("Enter your name.");
    }
    const github = form.github_url.trim() ? cleanHttpsUrl(form.github_url) : null;
    const linkedin = form.linkedin_url.trim() ? cleanHttpsUrl(form.linkedin_url) : null;
    if ((form.github_url.trim() && !github) || (form.linkedin_url.trim() && !linkedin)) {
      setTab("details");
      return setError("One of your links doesn't look right.");
    }
    if (teach.length === 0 || learn.length === 0) {
      setTab("skills");
      return setError("Keep at least one skill on each side so you can be matched.");
    }
    setError(null);
    setSaving(true);
    try {
      await api.updateMyProfile(profile.id, {
        full_name: form.full_name.trim(),
        headline: form.headline.trim() || null,
        bio: form.bio.trim() || null,
        location: form.location.trim() || null,
        organization: form.organization.trim() || null,
        github_url: github,
        linkedin_url: linkedin,
        learning_goals: goals,
      });
      if (skillsChanged) await api.setMySkills(teach, learn);
      await Promise.all([refreshProfile(), ...["person", "matches", "explore"].map((k) => queryClient.invalidateQueries({ queryKey: [k] }))]);
      toast.success("Profile saved");
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit profile"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="edit-profile" loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-profile" onSubmit={submit} className="space-y-4">
        <Tabs value={tab} onValueChange={setTab} className="gap-4">
          <TabsList className="grid h-9 w-full grid-cols-2 rounded-lg bg-raised p-0.5">
            <TabsTrigger value="details" className="h-8 rounded-md text-[13px] data-[state=active]:bg-background data-[state=active]:text-foreground">
              Details
            </TabsTrigger>
            <TabsTrigger value="skills" className="h-8 rounded-md text-[13px] data-[state=active]:bg-background data-[state=active]:text-foreground">
              Skills
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4 animate-in fade-in-0 duration-200">
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
          </TabsContent>
          <TabsContent value="skills" className="space-y-5 animate-in fade-in-0 duration-200">
            {skills.isPending ? (
              <Spinner />
            ) : skills.isError ? (
              <LoadError error={skills.error} retry={skills.refetch} />
            ) : (
              <>
                <SkillPicker tone="teach" label="Skills you can teach" value={teach} onChange={setTeach} skills={skills.data} exclude={learn.map((l) => l.skill_id)} />
                <SkillPicker tone="learn" label="Skills you want to learn" value={learn} onChange={setLearn} skills={skills.data} exclude={teach.map((t) => t.skill_id)} />
                <p className="text-[12px] text-muted-foreground">Matches update as soon as you save.</p>
              </>
            )}
          </TabsContent>
        </Tabs>
        <FormError>{error}</FormError>
      </form>
    </Modal>
  );
}

export default function Me() {
  useDocumentTitle("Profile");
  const { user, profile } = useMe();
  const person = usePerson(user.id);
  const [editing, setEditing] = useState(false);

  if (person.isPending) return <Page width="narrow"><Spinner /></Page>;
  if (person.isError || !person.data) return <Page width="narrow"><LoadError error={person.error} retry={person.refetch} /></Page>;

  return (
    <Page width="narrow">
      {!profile.is_discoverable && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-raised px-3.5 py-2.5 text-[13px]">
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <EyeOff className="size-3.5" aria-hidden /> Hidden from Discover. Only swap partners can see your profile.
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
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil /> Edit profile
          </Button>
        }
      />
      <EditProfileDialog profile={profile} person={person.data} open={editing} onOpenChange={setEditing} />
    </Page>
  );
}
