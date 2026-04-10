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

