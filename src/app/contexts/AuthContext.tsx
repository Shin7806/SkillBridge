import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
});

/**
 * Only creates a profile if one doesn't exist yet.
 * NEVER overwrites existing profiles — this was resetting onboarding_completed to false.
 */
async function ensureProfileExists(user: User) {
  try {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existing) return; // Already exists — do nothing

    const meta = user.user_metadata ?? {};
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: meta.full_name || meta.name || null,
      avatar_url: meta.avatar_url || meta.picture || null,
      username: null,
      bio: null,
      headline: null,
      onboarding_completed: false,
    });

    if (error) {
      console.error("[Auth] insert profile failed:", error);
    } else {
      console.log("[Auth] New profile created:", user.id);
    }
  } catch (err) {
    console.error("[Auth] ensureProfileExists failed:", err);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        setLoading(false);

        if (data.session?.user) {
          ensureProfileExists(data.session.user);
        }
      })
      .catch((err) => {
        console.error("[Auth] getSession failed:", err);
        setSession(null);
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setLoading(false);

        if (
          newSession?.user &&
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
        ) {
          ensureProfileExists(newSession.user);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}