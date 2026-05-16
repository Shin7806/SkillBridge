import { supabase } from "../lib/supabase";

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

  // 🔥 CRITICAL FIX
  if (!profile) {
    console.log("Profile not loaded → go dashboard (safe)");
    window.location.replace("/dashboard");
    return;
  }

  // 🔥 ONLY redirect if explicitly false
  if (profile.onboarding_completed === false) {
    window.location.replace("/setup");
  } else {
    window.location.replace("/dashboard");
  }
}