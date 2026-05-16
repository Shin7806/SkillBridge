import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "../app/contexts/AuthContext";

interface UseOnboardingResult {
  onboardingCompleted: boolean | null; // null = still loading
  loading: boolean;
}

export function useOnboarding(): UseOnboardingResult {
  const { user } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOnboardingCompleted(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchOnboarding = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error("useOnboarding fetch error:", error);
          // Fail safe: treat as completed so we don't trap users in /setup
          setOnboardingCompleted(true);
          return;
        }

        // null profile or null field → treat as completed (safe default)
        setOnboardingCompleted(data?.onboarding_completed ?? true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOnboarding();
    return () => { cancelled = true; };
  }, [user?.id]); // re-run only if user id changes

  return { onboardingCompleted, loading };
}