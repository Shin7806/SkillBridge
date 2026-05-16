import { supabase } from "../lib/supabase";

/**
 * Resolves an avatar URL from a profile's `avatar_url` field.
 *
 * The field can contain:
 * 1. A full URL (from Google OAuth, starts with "http")
 * 2. A Supabase Storage path (e.g. "abc123.jpg")
 * 3. null/undefined → returns null (caller should show fallback initials)
 */
export function getAvatarUrl(path?: string | null): string | null {
  if (!path) return null;

  // If it's already a full URL (Google avatar, etc.), return as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Otherwise resolve from Supabase Storage
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export function getDisplayName(user: any, profile: any) {
  return (
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "User"
  );
}