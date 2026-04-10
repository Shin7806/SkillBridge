import { supabase } from "./supabase";
import type { UUID } from "../types/tables";

export async function requireAuthUserId(): Promise<UUID> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

