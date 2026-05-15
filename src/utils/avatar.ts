import { supabase } from "../lib/supabase";

export function getAvatarUrl(path?: string | null) {
  if (!path) return null;

  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);

  return data.publicUrl;
}

export function getDisplayName(user: any, profile: any) {
  return (
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "User"
  );
}