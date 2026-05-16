import { supabase } from "../lib/supabase";
import { requireAuthUserId } from "../lib/requireAuth";
import type { SwapRequest, SwapRequestStatus, UUID } from "../types/tables";

export async function sendSwapRequest(params: {
  receiver_id?: UUID | null;
  skill_teach: string;
  skill_learn: string;
  message?: string;
}): Promise<SwapRequest> {
  const senderId = await requireAuthUserId();

  if (params.receiver_id === senderId) throw new Error("Receiver must be different from sender");

  const message =
    params.message !== undefined ? (params.message.trim() === "" ? null : params.message) : null;

  const { data, error } = await supabase
    .from("swap_requests")
    .insert({
      requester_id: senderId,
      receiver_id: params.receiver_id || null,
      skill_teach: params.skill_teach,
      skill_learn: params.skill_learn,
      message,
      status: params.receiver_id ? "pending" : "open",
    })
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Failed to create swap request");
  return data as SwapRequest;
}

export async function getMyRequests(): Promise<any[]> {
  const userId = await requireAuthUserId();

  const { data, error } = await supabase
    .from("swap_requests")
    .select("*")
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const profileIds = new Set<string>();
  data.forEach((r) => {
    if (r.requester_id) profileIds.add(r.requester_id);
    if (r.receiver_id) profileIds.add(r.receiver_id);
  });

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, username")
    .in("id", Array.from(profileIds));

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  return data.map((r) => ({
    ...r,
    requester: profileMap.get(r.requester_id) || null,
    receiver: r.receiver_id ? profileMap.get(r.receiver_id) || null : null,
  }));
}

export async function updateRequestStatus(params: {
  request_id: UUID;
  status: Exclude<SwapRequestStatus, "pending">;
}): Promise<SwapRequest> {
  const { data: updated, error } = await supabase
    .from("swap_requests")
    .update({ status: params.status })
    .eq("id", params.request_id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!updated) throw new Error("Failed to update request status");
  return updated as SwapRequest;
}

export async function getSwapRequestById(id: UUID): Promise<any> {
  const { data, error } = await supabase
    .from("swap_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) return null;

  const profileIds = [];
  if (data.requester_id) profileIds.push(data.requester_id);
  if (data.receiver_id) profileIds.push(data.receiver_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, username")
    .in("id", profileIds);

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  return {
    ...data,
    requester: profileMap.get(data.requester_id) || null,
    receiver: data.receiver_id ? profileMap.get(data.receiver_id) || null : null,
  };
}
