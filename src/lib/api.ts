// Every Supabase call the app makes lives here. Rules are enforced by the database;
// these functions only shape requests and surface errors.
import { supabase } from "./supabase";
import type {
  AppNotification,
  Ask,
  Category,
  Level,
  Message,
  Person,
  PersonCard,
  Profile,
  ProfileEdit,
  PublicStats,
  Session,
  Skill,
  Swap,
} from "./types";

type Result<T> = { data: T | null; error: { message: string } | null };

async function unwrap<T>(promise: PromiseLike<Result<T>>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data as T;
}

const rpc = <T>(fn: string, args?: Record<string, unknown>) => unwrap<T>(supabase.rpc(fn, args) as PromiseLike<Result<T>>);

// ── Auth ─────────────────────────────────────────────────────────────────────
const origin = () => window.location.origin;

export async function signUp(input: { name: string; email: string; password: string; organization?: string }) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: { data: { full_name: input.name.trim(), organization: input.organization?.trim() || undefined }, emailRedirectTo: `${origin()}/auth/callback` },
  });
  if (error) throw new Error(error.message);
  // With email confirmation on, Supabase returns a user with no identities for an address that already exists.
  if (data.user && data.user.identities?.length === 0) throw new Error("User already registered");
  return { needsConfirmation: !data.session };
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(error.message);
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin()}/auth/callback` } });
  if (error) throw new Error(error.message);
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${origin()}/reset-password` });
  if (error) throw new Error(error.message);
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function changePassword(email: string, current: string, next: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password: current });
  if (error) throw new Error("Your current password is incorrect.");
  await updatePassword(next);
}

/** Set on a deliberate sign-out so the next login starts at Home rather than the page that was open. */
export const SIGNED_OUT_FLAG = "skillbridge:signed-out";

export async function signOut() {
  sessionStorage.setItem(SIGNED_OUT_FLAG, "1");
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

// ── Profile ──────────────────────────────────────────────────────────────────
const PROFILE_COLUMNS =
  "id, full_name, headline, bio, avatar_url, location, organization, timezone, learning_goals, github_url, linkedin_url, is_discoverable, onboarding_completed, created_at";

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const found = await unwrap<Profile>(supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", userId).maybeSingle());
  if (found) return found;
  // The auth trigger normally creates the row. This covers accounts that predate it.
  return unwrap<Profile>(supabase.from("profiles").insert({ id: userId }).select(PROFILE_COLUMNS).single());
}

export const updateMyProfile = (userId: string, values: ProfileEdit) =>
  unwrap<Profile>(supabase.from("profiles").update(values).eq("id", userId).select(PROFILE_COLUMNS).single());

const AVATAR_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function uploadAvatar(userId: string, file: File, previous?: string | null) {
  const ext = AVATAR_TYPES[file.type];
  if (!ext) throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Choose an image under 2 MB.");
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  await updateMyProfile(userId, { avatar_url: path });
  if (previous && previous.startsWith(`${userId}/`)) await supabase.storage.from("avatars").remove([previous]);
  return path;
}

export const completeOnboarding = () => rpc<null>("complete_onboarding");

export async function deleteMyAccount(userId: string) {
  const { data: files } = await supabase.storage.from("avatars").list(userId);
  if (files?.length) await supabase.storage.from("avatars").remove(files.map((f) => `${userId}/${f.name}`));
  await rpc<null>("delete_my_account");
  await supabase.auth.signOut({ scope: "local" });
}

// ── Skills ───────────────────────────────────────────────────────────────────
export const listSkills = () => unwrap<Skill[]>(supabase.from("skills").select("id, name, category_id").order("name"));
export const listCategories = () => unwrap<Category[]>(supabase.from("skill_categories").select("id, name, slug").order("sort_order"));
export const addSkill = (name: string) => rpc<Skill>("add_skill", { p_name: name });

export interface SkillChoice {
  skill_id: string;
  level: Level | null;
}
export const setMySkills = (teach: SkillChoice[], learn: SkillChoice[]) => rpc<null>("set_my_skills", { p_teach: teach, p_learn: learn });

// ── People ───────────────────────────────────────────────────────────────────
export const findMatches = () => rpc<PersonCard[]>("find_matches").then((r) => r ?? []);
export const explorePeople = (query: string, categoryId: string | null) =>
  rpc<PersonCard[]>("explore_people", { p_query: query || null, p_category_id: categoryId }).then((r) => r ?? []);
export const getPerson = (userId: string) => rpc<Person | null>("get_person", { p_user: userId });

// ── Swaps ────────────────────────────────────────────────────────────────────
export const listSwaps = () => rpc<Swap[]>("my_swaps").then((r) => r ?? []);
export const getSwap = (id: string) => rpc<Swap[]>("my_swaps", { p_swap: id }).then((r) => r?.[0] ?? null);
export const proposeSwap = (input: { recipient: string; offered: string; requested: string; message: string; cadence: string }) =>
  rpc<string>("propose_swap", {
    p_recipient: input.recipient,
    p_offered_skill: input.offered,
    p_requested_skill: input.requested,
    p_message: input.message,
    p_cadence: input.cadence,
  });
export const respondToSwap = (id: string, accept: boolean) => rpc<null>("respond_to_swap", { p_swap: id, p_accept: accept });
export const cancelSwap = (id: string) => rpc<null>("cancel_swap", { p_swap: id });
export const endSwap = (id: string) => rpc<null>("end_swap", { p_swap: id });
export const markSwapRead = (id: string) => rpc<null>("mark_swap_read", { p_swap: id });

// ── Messages ─────────────────────────────────────────────────────────────────
export const MESSAGE_PAGE = 40;

/** Newest page first from the server; returned oldest-first for rendering. */
export async function listMessages(swapId: string, before?: string): Promise<Message[]> {
  let q = supabase.from("messages").select("id, swap_id, sender_id, body, created_at").eq("swap_id", swapId).order("created_at", { ascending: false }).limit(MESSAGE_PAGE);
  if (before) q = q.lt("created_at", before);
  const rows = await unwrap<Message[]>(q);
  return rows.reverse();
}

export const sendMessage = (swapId: string, senderId: string, body: string) =>
  unwrap<Message>(supabase.from("messages").insert({ swap_id: swapId, sender_id: senderId, body: body.trim() }).select("id, swap_id, sender_id, body, created_at").single());

// ── Sessions ─────────────────────────────────────────────────────────────────
const SESSION_COLUMNS =
  "id, swap_id, teacher_id, learner_id, skill_id, starts_at, duration_minutes, meeting_url, notes, proposed_by, status, created_at, skill:skills(name), teacher:profiles!sessions_teacher_id_fkey(id, full_name, avatar_url), learner:profiles!sessions_learner_id_fkey(id, full_name, avatar_url), vouches(id, from_id)";

export async function listSessions(swapId?: string): Promise<Session[]> {
  let q = supabase.from("sessions").select(SESSION_COLUMNS).order("starts_at", { ascending: true });
  if (swapId) q = q.eq("swap_id", swapId);
  return unwrap<Session[]>(q as unknown as PromiseLike<Result<Session[]>>);
}

export const proposeSession = (input: { swapId: string; teacherId: string; startsAt: string; minutes: number; meetingUrl: string | null; notes: string }) =>
  rpc<string>("propose_session", {
    p_swap: input.swapId,
    p_teacher: input.teacherId,
    p_starts_at: input.startsAt,
    p_duration: input.minutes,
    p_meeting_url: input.meetingUrl,
    p_notes: input.notes,
  });
export const respondToSession = (id: string, accept: boolean) => rpc<null>("respond_to_session", { p_session: id, p_accept: accept });
export const rescheduleSession = (id: string, startsAt: string, minutes: number) =>
  rpc<null>("reschedule_session", { p_session: id, p_starts_at: startsAt, p_duration: minutes });
export const setSessionLink = (id: string, url: string | null) => rpc<null>("set_session_link", { p_session: id, p_meeting_url: url });
export const cancelSession = (id: string) => rpc<null>("cancel_session", { p_session: id });
export const completeSession = (id: string) => rpc<null>("complete_session", { p_session: id });
export const addVouch = (sessionId: string, note: string) => rpc<string>("add_vouch", { p_session: sessionId, p_note: note });

// ── Asks ─────────────────────────────────────────────────────────────────────
const ASK_COLUMNS =
  "id, author_id, body, status, expires_at, created_at, wanted:skills!asks_wanted_skill_id_fkey(id, name), offered:skills!asks_offered_skill_id_fkey(id, name), author:profiles!asks_author_id_fkey(id, full_name, avatar_url, headline)";

export const listAsks = () =>
  unwrap<Ask[]>(supabase.from("asks").select(ASK_COLUMNS).order("created_at", { ascending: false }).limit(100) as unknown as PromiseLike<Result<Ask[]>>);
export const createAsk = (input: { authorId: string; wanted: string; offered: string | null; body: string }) =>
  unwrap<{ id: string }>(
    supabase.from("asks").insert({ author_id: input.authorId, wanted_skill_id: input.wanted, offered_skill_id: input.offered, body: input.body.trim() }).select("id").single(),
  );
export const closeAsk = (id: string) => unwrap<null>(supabase.from("asks").update({ status: "closed" }).eq("id", id));

// ── Notifications ────────────────────────────────────────────────────────────
export const listNotifications = () =>
  unwrap<AppNotification[]>(
    supabase
      .from("notifications")
      .select("id, type, swap_id, session_id, read_at, created_at, actor:profiles!notifications_actor_id_fkey(id, full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50) as unknown as PromiseLike<Result<AppNotification[]>>,
  );
export const markNotificationsRead = (ids?: string[]) => rpc<null>("mark_notifications_read", { p_ids: ids ?? null });

// ── Safety ───────────────────────────────────────────────────────────────────
export const blockUser = (userId: string) => rpc<null>("block_user", { p_user: userId });
export const unblockUser = (userId: string) => rpc<null>("unblock_user", { p_user: userId });
export const reportUser = (userId: string, reason: string, details: string) =>
  rpc<null>("report_user", { p_user: userId, p_reason: reason, p_details: details });

export async function listBlocked(): Promise<{ id: string; name: string | null }[]> {
  const rows = await unwrap<{ blocked_id: string; blocked: { full_name: string | null } | null }[]>(
    supabase.from("blocks").select("blocked_id, blocked:profiles!blocks_blocked_id_fkey(full_name)").order("created_at", { ascending: false }) as unknown as PromiseLike<
      Result<{ blocked_id: string; blocked: { full_name: string | null } | null }[]>
    >,
  );
  return rows.map((r) => ({ id: r.blocked_id, name: r.blocked?.full_name ?? null }));
}

// ── Public ───────────────────────────────────────────────────────────────────
export const getPublicStats = () => rpc<PublicStats>("public_stats");
