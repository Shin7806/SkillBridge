import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Send, Search, Loader2, ArrowLeft, MessageSquare, MoreVertical, Phone, Video } from "lucide-react";
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  ConversationPreview,
} from "../../services/messages";
import { requireAuthUserId } from "../../lib/requireAuth";
import type { Message } from "../../types/tables";
import { getAvatarUrl } from "../../utils/avatar";
import { supabase } from "../../lib/supabase";

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("user");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load current user
  useEffect(() => {
    requireAuthUserId()
      .then((id) => setCurrentUserId(id))
      .catch(console.error);
  }, []);

  // Handle ?user= query param
  useEffect(() => {
    if (targetUserId) {
      const initConv = async () => {
        try {
          const { getOrCreateConversation } = await import("../../services");
          const conversation = await getOrCreateConversation(targetUserId);
          if (!conversation?.id) throw new Error("Conversation not created");
          navigate(`/chat/${conversation.id}`, { replace: true });
        } catch (err) {
          console.error("Failed to create conversation:", err);
        }
      };
      initConv();
    }
  }, [targetUserId, navigate]);

  const fetchConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error("[Chat] Failed to load conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!id) {
      setMessages([]);
      return;
    }
    const loadMessagesAndMarkRead = async () => {
      try {
        setLoadingMessages(true);
        const data = await getMessages(id);
        setMessages(data);
        await markMessagesAsRead(id);
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        console.error("[Chat] Failed to load messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessagesAndMarkRead();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!currentUserId || !id) return;
    const channel = supabase
      .channel("chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          if (newMsg.receiver_id === currentUserId) {
            await markMessagesAsRead(id);
          }
          setConversations((prev) => {
            const convIndex = prev.findIndex((c) => c.id === id);
            if (convIndex >= 0) {
              const updatedConvs = [...prev];
              updatedConvs[convIndex] = {
                ...updatedConvs[convIndex],
                lastMessage: newMsg,
                unreadCount: 0,
              };
              const [movedConv] = updatedConvs.splice(convIndex, 1);
              updatedConvs.unshift(movedConv);
              return updatedConvs;
            } else {
              fetchConversations();
              return prev;
            }
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, id, navigate]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !id || sendingMessage || !currentUserId) return;
    const activeConv = conversations.find((c) => c.id === id);
    if (!activeConv) return;
    try {
      setSendingMessage(true);
      const newMsg = await sendMessage(messageInput, activeConv.otherUser.id);
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setMessageInput("");
      setConversations((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((c) => c.id === id);
        if (idx >= 0) {
          updated[idx].lastMessage = newMsg;
          const [moved] = updated.splice(idx, 1);
          updated.unshift(moved);
        }
        return updated;
      });
    } catch (err: any) {
      console.error("[Chat] Failed to send message:", err);
    } finally {
      setSendingMessage(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.otherUser.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.otherUser.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConversation = conversations.find((c) => c.id === id);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const formatPreviewTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return formatTime(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>(
    (acc, msg) => {
      const date = new Date(msg.created_at).toDateString();
      const last = acc[acc.length - 1];
      if (last && last.date === date) {
        last.msgs.push(msg);
      } else {
        acc.push({ date, msgs: [msg] });
      }
      return acc;
    },
    []
  );

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-background">

      {/* ═══════════════════════════════════════════
          LEFT PANEL — Conversations List
      ═══════════════════════════════════════════ */}
      <aside
        className={`
          flex-shrink-0 flex flex-col
          w-full md:w-80 lg:w-[340px]
          border-r border-border/50
          bg-background
          ${id ? "hidden md:flex" : "flex"}
        `}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Messages</h2>
            <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-full">
              {conversations.length}
            </span>
          </div>

          {/* Search */}
          <div
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 ${searchFocused
                ? "border-primary/50 bg-primary/5"
                : "border-border/50 bg-muted/40"
              }`}
          >
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="px-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 items-center animate-pulse py-2">
                  <div className="size-12 bg-muted rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted rounded-full w-2/5" />
                    <div className="h-3 bg-muted rounded-full w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center pb-16">
              <div className="size-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <MessageSquare className="size-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground text-sm mb-1">No conversations yet</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Find matches and start a conversation to begin learning.
              </p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No results for "{searchQuery}"
            </div>
          ) : (
            <div className="px-2 pb-2">
              {filteredConversations.map((conv) => {
                const avatarUrl = getAvatarUrl(conv.otherUser.avatar_url);
                const initials = (conv.otherUser.full_name || conv.otherUser.id)
                  .substring(0, 2)
                  .toUpperCase();
                const isActive = conv.id === id;
                const hasUnread = conv.unreadCount > 0;

                return (
                  <button
                    key={conv.id}
                    onClick={() => navigate(`/chat/${conv.id}`)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-xl
                      transition-all duration-150 group
                      ${isActive
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/60 border border-transparent"
                      }
                    `}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          className={`size-12 rounded-full object-cover ring-2 transition-all ${isActive ? "ring-primary/40" : "ring-transparent group-hover:ring-border"
                            }`}
                        />
                      ) : (
                        <div
                          className={`size-12 rounded-full flex items-center justify-center font-bold text-sm ring-2 transition-all ${isActive
                              ? "bg-primary/20 text-primary ring-primary/40"
                              : "bg-muted text-muted-foreground ring-transparent group-hover:ring-border"
                            }`}
                        >
                          {initials}
                        </div>
                      )}
                      {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 size-4 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                          <span className="text-[9px] font-bold text-primary-foreground">
                            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-0.5">
                        <p
                          className={`text-sm truncate ${hasUnread ? "font-bold text-foreground" : "font-medium text-foreground/90"
                            }`}
                        >
                          {conv.otherUser.full_name || "User"}
                        </p>
                        {conv.lastMessage && (
                          <span
                            className={`text-[11px] shrink-0 ml-2 ${hasUnread ? "text-primary font-semibold" : "text-muted-foreground"
                              }`}
                          >
                            {formatPreviewTime(conv.lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs truncate ${hasUnread ? "text-foreground/80 font-medium" : "text-muted-foreground"
                          }`}
                      >
                        {conv.lastMessage?.content || "Tap to chat"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ═══════════════════════════════════════════
          RIGHT PANEL — Chat Window
      ═══════════════════════════════════════════ */}
      <main
        className={`flex-1 flex flex-col bg-background overflow-hidden ${!id ? "hidden md:flex" : "flex"
          }`}
      >
        {!id ? (
          /* Empty state */
          <div className="hidden md:flex flex-col items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4 max-w-[260px] text-center">
              <div className="relative">
                <div className="size-20 rounded-2xl bg-muted/60 flex items-center justify-center">
                  <MessageSquare className="size-9 text-muted-foreground/60" />
                </div>
                <div className="absolute -bottom-1 -right-1 size-7 rounded-lg bg-primary flex items-center justify-center">
                  <Send className="size-3.5 text-primary-foreground ml-0.5" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Your Messages</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Select a conversation from the sidebar to start chatting
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── Chat Header ── */}
            <header className="flex items-center gap-3 px-4 md:px-5 py-3.5 border-b border-border/50 bg-background/95 backdrop-blur-md shrink-0">
              {/* Back button — mobile */}
              <button
                onClick={() => navigate("/chat")}
                className="md:hidden size-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors -ml-1"
              >
                <ArrowLeft className="size-5" />
              </button>

              {activeConversation ? (
                <>
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {activeConversation.otherUser.avatar_url ? (
                      <img
                        src={getAvatarUrl(activeConversation.otherUser.avatar_url)!}
                        className="size-10 rounded-full object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="size-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                        {(activeConversation.otherUser.full_name || "U").substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-background rounded-full" />
                  </div>

                  {/* Name + status */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {activeConversation.otherUser.full_name || "User"}
                    </h3>
                    <p className="text-[11px] text-green-500 font-medium">Active now</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="size-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                      <Phone className="size-4" />
                    </button>
                    <button className="size-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                      <Video className="size-4" />
                    </button>
                    <button className="size-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                      <MoreVertical className="size-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-10 flex items-center">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded-full" />
                </div>
              )}
            </header>

            {/* ── Messages Area ── */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-1">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-7 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Loading messages…</span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center text-2xl">
                    👋
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Start the conversation!
                  </p>
                </div>
              ) : (
                groupedMessages.map(({ date, msgs }) => (
                  <div key={date}>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-[11px] text-muted-foreground font-medium px-2 shrink-0">
                        {formatDateLabel(date)}
                      </span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>

                    <div className="space-y-1">
                      {msgs.map((msg, idx) => {
                        const isMe = msg.sender_id === currentUserId;
                        const nextMsg = msgs[idx + 1];
                        const prevMsg = msgs[idx - 1];
                        const isLastInGroup =
                          !nextMsg || nextMsg.sender_id !== msg.sender_id;
                        const isFirstInGroup =
                          !prevMsg || prevMsg.sender_id !== msg.sender_id;

                        // Bubble rounding: group consecutive messages
                        const myRadius = isFirstInGroup && isLastInGroup
                          ? "rounded-2xl rounded-br-md"
                          : isFirstInGroup
                            ? "rounded-2xl rounded-br-md rounded-b-lg"
                            : isLastInGroup
                              ? "rounded-2xl rounded-tr-md"
                              : "rounded-lg rounded-r-md";

                        const theirRadius = isFirstInGroup && isLastInGroup
                          ? "rounded-2xl rounded-bl-md"
                          : isFirstInGroup
                            ? "rounded-2xl rounded-bl-md rounded-b-lg"
                            : isLastInGroup
                              ? "rounded-2xl rounded-tl-md"
                              : "rounded-lg rounded-l-md";

                        return (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"
                              } ${isFirstInGroup ? "mt-3" : "mt-0.5"}`}
                          >
                            {/* Other user avatar — show on last message in group */}
                            {!isMe && (
                              <div className="size-7 shrink-0 mb-0.5">
                                {isLastInGroup ? (
                                  activeConversation?.otherUser.avatar_url ? (
                                    <img
                                      src={getAvatarUrl(activeConversation.otherUser.avatar_url)!}
                                      className="size-7 rounded-full object-cover"
                                      alt=""
                                    />
                                  ) : (
                                    <div className="size-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                      {(activeConversation?.otherUser.full_name || "U")
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </div>
                                  )
                                ) : null}
                              </div>
                            )}

                            <div
                              className={`flex flex-col max-w-[72%] md:max-w-[60%] ${isMe ? "items-end" : "items-start"
                                }`}
                            >
                              <div
                                className={`px-4 py-2.5 text-sm leading-relaxed break-words ${isMe
                                    ? `bg-primary text-primary-foreground ${myRadius}`
                                    : `bg-muted text-foreground ${theirRadius}`
                                  }`}
                              >
                                {msg.content}
                              </div>

                              {/* Timestamp — only on last in group */}
                              {isLastInGroup && (
                                <span className="text-[10px] text-muted-foreground mt-1.5 px-1">
                                  {formatTime(msg.created_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Area ── */}
            <div className="shrink-0 px-4 md:px-5 py-3 border-t border-border/50 bg-background/95 backdrop-blur-md">
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2.5 max-w-4xl mx-auto"
              >
                <div className="flex-1 flex items-center gap-2 bg-muted/60 border border-border/50 rounded-2xl px-4 py-2.5 transition-all focus-within:border-primary/40 focus-within:bg-muted/80">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message…"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sendingMessage}
                    autoComplete="off"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!messageInput.trim() || sendingMessage}
                  className={`
                    size-11 rounded-2xl flex items-center justify-center shrink-0
                    transition-all duration-200 active:scale-95
                    ${messageInput.trim() && !sendingMessage
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                    }
                  `}
                >
                  {sendingMessage ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4 ml-0.5" />
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}