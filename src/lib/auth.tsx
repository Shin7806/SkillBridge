import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { getMyProfile } from "./api";
import type { Profile } from "./types";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** True until we know whether someone is signed in and, if so, have their profile. */
  loading: boolean;
  profileError: Error | null;
  refreshProfile: () => Promise<unknown>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setReady(true));

    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setReady(true);
      if (event === "SIGNED_OUT") queryClient.clear();
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user.id;
  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getMyProfile(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      profile: profileQuery.data ?? null,
      loading: !ready || (!!userId && profileQuery.isPending),
      profileError: (profileQuery.error as Error | null) ?? null,
      refreshProfile: () => profileQuery.refetch(),
    }),
    [session, ready, userId, profileQuery],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/** For screens behind the auth guard, where a user is guaranteed. */
export function useMe() {
  const { user, profile } = useAuth();
  if (!user || !profile) throw new Error("useMe used outside a signed-in route");
  return { user, profile };
}
