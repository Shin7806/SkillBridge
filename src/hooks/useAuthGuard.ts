import { useEffect } from "react";
import { supabase } from "../lib/supabase";

/**
 * For protected (AppLayout) routes: redirect to /login if there is no session.
 */
export function useAuthGuard() {
  useEffect(() => {
    let cancelled = false;

    const ensureSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        window.location.replace("/login");
      }
    };

    void ensureSession();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        window.location.replace("/login");
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);
}
