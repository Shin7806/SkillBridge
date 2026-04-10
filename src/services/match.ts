import { supabase } from "../lib/supabase";
import { requireAuthUserId } from "../lib/requireAuth";
import type { MatchResult, Profile, SkillType, UUID } from "../types/tables";

type UserSkillRow = {
  user_id: UUID;
  skill_id: UUID;
  skill_type: SkillType;
};

function intersectCount(a: Set<UUID>, rows: UserSkillRow[], requiredSkillType: SkillType) {
  let count = 0;
  const ids = new Set<UUID>();

  for (const r of rows) {
    if (r.skill_type !== requiredSkillType) continue;
    if (a.has(r.skill_id)) {
      count += 1;
      ids.add(r.skill_id);
    }
  }

  return { count, ids: Array.from(ids) };
}

export async function findMatches(params?: { limit?: number }): Promise<MatchResult[]> {
  const userId = await requireAuthUserId();
  const limit = params?.limit ?? 10;

  const { data: mySkills, error: mySkillsError } = await supabase
    .from("user_skills")
    .select("skill_id,skill_type")
    .eq("user_id", userId);

  if (mySkillsError) throw mySkillsError;

  const myTeachIds = new Set<UUID>();
  const myLearnIds = new Set<UUID>();

  for (const s of (mySkills ?? [])) {
    if (s.skill_type === "teach") myTeachIds.add(s.skill_id);
    if (s.skill_type === "learn") myLearnIds.add(s.skill_id);
  }

  if (myTeachIds.size === 0 || myLearnIds.size === 0) {
    // MVP: require both sides to provide a meaningful match score.
    return [];
  }

  const unionSkillIds = Array.from(new Set([...myTeachIds, ...myLearnIds]));

  const { data: otherSkills, error: otherSkillsError } = await supabase
    .from("user_skills")
    .select("user_id,skill_id,skill_type")
    .in("skill_id", unionSkillIds)
    .neq("user_id", userId);

  if (otherSkillsError) throw otherSkillsError;

  const byUser = new Map<UUID, UserSkillRow[]>();
  for (const row of (otherSkills as UserSkillRow[]) ?? []) {
    const list = byUser.get(row.user_id) ?? [];
    list.push(row);
    byUser.set(row.user_id, list);
  }

  const scored: Array<{
    user_id: UUID;
    score: number;
    teachMatchCount: number;
    learnMatchCount: number;
  }> = [];

  for (const [candidateId, rows] of byUser.entries()) {
    // Candidate teaches what I want to learn
    const teachRes = intersectCount(myLearnIds, rows, "teach");
    // Candidate learns what I teach
    const learnRes = intersectCount(myTeachIds, rows, "learn");

    const score = teachRes.count + learnRes.count;
    if (score <= 0) continue;

    scored.push({
      user_id: candidateId,
      score,
      teachMatchCount: teachRes.count,
      learnMatchCount: learnRes.count,
    });
  }

  scored.sort((a, b) => b.score - a.score || b.teachMatchCount - a.teachMatchCount);
  const top = scored.slice(0, limit);

  const candidateIds = top.map((t) => t.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id,full_name,username,avatar_url,headline")
    .in("id", candidateIds);

  if (profilesError) throw profilesError;

  const profileById = new Map<UUID, Profile>();
  for (const p of (profiles as Profile[]) ?? []) {
    profileById.set(p.id, p);
  }

  return top
    .map((t) => {
      const user = profileById.get(t.user_id);
      if (!user) return null;
      return {
        user: {
          id: user.id,
          full_name: user.full_name,
          username: user.username,
          avatar_url: user.avatar_url,
          headline: user.headline,
        },
        score: t.score,
        teachMatchCount: t.teachMatchCount,
        learnMatchCount: t.learnMatchCount,
      } satisfies MatchResult;
    })
    .filter(Boolean) as MatchResult[];
}

