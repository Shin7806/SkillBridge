import { supabase } from "../lib/supabase";
import type { Skill } from "../types/tables";

export async function getAllSkills(): Promise<Skill[]> {
  const { data, error } = await supabase
    .from("skills")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data as Skill[]) ?? [];
}

