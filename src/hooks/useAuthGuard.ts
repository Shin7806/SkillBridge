import { useEffect } from "react";
import { supabase } from "../lib/supabase";

/**
 * For protected (AppLayout) routes: redirect to /login if there is no session.
 *
 * NOTE: AppLayout now handles auth checks via AuthContext. This hook is kept
 * for backward compatibility and as a safety-net for sign-out events.
 */
export function useAuthGuard() {
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        window.location.replace("/login");
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);
}
