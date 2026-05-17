import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../../hooks/useProfile";
import { updateMyProfile } from "../../services/profile";
import { signOut } from "../../services/auth";
import { supabase } from "../../lib/supabase";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/Card";
import { Shield, Bell, Lock, Trash2, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${checked ? "bg-primary" : "bg-muted-foreground/30"
        }`}
    >
      <span
        className={`pointer-events-none block size-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0"
          }`}
      />
    </button>
  );
}

// ── SaveStatus ────────────────────────────────────────────────────────────────
function SaveStatus({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return null;
  if (status === "saving")
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" /> Saving…
      </span>
    );
  if (status === "saved")
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-600">
        <CheckCircle className="size-3" /> Saved
      </span>
    );
  return <span className="text-xs text-red-500">Something went wrong</span>;
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ── ToggleRow ─────────────────────────────────────────────────────────────────
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function Settings() {
  const { user } = useAuth();
  const { profile, refetch } = useProfile(user?.id);

  // ── Password ──────────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwStatus, setPwStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pwError, setPwError] = useState<string | null>(null);

  const handlePasswordUpdate = async () => {
    setPwError(null);
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New passwords don't match.");
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    try {
      setPwStatus("saving");
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user?.email ?? "",
        password: pwForm.current,
      });
      if (signInErr) throw new Error("Current password is incorrect.");

      const { error: updateErr } = await supabase.auth.updateUser({
        password: pwForm.next,
      });
      if (updateErr) throw updateErr;

      setPwForm({ current: "", next: "", confirm: "" });
      setPwStatus("saved");
      setTimeout(() => setPwStatus("idle"), 3000);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to update password.");
      setPwStatus("error");
    }
  };

  // ── Notifications ─────────────────────────────────────────────────────────
  const storedNotifs = (() => {
    try {
      return JSON.parse(localStorage.getItem("sb_notifs") ?? "{}");
    } catch {
      return {};
    }
  })();

  const [notifs, setNotifs] = useState({
    emailMessages: storedNotifs.emailMessages ?? true,
    emailRequests: storedNotifs.emailRequests ?? true,
    pushMessages: storedNotifs.pushMessages ?? false,
    pushRequests: storedNotifs.pushRequests ?? false,
  });
  const [notifStatus, setNotifStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const saveNotifs = async () => {
    setNotifStatus("saving");
    await new Promise((r) => setTimeout(r, 400));
    localStorage.setItem("sb_notifs", JSON.stringify(notifs));
    setNotifStatus("saved");
    setTimeout(() => setNotifStatus("idle"), 3000);
  };

  // ── Privacy ───────────────────────────────────────────────────────────────
  const [privacy, setPrivacy] = useState({
    profileVisible: (profile as any)?.is_public ?? true,
    showEmail: (profile as any)?.show_email ?? false,
  });
  const [privacyStatus, setPrivacyStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const savePrivacy = async () => {
    try {
      setPrivacyStatus("saving");
      await updateMyProfile({ ...(privacy as any) });
      setPrivacyStatus("saved");
      setTimeout(() => setPrivacyStatus("idle"), 3000);
    } catch {
      setPrivacyStatus("error");
    }
  };

  // ── Delete Account ────────────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * Proper account deletion flow:
   * 1. Delete the profile row (cascades related data via FK if set up)
   * 2. Call supabase.rpc('delete_user') — a Postgres function that calls
   *    auth.users delete on the current user (requires the function below).
   *
   * If you haven't created the RPC yet, run this SQL in your Supabase SQL editor:
   *
   *   create or replace function delete_user()
   *   returns void
   *   language plpgsql
   *   security definer
   *   as $$
   *   begin
   *     delete from auth.users where id = auth.uid();
   *   end;
   *   $$;
   *
   * This is the correct client-safe way to delete an auth user without
   * exposing the service-role key in the frontend.
   */
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE" || !user) return;
    try {
      setDeleteLoading(true);
      setDeleteError(null);

      // Step 1: Delete the profile row (cascades to related tables if FKs are set)
      const { error: profileDeleteError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileDeleteError) {
        // Non-fatal — proceed anyway; the auth deletion is the critical step
        console.warn("[Settings] Profile delete failed:", profileDeleteError);
      }

      // Step 2: Delete the auth.users record via a security-definer RPC
      // This actually removes the account, not just logs the user out.
      const { error: rpcError } = await supabase.rpc("delete_user");

      if (rpcError) {
        // If the RPC doesn't exist yet, fall back to signOut and show a helpful message
        if (rpcError.code === "PGRST202" || rpcError.message?.includes("function")) {
          setDeleteError(
            "The delete_user() database function is not set up yet. " +
            "Please add it in your Supabase SQL editor — see the code comment for the SQL."
          );
          setDeleteLoading(false);
          return;
        }
        throw rpcError;
      }

      // Step 3: Sign out locally and redirect
      await signOut();
      window.location.replace("/");
    } catch (err) {
      console.error("[Settings] Delete account error:", err);
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete account. Please try again."
      );
      setDeleteLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-5">

        {/* ── Account ──────────────────────────────────────────────────────── */}
        <Section
          icon={<Shield className="size-4 text-primary" />}
          title="Account"
          description="Your login credentials"
        >
          <div className="space-y-4">
            {/* Email — read-only */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm text-foreground">
                {user?.email ?? "—"}
              </div>
            </div>

            {/* Password change */}
            <div className="pt-2 border-t border-border">
              <p className="text-sm font-medium text-foreground mb-3">Change Password</p>
              <div className="space-y-2.5">
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Current password"
                    className={inputClass}
                    value={pwForm.current}
                    onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="New password"
                  className={inputClass}
                  value={pwForm.next}
                  onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                />
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Confirm new password"
                  className={inputClass}
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                />
              </div>

              {pwError && <p className="text-xs text-red-500 mt-2">{pwError}</p>}

              <div className="flex items-center gap-3 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePasswordUpdate}
                  disabled={
                    !pwForm.current || !pwForm.next || !pwForm.confirm || pwStatus === "saving"
                  }
                >
                  {pwStatus === "saving" && (
                    <Loader2 className="size-3 animate-spin mr-1.5" />
                  )}
                  Update Password
                </Button>
                <SaveStatus status={pwStatus} />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Notifications ─────────────────────────────────────────────────── */}
        <Section
          icon={<Bell className="size-4 text-primary" />}
          title="Notifications"
          description="Choose what you hear about"
        >
          <div className="space-y-1 divide-y divide-border">
            <ToggleRow
              label="New messages (email)"
              description="Get emailed when someone messages you"
              checked={notifs.emailMessages}
              onChange={(v) => setNotifs({ ...notifs, emailMessages: v })}
            />
            <ToggleRow
              label="Skill requests (email)"
              description="Get emailed when you receive a swap request"
              checked={notifs.emailRequests}
              onChange={(v) => setNotifs({ ...notifs, emailRequests: v })}
            />
            <ToggleRow
              label="New messages (push)"
              checked={notifs.pushMessages}
              onChange={(v) => setNotifs({ ...notifs, pushMessages: v })}
            />
            <ToggleRow
              label="Skill requests (push)"
              checked={notifs.pushRequests}
              onChange={(v) => setNotifs({ ...notifs, pushRequests: v })}
            />
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            <Button
              variant="primary"
              size="sm"
              onClick={saveNotifs}
              disabled={notifStatus === "saving"}
            >
              {notifStatus === "saving" && (
                <Loader2 className="size-3 animate-spin mr-1.5" />
              )}
              Save
            </Button>
            <SaveStatus status={notifStatus} />
          </div>
        </Section>

        {/* ── Privacy ───────────────────────────────────────────────────────── */}
        <Section
          icon={<Lock className="size-4 text-primary" />}
          title="Privacy"
          description="Control what others can see"
        >
          <div className="space-y-1 divide-y divide-border">
            <ToggleRow
              label="Public profile"
              description="Allow others to discover and view your profile"
              checked={privacy.profileVisible}
              onChange={(v) => setPrivacy({ ...privacy, profileVisible: v })}
            />
            <ToggleRow
              label="Show email on profile"
              description="Display your email address publicly"
              checked={privacy.showEmail}
              onChange={(v) => setPrivacy({ ...privacy, showEmail: v })}
            />
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
            <Button
              variant="primary"
              size="sm"
              onClick={savePrivacy}
              disabled={privacyStatus === "saving"}
            >
              {privacyStatus === "saving" && (
                <Loader2 className="size-3 animate-spin mr-1.5" />
              )}
              Save
            </Button>
            <SaveStatus status={privacyStatus} />
          </div>
        </Section>

        {/* ── Danger Zone ───────────────────────────────────────────────────── */}
        <Card variant="bordered" className="border-red-500/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="size-4 text-red-500" />
              <CardTitle className="text-red-500">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              These actions are permanent and cannot be undone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground font-medium mb-1">Delete Account</p>
            <p className="text-xs text-muted-foreground mb-4">
              This will permanently remove your account, profile, requests, and all
              associated data. You will not be able to log back in.
            </p>

            <div className="space-y-2.5">
              <input
                type="text"
                placeholder='Type "DELETE" to confirm'
                className={inputClass}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />

              {deleteError && (
                <p className="text-xs text-red-500 leading-relaxed">{deleteError}</p>
              )}

              <Button
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                disabled={deleteConfirm !== "DELETE" || deleteLoading}
                onClick={handleDeleteAccount}
              >
                {deleteLoading && (
                  <Loader2 className="size-3 animate-spin mr-1.5" />
                )}
                {deleteLoading ? "Deleting account…" : "Delete my account"}
              </Button>


            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}