export type SkillType = "teach" | "learn";
export type SkillLevel = "beginner" | "intermediate" | "advanced";

export type SwapRequestStatus = "pending" | "accepted" | "rejected";
export type SessionStatus = "pending" | "confirmed" | "completed" | "cancelled";

// Keep these shapes aligned with your SQL column names (snake_case)
// so Supabase responses map directly into these types.

export type UUID = string;

export interface Profile {
  id: UUID;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  headline: string | null;
  onboarding_completed?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: UUID;
  name: string;
  created_at: string;
}

export interface UserSkill {
  id: UUID;
  user_id: UUID;
  skill_id: UUID;
  skill_type: SkillType;
  level: SkillLevel | null;
  created_at: string;
}

export interface SwapRequest {
  id: UUID;
  sender_id: UUID;
  receiver_id: UUID;
  offered_skill_id: UUID;
  requested_skill_id: UUID;
  message: string | null;
  status: SwapRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: UUID;
  request_id: UUID;
  sender_id: UUID;
  content: string;
  created_at: string;
}

export interface Session {
  id: UUID;
  request_id: UUID;
  created_by: UUID;
  scheduled_date: string; // date (YYYY-MM-DD) from Postgres
  scheduled_time: string; // time (HH:MM:SS) from Postgres
  duration_minutes: number;
  meeting_link: string | null;
  notes: string | null;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface MatchResult {
  user: Pick<Profile, "id" | "full_name" | "username" | "avatar_url" | "headline">;
  score: number;
  teachMatchCount: number;
  learnMatchCount: number;
}

