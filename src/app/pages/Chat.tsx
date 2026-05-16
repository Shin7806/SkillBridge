import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Send, Search, Loader2, ArrowLeft, Bell } from "lucide-react";
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  markMessagesAsRead, 
  ConversationPreview 
} from "../../services/messages";
import { requireAuthUserId } from "../../lib/requireAuth";
import type { Message } from "../../types/tables";
import { getAvatarUrl } from "../../utils/avatar";
import { supabase } from "../../lib/supabase";

// For the real-time toast
import { toast } from "react-hot-toast";

export default function Chat() {
  const { id } = useParams(); // id is conversationId
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("user");
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load current user
  useEffect(() => {
    requireAuthUserId().then(id => setCurrentUserId(id)).catch(console.error);
  }, []);

  // Handle ?user= query parameter to auto-create/select conversation
  useEffect(() => {
    if (targetUserId) {
      const initConv = async () => {
        try {
          const conversation = await getOrCreateConversation(targetUserId);
          if (!conversation?.id) {
            throw new Error("Conversation not created");
          }
          console.log("CONVERSATION RESULT:", conversation);
          navigate(`/chat/${conversation.id}`, { replace: true });
        } catch (err) {
          console.error("Failed to create conversation:", err);
        }
      };
      initConv();
    }
  }, [targetUserId, navigate]);

  // Fetch initial conversations
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

  // Fetch messages when conversation changes
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
        
        // Mark as read
        await markMessagesAsRead(id);
        
        // Update local unread count
        setConversations(prev => prev.map(c => 
          c.id === id ? { ...c, unreadCount: 0 } : c
        ));
      } catch (err) {
        console.error("[Chat] Failed to load messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessagesAndMarkRead();
  }, [id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime Subscription
  useEffect(() => {
    if (!currentUserId || !id) return;

    const channel = supabase
      .channel('chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          
          setMessages(prev => [...prev, newMsg]);
          
          if (newMsg.receiver_id === currentUserId) {
            await markMessagesAsRead(id);
          }

          // Update conversations list preview
          setConversations(prev => {
            const convIndex = prev.findIndex(c => c.id === id);
            if (convIndex >= 0) {
              const updatedConvs = [...prev];
              updatedConvs[convIndex] = {
                ...updatedConvs[convIndex],
                lastMessage: newMsg,
                unreadCount: 0
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

    const activeConv = conversations.find(c => c.id === id);
    if (!activeConv) return;

    try {
      setSendingMessage(true);
      const newMsg = await sendMessage(messageInput, activeConv.otherUser.id);
      
      // Append locally (realtime might also trigger, but we deduplicate if needed, 
      // though typically we just rely on local append and ignore realtime for our own msgs if handled properly. 
      // However, we just append locally for instant feedback.)
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setMessageInput("");
      
      // Update preview
      setConversations(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(c => c.id === id);
        if (idx >= 0) {
          updated[idx].lastMessage = newMsg;
          const [moved] = updated.splice(idx, 1);
          updated.unshift(moved);
        }
        return updated;
      });

    } catch (err: any) {
      console.error("[Chat] Failed to send message:", err);
      alert(err.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.otherUser.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.otherUser.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConversation = conversations.find((c) => c.id === id);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const formatPreviewTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return formatTime(dateStr);
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      
      {/* 
        Conversations List (LEFT PANEL)
        Visible on mobile if NO chat is selected.
        Visible on desktop always.
      */}
      <aside 
        className={`w-full md:w-80 lg:w-96 bg-card border-r border-border flex flex-col flex-shrink-0 ${id ? 'hidden md:flex' : 'flex'}`}
      >
        <div className="p-4 border-b border-border bg-card">
          <h2 className="text-xl font-bold text-foreground mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-transparent focus:bg-background"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="size-12 bg-muted rounded-full shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="size-8 text-slate-400" />
              </div>
              <p className="font-medium text-foreground">No conversations yet</p>
              <p className="text-sm mt-1">Connect with teachers or learners to start chatting.</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No results found.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const avatarUrl = getAvatarUrl(conv.otherUser.avatar_url);
              const initials = (conv.otherUser.full_name || conv.otherUser.id).substring(0, 2).toUpperCase();
              
              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b border-border ${
                    conv.id === id ? "bg-muted" : ""
                  }`}
                >
                  <div className="relative">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="size-12 rounded-full object-cover ring-1 ring-border" />
                    ) : (
                      <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm ring-1 ring-primary/20">
                        {initials}
                      </div>
                    )}
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold size-5 rounded-full flex items-center justify-center border-2 border-card">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`font-semibold truncate ${conv.unreadCount > 0 ? "text-foreground" : "text-foreground/90"}`}>
                        {conv.otherUser.full_name || "User"}
                      </p>
                      {conv.lastMessage && (
                        <span className={`text-xs flex-shrink-0 ml-2 ${conv.unreadCount > 0 ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                          {formatPreviewTime(conv.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {conv.lastMessage?.content || "Tap to chat"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* 
        Chat Area (RIGHT PANEL)
        Visible on mobile only if a chat is selected.
      */}
      <main className={`flex-1 flex flex-col bg-background relative ${!id ? 'hidden md:flex' : 'flex'}`}>
        {!id ? (
          <div className="hidden md:flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/10">
            <div className="size-20 rounded-full bg-muted flex items-center justify-center mb-6 ring-8 ring-background">
              <Send className="size-8 text-slate-400 ml-1" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">Your Messages</h3>
            <p className="text-sm max-w-[250px] text-center">Select a conversation from the sidebar to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="bg-card/80 backdrop-blur-md border-b border-border px-4 md:px-6 py-4 flex items-center gap-4 z-10">
              <button 
                onClick={() => navigate('/chat')}
                className="md:hidden p-2 -ml-2 hover:bg-muted rounded-full"
              >
                <ArrowLeft className="size-5" />
              </button>
              
              {activeConversation && (
                <>
                  <div className="relative flex-shrink-0">
                    {activeConversation.otherUser.avatar_url ? (
                      <img src={getAvatarUrl(activeConversation.otherUser.avatar_url)!} className="size-10 rounded-full object-cover" />
                    ) : (
                      <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {(activeConversation.otherUser.full_name || "U").substring(0,2).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-card rounded-full"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {activeConversation.otherUser.full_name || "User"}
                    </h3>
                    <p className="text-xs text-green-500 font-medium">Active now</p>
                  </div>
                </>
              )}
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <div className="p-4 rounded-full bg-muted mb-3">👋</div>
                  <p>Say hello 👋</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === currentUserId;
                  const showAvatar = !isMe && (idx === messages.length - 1 || messages[idx + 1].sender_id !== msg.sender_id);
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      {!isMe && (
                        <div className="w-8 flex-shrink-0 flex items-end">
                          {showAvatar && activeConversation?.otherUser.avatar_url && (
                            <img src={getAvatarUrl(activeConversation.otherUser.avatar_url)!} className="size-8 rounded-full object-cover" />
                          )}
                          {showAvatar && !activeConversation?.otherUser.avatar_url && (
                            <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {(activeConversation?.otherUser.full_name || "U").substring(0,2).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[75%] md:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`px-4 py-2.5 rounded-2xl ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-card border-t border-border p-3 md:p-4 pb-safe">
              <form onSubmit={handleSend} className="flex gap-2 items-center max-w-4xl mx-auto">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-muted/50 border-transparent focus:bg-background rounded-full px-5 py-3"
                  disabled={sendingMessage}
                  autoComplete="off"
                />
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="icon"
                  className="rounded-full size-12 shrink-0 transition-transform active:scale-95"
                  disabled={!messageInput.trim() || sendingMessage}
                >
                  {sendingMessage ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Send className="size-5 ml-1" />
                  )}
                </Button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
