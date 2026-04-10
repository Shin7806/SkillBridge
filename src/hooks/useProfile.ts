import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types/tables";

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error("useProfile:", error);
        setProfile(null);
        return;
      }
      setProfile(data as Profile | null);
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return profile;
}
