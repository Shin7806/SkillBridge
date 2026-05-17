import { Link } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { signIn, signInWithGoogle } from "../../services/auth";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    try {
      const { error } = await signIn({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      window.location.href = "/dashboard";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setLoginError(message);
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

  const isValid = formData.email.length > 0 && formData.password.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Subtle background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 65%)",
        }}
      />

      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
      `}</style>

      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group mb-6">
            <img
              src="/logo.png"
              alt="SkillBridge"
              className="size-9 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              SkillBridge
            </span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2 block">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">Log in to continue learning</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl shadow-black/10">
          <form onSubmit={handleSubmit} className="space-y-4">

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
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="current-password"
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
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => setRememberMe((v) => !v)}
                  className={`size-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${rememberMe
                      ? "bg-primary border-primary"
                      : "border-border group-hover:border-primary/50"
                    }`}
                >
                  {rememberMe && (
                    <svg className="size-2.5 text-primary-foreground" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4l3 3 5-6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error */}
            {loginError && (
              <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-xs text-destructive">{loginError}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group mt-1"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  Log In
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

          {/* Sign up link */}
          <p className="text-center text-xs text-muted-foreground mt-5">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-semibold hover:text-primary/80 transition-colors">
              Sign up free
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-5 px-4">
          By logging in, you agree to our{" "}
          <span className="text-foreground/50">Terms of Service</span> and{" "}
          <span className="text-foreground/50">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}