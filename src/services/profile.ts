import { supabase } from "../lib/supabase";
import { requireAuthUserId } from "../lib/requireAuth";
import type { Profile, UUID } from "../types/tables";

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

export async function updateMyProfile(values: {
  full_name?: string | null;
  username?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  headline?: string | null;
  onboarding_completed?: boolean;
}): Promise<Profile> {
  const userId: UUID = await requireAuthUserId();

  // Update first to respect the auto-created profile row and avoid duplicates.
  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", userId)
    .select("*")
    .maybeSingle();

  if (updateError) throw updateError;

  if (updated) return updated as Profile;

  // Fallback (should be rare if your signup trigger works).
  const { data: inserted, error: insertError } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...values }, { onConflict: "id" })
    .select("*")
    .maybeSingle();

  if (insertError) throw insertError;
  if (!inserted) throw new Error("Failed to update or create profile");
  return inserted as Profile;
}

