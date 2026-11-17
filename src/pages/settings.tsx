import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button, Card, FormError, LoadError, Page, PageHeader, Spinner, TextField } from "@/components/kit";
import { Modal } from "@/components/modal";
import * as api from "@/lib/api";
import { useAuth, useMe } from "@/lib/auth";
import { useAction, useBlocked, useDocumentTitle } from "@/lib/hooks";
import { cn, displayName, errorMessage } from "@/lib/utils";

function Section({ title, description, children, danger }: { title: string; description?: string; children: ReactNode; danger?: boolean }) {
  return (
    <Card as="section" className={cn("p-4 sm:p-5", danger && "border-destructive/30")}>
      <h2 className="text-[15px]">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function PasswordSection({ email }: { email: string }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.next.length < 8 || !/[A-Z]/.test(form.next) || !/[a-z]/.test(form.next) || !/\d/.test(form.next) || !/[^A-Za-z0-9]/.test(form.next))
      return setError("Use 8 or more characters with an uppercase letter, a lowercase letter, a number and a symbol.");
    if (form.next !== form.confirm) return setError("The new passwords don't match.");
    setBusy(true);
    setError(null);
    try {
      await api.changePassword(email, form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      toast.success("Password changed");
    } catch (err) {
      setError(errorMessage(err, "Could not change your password."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-sm space-y-4">
      <TextField label="Current password" type="password" value={form.current} onChange={set("current")} autoComplete="current-password" required />
      <TextField label="New password" type="password" value={form.next} onChange={set("next")} autoComplete="new-password" required />
      <TextField label="Confirm new password" type="password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" required />
      <FormError>{error}</FormError>
      <Button type="submit" variant="secondary" loading={busy} disabled={!form.current || !form.next || !form.confirm}>
        Change password
      </Button>
    </form>
  );
}

function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (next: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60", checked ? "bg-primary" : "bg-input")}
    >
      <span className={cn("absolute left-1 top-1 size-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}

export default function Settings() {
  useDocumentTitle("Settings");
  const { user, profile } = useMe();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const blocked = useBlocked();
  const hasPassword = (user.app_metadata?.providers as string[] | undefined)?.includes("email") ?? user.app_metadata?.provider === "email";

  const setDiscoverable = useAction((value: boolean) => api.updateMyProfile(user.id, { is_discoverable: value }), {
    invalidate: ["person"],
    success: (p) => (p.is_discoverable ? "Your profile is visible in Discover" : "Your profile is hidden from Discover"),
    onSuccess: () => refreshProfile(),
  });
  const unblock = useAction(api.unblockUser, { invalidate: ["blocked", "matches", "explore", "person"], success: "Unblocked" });

  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const handleDelete = async () => {
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await api.deleteMyAccount(user.id);
      toast.success("Your account has been deleted");
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(errorMessage(err, "Could not delete your account. Nothing was removed."));
      setDeleteBusy(false);
    }
  };

  return (
    <Page width="narrow">
      <PageHeader title="Settings" />
      <div className="space-y-4">
        <Section title="Account">
          <dl className="mb-5 text-sm">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="mt-0.5 font-medium">{user.email}</dd>
          </dl>
          {hasPassword ? <PasswordSection email={user.email!} /> : <p className="text-sm text-muted-foreground">You sign in with Google, so there's no SkillBridge password to change.</p>}
        </Section>

        <Section title="Privacy" description="Your email address is never shown to other members.">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Show me in Discover</p>
              <p className="mt-0.5 text-sm text-muted-foreground">When off, you don't appear in matches or search. People you already have a swap with still see you.</p>
            </div>
            <Switch label="Show me in Discover" checked={profile.is_discoverable} disabled={setDiscoverable.isPending} onChange={(v) => setDiscoverable.mutate(v)} />
          </div>
        </Section>

        <Section title="Blocked people" description="They can't see you in Discover or propose swaps to you.">
          {blocked.isPending ? (
            <Spinner />
          ) : blocked.isError ? (
            <LoadError error={blocked.error} retry={blocked.refetch} />
          ) : blocked.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven't blocked anyone.</p>
          ) : (
            <ul className="divide-y divide-border">
              {blocked.data.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="truncate text-sm">{displayName(b.name)}</span>
                  <Button variant="secondary" size="sm" loading={unblock.isPending && unblock.variables === b.id} onClick={() => unblock.mutate(b.id)}>
                    Unblock
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Sign out">
          <Button
            variant="secondary"
            loading={signingOut}
            onClick={async () => {
              setSigningOut(true);
              try {
                await api.signOut();
                navigate("/login", { replace: true });
              } catch (err) {
                toast.error(errorMessage(err, "Could not sign you out. Try again."));
                setSigningOut(false);
              }
            }}
          >
            Sign out of SkillBridge
          </Button>
        </Section>

        <Section title="Delete account" description="Permanently removes your profile, skills, swaps, messages, sessions and vouches you gave. This can't be undone." danger>
          <Button variant="danger" onClick={() => { setDeleting(true); setConfirmText(""); setDeleteError(null); }}>
            Delete my account
          </Button>
        </Section>
      </div>

      <Modal
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete your account?"
        description="Everything you've added is removed for good, including your side of every conversation."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(false)} disabled={deleteBusy}>
              Keep my account
            </Button>
            <Button variant="danger" loading={deleteBusy} disabled={confirmText !== "DELETE"} onClick={handleDelete}>
              Delete forever
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField label="Type DELETE to confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" autoCapitalize="characters" />
          <FormError>{deleteError}</FormError>
        </div>
      </Modal>
    </Page>
  );
}
