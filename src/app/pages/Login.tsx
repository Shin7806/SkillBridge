import { Link } from "react-router";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Card } from "../components/Card";
import { useState } from "react";
import { signIn, signInWithGoogle } from "../../services/auth";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { error } = await signIn({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      window.location.href = "/dashboard";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google auth error:", error);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="size-12 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <span className="font-bold text-2xl text-foreground">SkillBridge</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
        <p className="text-muted-foreground">Log in to continue learning</p>
      </div>

      <Card variant="elevated">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-foreground">
              <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" />
              Remember me
            </label>
            <a href="#" className="text-primary hover:text-primary font-medium">
              Forgot password?
            </a>
          </div>

          <Button type="submit" variant="primary" className="w-full" size="lg" disabled={isSubmitting}>
            Log In
          </Button>

          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
        </form>

       <div className="mt-4">
  <Button
    type="button"
    variant="outline"
    className="w-full flex items-center justify-center gap-3"
    size="lg"
    onClick={handleGoogleLogin}
  >
    {/* Google Icon */}
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.2-3-.9-4.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 18.9 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 16 4.5 9.2 8.7 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 45.5c5.1 0 9.8-2 13.2-5.2l-6.1-5.2C29 36.9 26.6 38 24 38c-5.2 0-9.6-3.3-11.2-8l-6.6 5.1C9.1 41.2 16 45.5 24 45.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.4 5.4-6.3 6.9l6.1 5.2C39.9 36.9 44.5 31.5 44.5 25c0-1.5-.2-3-.9-4.5z"/>
    </svg>

    <span>Continue with Google</span>
  </Button>
</div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:text-primary font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
