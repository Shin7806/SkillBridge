import { supabase } from "../lib/supabase";
import { requireAuthUserId } from "../lib/requireAuth";
import type { Message, Conversation, UUID } from "../types/tables";

// 1. CONVERSATION SYSTEM (MANDATORY)
export async function getOrCreateConversation(otherUserId: UUID): Promise<Conversation> {
  const currentUserId = await requireAuthUserId();

  // Query: Find conversation where (user_1 = me AND user_2 = otherUser) OR (user_1 = otherUser AND user_2 = me)
  const { data: existingConvs, error: findError } = await supabase
    .from("conversations")
    .select("*")
    .or(`and(user_1.eq.${currentUserId},user_2.eq.${otherUserId}),and(user_1.eq.${otherUserId},user_2.eq.${currentUserId})`);

  if (findError) throw findError;

  // If exists → return it
  if (existingConvs && existingConvs.length > 0) {
    return existingConvs[0] as Conversation;
  }

  // If not → insert new conversation
  const { data: newConv, error: insertError } = await supabase
    .from("conversations")
    .insert({
      user_1: currentUserId,
      user_2: otherUserId,
    })
    .select("*")
    .single();

  if (insertError) throw insertError;
  return newConv as Conversation;
}

// 2. SEND MESSAGE
export async function sendMessage(content: string, otherUserId: UUID): Promise<Message | undefined> {
  const currentUserId = await requireAuthUserId();
  const trimmedContent = content.trim();

  // Validate before insert
  if (!otherUserId) throw new Error("Missing receiver");
  if (!trimmedContent) return; // Silent return if empty per user instructions

  const conversation = await getOrCreateConversation(otherUserId);
  if (!conversation?.id) {
    throw new Error("Conversation not created");
  }

  console.log("USER:", currentUserId);
  console.log("OTHER:", otherUserId);
  console.log("CONVERSATION:", conversation.id);
  console.log("MESSAGE:", trimmedContent);

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content: trimmedContent,
      conversation_id: conversation.id,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error("SEND ERROR:", error);
    throw error; // Will be caught in Chat.tsx
  }
  return data as Message;
}

export type ConversationPreview = {
  id: string;
  otherUser: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  lastMessage: Message | null;
  unreadCount: number;
};

// 3. FETCH CONVERSATIONS LIST
export async function getConversations(): Promise<ConversationPreview[]> {
  const currentUserId = await requireAuthUserId();

  // Fetch all conversations where user is user_1 or user_2
  const { data: convs, error } = await supabase
    .from("conversations")
    .select(`
      id,
      user_1,
      user_2,
      created_at
    `)
    .or(`user_1.eq.${currentUserId},user_2.eq.${currentUserId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!convs || convs.length === 0) return [];

  // Need to join profiles for the other user, and fetch last message + unread count.
  const otherUserIds = convs.map(c => c.user_1 === currentUserId ? c.user_2 : c.user_1);

  // Fetch profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", otherUserIds);

  if (profilesError) throw profilesError;

  // Fetch all messages for these conversations to get last message and unread count
  const convIds = convs.map(c => c.id);
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });

  if (messagesError) throw messagesError;

  const result: ConversationPreview[] = convs.map(conv => {
    const otherUserId = conv.user_1 === currentUserId ? conv.user_2 : conv.user_1;
    const otherUserProfile = profiles?.find(p => p.id === otherUserId) || { id: otherUserId, full_name: "Unknown", avatar_url: null };
    
    const convMessages = messages?.filter(m => m.conversation_id === conv.id) || [];
    const lastMessage = convMessages.length > 0 ? convMessages[0] : null;
    const unreadCount = convMessages.filter(m => m.receiver_id === currentUserId && !m.is_read).length;

    return {
      id: conv.id,
      otherUser: otherUserProfile,
      lastMessage: lastMessage as Message | null,
      unreadCount,
    };
  });

  // Sort by last message created_at descending
  return result.sort((a, b) => {
    const timeA = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : new Date(convs.find(c => c.id === a.id)!.created_at).getTime();
    const timeB = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : new Date(convs.find(c => c.id === b.id)!.created_at).getTime();
    return timeB - timeA;
  });
}

// 4. FETCH MESSAGES (CHAT WINDOW)
export async function getMessages(conversationId: UUID): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Message[];
}

// 6. MARK AS READ
export async function markMessagesAsRead(conversationId: UUID): Promise<void> {
  const currentUserId = await requireAuthUserId();

  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", currentUserId)
    .eq("conversation_id", conversationId)
    .eq("is_read", false);

  if (error) throw error;
}

// 7. NOTIFICATION SYSTEM: UNREAD COUNT
export async function getUnreadCount(): Promise<number> {
  const currentUserId = await requireAuthUserId();

  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", currentUserId)
    .eq("is_read", false);

  if (error) throw error;
  return count || 0;
}
