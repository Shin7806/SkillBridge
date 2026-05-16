import { useAuth } from "../app/contexts/AuthContext";

/**
 * Returns the current Supabase user from the shared AuthContext.
 *
 * This is a convenience wrapper around useAuth().user for pages
 * that only need the user object (Dashboard, Profile, Settings).
 */
export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}
