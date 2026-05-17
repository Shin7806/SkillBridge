import { Link } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, Circle } from "lucide-react";
import { signUp, signInWithGoogle } from "../../services/auth";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);

  const password = formData.password;
  const confirmPassword = formData.confirmPassword;

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;
  const isConfirmValid = confirmPassword.length > 0 && confirmPassword === password;

  const passwordRules = [
    { label: "At least 8 characters", valid: hasMinLength },
    { label: "One uppercase letter", valid: hasUppercase },
    { label: "One lowercase letter", valid: hasLowercase },
    { label: "One number", valid: hasNumber },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid || !isConfirmValid) return;
    setIsLoading(true);
    setSignupError(null);
    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
      });
      if (result.needsEmailConfirmation) {
        setShowConfirmationMessage(true);
        return;
      }
      window.location.href = "/setup";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Signup failed. Please try again.";
      setSignupError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google auth error:", error);
    }
  };

  // ── Email confirmation screen ─────────────────────────────────────────────
  if (showConfirmationMessage) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 65%)" }}
        />
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap'); .font-display { font-family: 'Syne', sans-serif; }`}</style>

        <div className="w-full max-w-sm relative z-10 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-8 group">
            <img src="/logo.png" alt="SkillBridge" className="size-9 object-contain group-hover:scale-105 transition-transform" />
            <span className="font-display font-bold text-xl tracking-tight text-foreground">SkillBridge</span>
          </Link>

          <div className="bg-card border border-border/60 rounded-2xl p-8 shadow-xl shadow-black/10">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">📧</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">Check your email</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-1">
              We sent a confirmation link to
            </p>
            <p className="text-sm font-semibold text-foreground mb-6">{formData.email}</p>
            <p className="text-xs text-muted-foreground">
              Click the link in your email to activate your account.
            </p>
            <div className="mt-6 pt-5 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Already confirmed?{" "}
                <Link to="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main signup form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 65%)" }}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
      `}</style>

      <div className="w-full max-w-sm relative z-10">

        {/* Logo + heading */}
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex items-center gap-2.5 group mb-5">
            <img src="/logo.png" alt="SkillBridge" className="size-9 object-contain group-hover:scale-105 transition-transform" />
            <span className="font-display font-bold text-xl tracking-tight text-foreground">SkillBridge</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-foreground mb-1.5 block">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">Start your learning journey today</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl shadow-black/10">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoComplete="name"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Password strength rules */}
              {formData.password.length > 0 && (
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {passwordRules.map((rule) => (
                    <div key={rule.label} className="flex items-center gap-1.5">
                      {rule.valid ? (
                        <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Circle className="size-3.5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={`text-[11px] ${rule.valid ? "text-emerald-400" : "text-muted-foreground/60"}`}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 pr-11 bg-background border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-all ${formData.confirmPassword.length > 0 && !isConfirmValid
                      ? "border-destructive/50 focus:ring-destructive/30"
                      : "border-border focus:ring-primary/50 focus:border-primary/50"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? "Hide" : "Show"}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {formData.confirmPassword.length > 0 && !isConfirmValid && (
                <p className="text-[11px] text-destructive mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Error */}
            {signupError && (
              <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-xs text-destructive">{signupError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!isPasswordValid || !isConfirmValid || isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group mt-1"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-[11px] text-muted-foreground font-medium">or</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-background border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted hover:border-border/80 transition-all active:scale-[0.98]"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.2-3-.9-4.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 18.9 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16 4.5 9.2 8.7 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 45.5c5.1 0 9.8-2 13.2-5.2l-6.1-5.2C29 36.9 26.6 38 24 38c-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.1 41.2 16 45.5 24 45.5z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.4 5.4-6.3 6.9l6.1 5.2C39.9 36.9 44.5 31.5 44.5 25c0-1.5-.2-3-.9-4.5z" />
            </svg>
            Continue with Google
          </button>

          {/* Log in link */}
          <p className="text-center text-xs text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">
              Log in
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-5 px-4">
          By creating an account, you agree to our{" "}
          <span className="text-foreground/50">Terms of Service</span> and{" "}
          <span className="text-foreground/50">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}