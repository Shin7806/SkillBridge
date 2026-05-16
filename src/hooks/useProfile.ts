import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types/tables";

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("useProfile:", error);
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(data as Profile | null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let retryCount = 0;
    const maxRetries = 5;

    const loadWithRetry = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
        setLoading(false);
        return;
      }

      // 🔥 Retry if profile not yet created
      if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(loadWithRetry, 300);
      } else {
        setProfile(null);
        setLoading(false);
      }
    };

    loadWithRetry();
  }, [userId]);

  const refetch = useCallback(() => {
    return fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refetch };
}