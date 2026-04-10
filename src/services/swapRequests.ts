import { supabase } from "../lib/supabase";
import { requireAuthUserId } from "../lib/requireAuth";
import type { SwapRequest, SwapRequestStatus, UUID } from "../types/tables";

export async function sendSwapRequest(params: {
  receiver_id: UUID;
  offered_skill_id: UUID;
  requested_skill_id: UUID;
  message?: string;
}): Promise<SwapRequest> {
  const senderId = await requireAuthUserId();

  if (params.receiver_id === senderId) throw new Error("Receiver must be different from sender");
  if (params.offered_skill_id === params.requested_skill_id) {
    throw new Error("Offered skill and requested skill must be different");
  }

  const message =
    params.message !== undefined ? (params.message.trim() === "" ? null : params.message) : null;

  const { data, error } = await supabase
    .from("swap_requests")
    .insert({
      sender_id: senderId,
      receiver_id: params.receiver_id,
      offered_skill_id: params.offered_skill_id,
      requested_skill_id: params.requested_skill_id,
      message,
      status: "pending",
    })
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Failed to create swap request");
  return data as SwapRequest;
}

export async function getMyRequests(): Promise<SwapRequest[]> {
  const userId = await requireAuthUserId();

  const { data, error } = await supabase
    .from("swap_requests")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as SwapRequest[]) ?? [];
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

