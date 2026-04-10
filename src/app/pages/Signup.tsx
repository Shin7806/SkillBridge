import { Link } from "react-router";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Card } from "../components/Card";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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

  const password = formData.password;
  const confirmPassword = formData.confirmPassword;

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const isConfirmValid = confirmPassword.length > 0 && confirmPassword === password;

  const passwordRules = [
    { label: "At least 8 characters", valid: hasMinLength },
    { label: "At least 1 uppercase letter", valid: hasUppercase },
    { label: "At least 1 lowercase letter", valid: hasLowercase },
    { label: "At least 1 number", valid: hasNumber },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if validation fails
    if (!isPasswordValid || !isConfirmValid) return;

    setIsLoading(true);
    setSignupError(null);

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
      });

      console.log("Signup response:", result);

      if (result.needsEmailConfirmation) {
        alert("Check your email before logging in.");
        return;
      }

      window.location.href = "/setup";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed. Please try again.";
      console.error("Signup error:", err);
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

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="size-12 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <span className="font-bold text-2xl text-foreground">SkillBridge</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Create your account</h1>
        <p className="text-muted-foreground">Start your learning journey today</p>
      </div>

      <Card variant="elevated">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

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
            placeholder="Create a strong password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={formData.password.length > 0 && !isPasswordValid ? "Password doesn't meet requirements." : undefined}
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
          {formData.password.length > 0 && (
            <div className="space-y-1">
              {passwordRules.map((rule) => (
                <div
                  key={rule.label}
                  className={`text-xs ${
                    rule.valid ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {rule.valid ? "✓ " : "• "}
                  {rule.label}
                </div>
              ))}
            </div>
          )}

          <Input
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            error={
              formData.confirmPassword.length > 0 && !isConfirmValid
                ? "Passwords do not match."
                : undefined
            }
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            size="lg"
            disabled={!isPasswordValid || !isConfirmValid || isLoading}
          >
            Create Account
          </Button>

          {signupError ? (
            <p className="text-sm text-destructive" role="alert">
              {signupError}
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
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:text-primary font-medium">
              Log in
            </Link>
          </p>
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground mt-6">
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
