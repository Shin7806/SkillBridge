import type { User } from "@supabase/supabase-js";
import type { Profile } from "../types/tables";

/** Merged display name: DB profile → Google metadata → email local-part → fallback */
export function getDisplayName(user: User | null, profile: Profile | null): string {
  if (profile?.full_name?.trim()) return profile.full_name.trim();
  const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
  if (meta?.full_name?.trim()) return meta.full_name.trim();
  if (meta?.name?.trim()) return meta.name.trim();
  if (user?.email) return user.email.split("@")[0] ?? "User";
  return "User";
}

/** Prefer stored profile URL, then OAuth provider image */
export function getMergedAvatarUrl(user: User | null, profile: Profile | null): string | undefined {
  if (profile?.avatar_url?.trim()) return profile.avatar_url.trim();
  const meta = user?.user_metadata as { avatar_url?: string; picture?: string } | undefined;
  if (meta?.avatar_url?.trim()) return meta.avatar_url.trim();
  if (meta?.picture?.trim()) return meta.picture.trim();
  return undefined;
}

/**
 * Returns a usable image URL: real avatar, or ui-avatars fallback (grey initials).
 */
export function getAvatarUrl(avatarUrl?: string | null, name?: string | null): string {
  if (avatarUrl?.trim()) return avatarUrl.trim();

  const initials = name?.trim()
    ? name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 3)
    : "U";

  const safe = encodeURIComponent(initials || "U");
  return `https://ui-avatars.com/api/?name=${safe}&background=444&color=fff&size=128`;
}

/** Convenience: merged OAuth + profile + fallback image */
export function getAvatarUrlForUser(user: User | null, profile: Profile | null): string {
  const merged = getMergedAvatarUrl(user, profile);
  const displayName = getDisplayName(user, profile);
  return getAvatarUrl(merged, displayName);
}
