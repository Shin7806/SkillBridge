export type Level = "beginner" | "intermediate" | "advanced";
export type MatchKind = "two_way" | "can_teach_me" | "wants_my_skill";
export type SwapStatus = "proposed" | "accepted" | "declined" | "cancelled" | "ended";
export type SessionStatus = "proposed" | "confirmed" | "completed" | "cancelled";

export interface SkillRef {
  id: string;
  name: string;
  level?: Level | null;
}

export interface Skill {
  id: string;
  name: string;
  category_id: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  organization: string | null;
  timezone: string | null;
  learning_goals: string[];
  github_url: string | null;
  linkedin_url: string | null;
  is_discoverable: boolean;
  onboarding_completed: boolean;
  created_at: string;
}

export type ProfileEdit = Partial<
  Pick<
    Profile,
    | "full_name"
    | "headline"
    | "bio"
    | "avatar_url"
    | "location"
    | "organization"
    | "timezone"
    | "learning_goals"
    | "github_url"
    | "linkedin_url"
    | "is_discoverable"
  >
>;

export interface PersonCard {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  organization: string | null;
  teaches: SkillRef[];
  learns: SkillRef[];
  /** Skills they teach that I want to learn. */
  they_teach: SkillRef[];
  /** Skills I teach that they want to learn. */
  they_want: SkillRef[];
  kind?: MatchKind;
}

export interface Vouch {
  id: string;
  note: string | null;
  created_at: string;
  skill: string;
  from_id: string;
  from_name: string | null;
  from_avatar: string | null;
}

export interface Person extends PersonCard {
  learning_goals: string[];
  github_url: string | null;
  linkedin_url: string | null;
  timezone: string | null;
  is_discoverable: boolean;
  onboarding_completed: boolean;
  created_at: string;
  blocked_by_me: boolean;
  sessions_given: number;
  sessions_received: number;
  vouches: Vouch[];
  vouch_count: number;
}

export interface MiniProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline?: string | null;
  timezone?: string | null;
}

export interface Swap {
  id: string;
  status: SwapStatus;
  i_proposed: boolean;
  message: string | null;
  cadence: string | null;
  created_at: string;
  responded_at: string | null;
  ended_at: string | null;
  other: MiniProfile;
  i_teach: SkillRef;
  i_learn: SkillRef;
  last_message: { body: string; sender_id: string; created_at: string } | null;
  unread_count: number;
  next_session_at: string | null;
  sessions_to_answer: number;
  sessions_given: number;
  sessions_received: number;
  activity_at: string;
}

export interface Message {
  id: string;
  swap_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
}

export interface Session {
  id: string;
  swap_id: string;
  teacher_id: string;
  learner_id: string;
  skill_id: string;
  starts_at: string;
  duration_minutes: number;
  meeting_url: string | null;
  notes: string | null;
  proposed_by: string;
  status: SessionStatus;
  created_at: string;
  skill: { name: string } | null;
  teacher: MiniProfile | null;
  learner: MiniProfile | null;
  vouches: { id: string; from_id: string }[];
}

export interface Ask {
  id: string;
  author_id: string;
  body: string;
  status: "open" | "closed";
  expires_at: string;
  created_at: string;
  wanted: { id: string; name: string } | null;
  offered: { id: string; name: string } | null;
  author: MiniProfile | null;
}

export type NotificationType =
  | "swap_proposed"
  | "swap_accepted"
  | "swap_declined"
  | "swap_ended"
  | "message"
  | "session_proposed"
  | "session_confirmed"
  | "session_declined"
  | "session_rescheduled"
  | "session_cancelled"
  | "session_completed"
  | "vouch_received";

export interface AppNotification {
  id: string;
  type: NotificationType;
  swap_id: string | null;
  session_id: string | null;
  read_at: string | null;
  created_at: string;
  actor: MiniProfile | null;
}

export interface PublicStats {
  members: number;
  swaps: number;
  skills: number;
}

export const REPORT_REASONS = [
  { value: "inappropriate_content", label: "Inappropriate photo or text" },
  { value: "harassment", label: "Harassment or abuse" },
  { value: "spam", label: "Spam or advertising" },
  { value: "impersonation", label: "Pretending to be someone else" },
  { value: "safety", label: "I feel unsafe" },
  { value: "other", label: "Something else" },
] as const;

export const LEARNING_GOALS = [
  "Learn a new skill",
  "Improve existing skills",
  "Teach others",
  "Collaborate on projects",
] as const;

export const LEVELS: { value: Level; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];
