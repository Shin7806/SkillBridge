import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const handleAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const errorParam = params.get("error");
        const errorDescription = params.get("error_description");

        // Surface any OAuth errors immediately
        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        // Not an OAuth callback at all → go to dashboard
        if (!code && !window.location.hash.includes("access_token")) {
          window.location.replace("/dashboard");
          return;
        }

        let user = null;

        if (code) {
          // PKCE flow — must exchange code for session first
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          if (cancelled) return;
          user = data.session?.user ?? null;
        } else {
          // Implicit flow (access_token in hash)
          const { data, error: sessionError } =
            await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (cancelled) return;
          user = data.session?.user ?? null;
        }

        if (!user) {
          window.location.replace("/login");
          return;
        }

        // Check if profile already exists — never overwrite
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (!existing) {
          const meta = user.user_metadata ?? {};
          await supabase.from("profiles").insert({
            id: user.id,
            full_name: meta.full_name || meta.name || null,
            avatar_url: meta.avatar_url || meta.picture || null,
            onboarding_completed: false,
          });
        }

        if (cancelled) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (profile?.onboarding_completed === false) {
          window.location.replace("/setup");
        } else {
          window.location.replace("/dashboard");
        }
      } catch (err) {
        console.error("AuthCallback error:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Authentication failed.");
        }
      }
    };

    handleAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border border-border p-8 max-w-sm w-full text-center space-y-4">
          <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-destructive text-xl font-bold">!</span>
          </div>
          <p className="text-sm text-destructive">{error}</p>
          <a href="/login" className="text-primary hover:underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="size-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Signing you in…</span>
      </div>
    </div>
  );
}