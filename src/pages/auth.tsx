import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, MailCheck } from "lucide-react";
import { Button, ButtonLink, FormError, Logo, TextField } from "@/components/kit";
import { FullScreenLoader } from "@/App";
import * as api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useDocumentTitle } from "@/lib/hooks";
import { cn, errorMessage } from "@/lib/utils";

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="glow-primary pointer-events-none absolute -top-72 left-1/2 -z-10 size-[44rem] -translate-x-1/2 rounded-full" aria-hidden />
      <main className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <Link to="/" aria-label="SkillBridge home" className="mb-6 inline-block">
            <Logo />
          </Link>
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/30">{children}</div>
        {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
      </main>
    </div>
  );
}

function PasswordField({ label, value, onChange, autoComplete, error, hint }: { label: string; value: string; onChange: (v: string) => void; autoComplete: string; error?: string | null; hint?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <TextField
      label={label}
      type={shown ? "text" : "password"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      required
      error={error}
      hint={hint}
      trailing={
        <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? "Hide password" : "Show password"} aria-pressed={shown} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:text-foreground">
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    />
  );
}

const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "8 or more characters", test: (p) => p.length >= 8 },
  { label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
  { label: "A symbol", test: (p) => /[^A-Za-z0-9]/.test(p) },
];
const passwordOk = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className={cn("flex items-center gap-1.5 text-xs", ok ? "text-success" : "text-muted-foreground")}>
            <Check className={cn("size-3.5", !ok && "opacity-30")} aria-hidden />
            {rule.label}
            <span className="sr-only">{ok ? " (met)" : " (not met)"}</span>
          </li>
        );
      })}
    </ul>
  );
}

function GoogleButton() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        variant="secondary"
        className="w-full"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await api.signInWithGoogle();
          } catch (err) {
            setError(errorMessage(err, "Google sign-in could not start. Try again."));
            setBusy(false);
          }
        }}
      >
        {!busy && (
          <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.2-3-.9-4.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 18.9 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16 4.5 9.2 8.7 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 45.5c5.1 0 9.8-2 13.2-5.2l-6.1-5.2C29 36.9 26.6 38 24 38c-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.1 41.2 16 45.5 24 45.5z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.4 5.4-6.3 6.9l6.1 5.2C39.9 36.9 44.5 31.5 44.5 25c0-1.5-.2-3-.9-4.5z" />
          </svg>
        )}
        Continue with Google
      </Button>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </>
  );
}

const Legal = () => (
  <p className="mt-5 text-center text-xs text-muted-foreground">
    By continuing you agree to the <Link to="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
    <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
  </p>
);

export function Login() {
  useDocumentTitle("Log in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.signIn(email, password); // the route guard redirects once the session is live
    } catch (err) {
      setError(errorMessage(err, "Could not log you in. Try again."));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" required placeholder="you@example.com" />
        <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="-mt-1 text-right">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot your password?
          </Link>
        </div>
        <FormError>{error}</FormError>
        <Button type="submit" className="w-full" loading={busy} disabled={!email || !password}>
          Log in
        </Button>
      </form>
      <GoogleButton />
      <Legal />
    </AuthShell>
  );
}

export function Signup() {
  useDocumentTitle("Create your account");
  const [form, setForm] = useState({ name: "", email: "", organization: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const mismatch = form.confirm.length > 0 && form.confirm !== form.password;
  const valid = form.name.trim().length >= 2 && emailOk && passwordOk(form.password) && form.confirm === form.password;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { needsConfirmation } = await api.signUp(form);
      if (needsConfirmation) setSentTo(form.email.trim());
      // otherwise the session is live and the route guard moves on to onboarding
    } catch (err) {
      setError(errorMessage(err, "Could not create your account. Try again."));
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <AuthShell title="Check your email">
        <div className="space-y-4 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="size-6" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to <strong className="text-foreground">{sentTo}</strong>. Open it to activate your account, then come back and log in.
          </p>
          <p className="text-xs text-muted-foreground">Nothing after a few minutes? Check spam, or sign up again to resend it.</p>
          <ButtonLink to="/login" variant="secondary" className="w-full">
            Go to log in
          </ButtonLink>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever. No card, no catch."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <TextField label="Full name" value={form.name} onChange={set("name")} autoComplete="name" required maxLength={80} placeholder="Asha Rao" />
        <TextField label="Email" type="email" value={form.email} onChange={set("email")} autoComplete="email" inputMode="email" required placeholder="you@example.com" error={form.email && !emailOk ? "Enter a valid email address." : null} />
        <TextField label="College or organisation" optional value={form.organization} onChange={set("organization")} autoComplete="organization" maxLength={80} />
        <PasswordField label="Password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} autoComplete="new-password" />
        <PasswordRules password={form.password} />
        <PasswordField label="Confirm password" value={form.confirm} onChange={(v) => setForm((f) => ({ ...f, confirm: v }))} autoComplete="new-password" error={mismatch ? "The passwords don't match." : null} />
        <FormError>{error}</FormError>
        <Button type="submit" className="w-full" loading={busy} disabled={!valid}>
          Create account
        </Button>
      </form>
      <GoogleButton />
      <Legal />
    </AuthShell>
  );
}

export function ForgotPassword() {
  useDocumentTitle("Reset your password");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, "Could not send the email. Try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={sent ? "Check your email" : "Forgot your password?"}
      subtitle={sent ? undefined : "Enter your email and we'll send you a link to set a new one."}
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <p className="text-center text-sm text-muted-foreground">
          If an account exists for <strong className="text-foreground">{email.trim()}</strong>, a reset link is on its way. It expires after a short time.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" required placeholder="you@example.com" />
          <FormError>{error}</FormError>
          <Button type="submit" className="w-full" loading={busy} disabled={!email.includes("@")}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

/** Reached from the emailed reset link, which signs the user in with a short-lived recovery session. */
export function ResetPassword() {
  useDocumentTitle("Choose a new password");
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkError = new URLSearchParams(window.location.search).get("error_description") ?? new URLSearchParams(window.location.hash.slice(1)).get("error_description");

  if (loading) return <FullScreenLoader />;

  if (!user) {
    return (
      <AuthShell title="This link has expired">
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{linkError ?? "Reset links can only be used once and expire quickly."} Request a new one to continue.</p>
          <ButtonLink to="/forgot-password" className="w-full">
            Send a new link
          </ButtonLink>
        </div>
      </AuthShell>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.updatePassword(password);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "Could not update your password. Try again."));
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle={user.email ?? undefined}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <PasswordField label="New password" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordRules password={password} />
        <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" error={confirm && confirm !== password ? "The passwords don't match." : null} />
        <FormError>{error}</FormError>
        <Button type="submit" className="w-full" loading={busy} disabled={!passwordOk(password) || confirm !== password}>
          Save new password
        </Button>
      </form>
    </AuthShell>
  );
}

/** Landing spot for Google sign-in and email confirmation links. The Supabase client completes the exchange itself. */
export function AuthCallback() {
  const { user, profile, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const linkError = params.get("error_description") ?? hash.get("error_description");

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  if (user && profile) return <Navigate to={profile.onboarding_completed ? "/home" : "/welcome"} replace />;

  if (linkError || (timedOut && !loading && !user)) {
    return (
      <AuthShell title="We couldn't sign you in">
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{linkError ?? "The link may have expired or already been used."}</p>
          <ButtonLink to="/login" className="w-full">
            Back to log in
          </ButtonLink>
        </div>
      </AuthShell>
    );
  }
  return <FullScreenLoader label="Signing you in" />;
}
