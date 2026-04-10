import { supabase } from "../lib/supabase";
import { requireAuthUserId } from "../lib/requireAuth";
import type { Message, UUID } from "../types/tables";

export async function getMessagesByRequest(request_id: UUID): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("request_id", request_id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as Message[]) ?? [];
}

export async function sendMessage(params: {
  request_id: UUID;
  content: string;
}): Promise<Message> {
  const senderId = await requireAuthUserId();
  const content = params.content.trim();
  if (content === "") throw new Error("Message content cannot be blank");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      request_id: params.request_id,
      sender_id: senderId,
      content,
    })
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Failed to send message");
  return data as Message;
}

