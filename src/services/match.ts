import { supabase } from "../lib/supabase";
import { requireAuthUserId } from "../lib/requireAuth";
import type { UUID } from "../types/tables";

export async function findMatches(params?: { limit?: number }) {
  const userId = await requireAuthUserId();
  const limit = params?.limit ?? 50;

  // 1. Fetch profiles (include ALL needed fields)
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, headline, bio")
    .neq("id", userId)
    .limit(limit);

  if (profilesError) throw profilesError;

  if (!profiles || profiles.length === 0) return [];

  const candidateIds = profiles.map((p) => p.id);

  // 2. Fetch skills with proper join
  const { data: otherSkills, error: otherSkillsError } = await supabase
    .from("user_skills")
    .select(`
      user_id,
      skill_type,
      skills (
        name
      )
    `)
    .in("user_id", candidateIds);

  if (otherSkillsError) throw otherSkillsError;

  // 3. Group skills by user
  const teachByUser = new Map<UUID, string[]>();
  const learnByUser = new Map<UUID, string[]>();

  for (const row of otherSkills || []) {
    const skillName = (row.skills as any)?.name;
    if (!skillName) continue;

    if (row.skill_type === "teach") {
      const existing = teachByUser.get(row.user_id) || [];
      if (!existing.includes(skillName)) {
        teachByUser.set(row.user_id, [...existing, skillName]);
      }
    } else if (row.skill_type === "learn") {
      const existing = learnByUser.get(row.user_id) || [];
      if (!existing.includes(skillName)) {
        learnByUser.set(row.user_id, [...existing, skillName]);
      }
    }
  }

  // 4. Final mapping (THIS is what frontend MUST use)
  const results = profiles.map((p) => {
    const teachSkills = teachByUser.get(p.id) || [];
    const learnSkills = learnByUser.get(p.id) || [];

    return {
      user: {
        id: p.id,

        // ✅ CRITICAL: unified name field
        name: p.full_name || p.username || "User",

        full_name: p.full_name,
        username: p.username,
        avatar_url: p.avatar_url,
        headline: p.headline,
        bio: p.bio || "No bio available",
      },

      score: 0,

      teachSkills,
      learnSkills,

      teachMatchCount: teachSkills.length,
      learnMatchCount: learnSkills.length,
    };
  });

  return results;
}