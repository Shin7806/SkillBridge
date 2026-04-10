import { useEffect } from "react";
import { supabase } from "../lib/supabase";

/**
 * App shell: send users to /setup only until profiles.onboarding_completed is true.
 * Returning users who finished onboarding stay on app routes (e.g. /dashboard).
 */
export function useOnboarding() {
  useEffect(() => {
    let cancelled = false;

    const checkOnboarding = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;
      if (profile?.onboarding_completed !== true) {
        window.location.replace("/setup");
      }
    };

    const run = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      await checkOnboarding(user.id);
    };

    void run();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id;
      if (!uid) return;
      void checkOnboarding(uid);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);
}
