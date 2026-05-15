import { supabase } from "../lib/supabase";
import { requireAuthUserId } from "../lib/requireAuth";
import type { Profile, UUID } from "../types/tables";

// GET MY PROFILE
export async function getMyProfile(): Promise<Profile | null> {
  const userId: UUID = await requireAuthUserId();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return (data as Profile | null) ?? null;
}

// UPDATE PROFILE
export async function updateMyProfile(values: {
  full_name?: string | null;
  username?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  headline?: string | null;
}): Promise<Profile> {
  const userId: UUID = await requireAuthUserId();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;

  return data as Profile;
}

// GET PROFILE BY ID (used by MatchProfile page)
export async function getProfileById(userId: UUID): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as Profile | null) ?? null;
}

// GET USER SKILLS BY ID (used by MatchProfile page)
export async function getUserSkillsById(userId: UUID) {
  const { data, error } = await supabase
    .from("user_skills")
    .select(`
      *,
      skills (
        name
      )
    `)
    .eq("user_id", userId);

  if (error) throw error;
  return data ?? [];
}