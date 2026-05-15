import { supabase } from "../lib/supabase";
import { requireAuthUserId } from "../lib/requireAuth";
import type { SkillLevel, SkillType, UUID, UserSkill } from "../types/tables";

export type UserSkillInput = {
  skill_id: UUID;
  skill_type: SkillType;
  level?: SkillLevel | null;
};

export async function saveUserSkills(entries: UserSkillInput[]): Promise<UserSkill[]> {
  const userId = await requireAuthUserId();
  if (!entries.length) return [];

  const rows = entries.map((e) => ({
    user_id: userId,
    skill_id: e.skill_id,
    skill_type: e.skill_type,
    level: e.level ?? null,
  }));

  const { data, error } = await supabase
    .from("user_skills")
    .upsert(rows, { onConflict: "user_id,skill_id,skill_type" })
    .select("*");

  if (error) throw error;
  return (data as UserSkill[]) ?? [];
}

export async function getUserSkills(): Promise<UserSkill[]> {
  const userId = await requireAuthUserId();

  const { data, error } = await supabase
    .from("user_skills")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return (data as UserSkill[]) ?? [];
}

/**
 * Full sync: delete all existing user_skills, then insert the new set.
 * This ensures removed skills are actually deleted from the DB.
 */
export async function replaceUserSkills(entries: UserSkillInput[]): Promise<UserSkill[]> {
  const userId = await requireAuthUserId();

  // Step 1: Delete all existing skills for this user
  const { error: deleteError } = await supabase
    .from("user_skills")
    .delete()
    .eq("user_id", userId);

  if (deleteError) throw deleteError;

  // Step 2: Insert new skills
  if (!entries.length) return [];

  const rows = entries.map((e) => ({
    user_id: userId,
    skill_id: e.skill_id,
    skill_type: e.skill_type,
    level: e.level ?? null,
  }));

  const { data, error: insertError } = await supabase
    .from("user_skills")
    .insert(rows)
    .select("*");

  if (insertError) throw insertError;
  return (data as UserSkill[]) ?? [];
}

