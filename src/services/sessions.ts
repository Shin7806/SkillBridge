import { supabase } from "../lib/supabase";
import { requireAuthUserId } from "../lib/requireAuth";
import type { Session, SessionStatus, UUID } from "../types/tables";

export async function createSession(params: {
  request_id: UUID;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // HH:MM:SS
  duration_minutes: number;
  meeting_link?: string | null;
  notes?: string | null;
  status?: SessionStatus; // defaults to 'pending'
}): Promise<Session> {
  const userId = await requireAuthUserId();

  if (params.duration_minutes <= 0 || params.duration_minutes > 480) {
    throw new Error("duration_minutes must be between 1 and 480");
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      request_id: params.request_id,
      created_by: userId,
      scheduled_date: params.scheduled_date,
      scheduled_time: params.scheduled_time,
      duration_minutes: params.duration_minutes,
      meeting_link: params.meeting_link ?? null,
      notes: params.notes ?? null,
      status: params.status ?? "pending",
    })
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Failed to create session");
  return data as Session;
}

export async function getMySessions(): Promise<Session[]> {
  const userId = await requireAuthUserId();

  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      swap_requests!inner (
        id,
        requester_id,
        receiver_id,
        offered_skill_id,
        requested_skill_id,
        status
      )
    `)
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`, {
      foreignTable: "swap_requests",
    })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Session[]) ?? [];
}

export async function updateSessionStatus(params: {
  session_id: UUID;
  status: SessionStatus;
}): Promise<Session> {
  const { data, error } = await supabase
    .from("sessions")
    .update({ status: params.status })
    .eq("id", params.session_id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Failed to update session status");
  return data as Session;
}
