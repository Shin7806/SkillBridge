import { supabase } from "../lib/supabase";

/**
 * After auth, send user to /setup (first-time) or /dashboard (returning).
 * Relies on profiles.onboarding_completed (see supabase/add_onboarding_completed.sql).
 */
export async function redirectUser() {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (!user) {
    window.location.replace("/login");
    return;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("redirectUser:", error);
    window.location.replace("/dashboard");
    return;
  }

  if (profile?.onboarding_completed !== true) {
    window.location.replace("/setup");
  } else {
    window.location.replace("/dashboard");
  }
}
