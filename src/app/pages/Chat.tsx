import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Card } from "../components/Card";
import { Send, Search, MoreVertical, Loader2 } from "lucide-react";
import { getMessagesByRequest, sendMessage, getMyRequests } from "../../services";
import { requireAuthUserId } from "../../lib/requireAuth";
import type { Message, SwapRequest } from "../../types/tables";

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<SwapRequest[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load current user ID
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userId = await requireAuthUserId();
        setCurrentUserId(userId);
      } catch (err) {
        console.error("[Chat] Failed to get current user:", err);
      }
    };
    loadUser();
  }, []);

  // Load conversations (accepted swap requests)
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoadingConversations(true);
        const data = await getMyRequests();
        // Show accepted requests as available conversations, AND the currently active request
        const accepted = data.filter((r) => r.status === "accepted" || r.id === id);
        setConversations(accepted);
      } catch (err) {
        console.error("[Chat] Failed to load conversations:", err);
      } finally {
        setLoadingConversations(false);
      }
    };
    loadConversations();
  }, []);

  // Load messages when conversation (request) changes
  useEffect(() => {
    if (!id) return;

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const data = await getMessagesByRequest(id);
        setMessages(data);
      } catch (err) {
        console.error("[Chat] Failed to load messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !id || sendingMessage) return;

    try {
      setSendingMessage(true);
      const newMessage = await sendMessage({ request_id: id, content: message.trim() });
      console.log("Message sent:", newMessage.id);

      // Append to local state — do NOT refetch the entire list
      setMessages((prev) => [...prev, newMessage]);
      setMessage(""); // clear input field
    } catch (err) {
      console.error("[Chat] Failed to send message:", err);
    } finally {
      setSendingMessage(false);
    }
  };

  const getOtherPartyId = (request: SwapRequest) => {
    if (!currentUserId) return request.sender_id;
    return request.sender_id === currentUserId ? request.receiver_id : request.sender_id;
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const otherId = getOtherPartyId(conv);
    return otherId.toLowerCase().includes(q);
  });

  const activeConversation = conversations.find((c) => c.id === id) || conversations[0];

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Conversations List */}
      <aside className="w-80 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No conversations yet. Accept a swap request to start chatting.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const otherId = getOtherPartyId(conv);
              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-background transition-colors border-b border-slate-100 ${
                    conv.id === id ? "bg-muted" : ""
                  }`}
                >
                  <div className="size-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                    {otherId.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-foreground">
                        {otherId.substring(0, 8)}...
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(conv.updated_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.message || "Swap request accepted"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              {activeConversation
                ? getOtherPartyId(activeConversation).substring(0, 2).toUpperCase()
                : "?"}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {activeConversation
                  ? `${getOtherPartyId(activeConversation).substring(0, 8)}...`
                  : "Select a conversation"}
              </h3>
              <p className="text-sm text-muted-foreground">Active now</p>
            </div>
          </div>
          <button
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="size-5 text-muted-foreground" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : !id ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a conversation to start chatting
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No messages yet. Send the first one!
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-md ${
                    msg.sender_id === currentUserId
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  } rounded-2xl px-4 py-2`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.sender_id === currentUserId ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {formatTimestamp(msg.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-card border-t border-border p-4">
          <form onSubmit={handleSend} className="flex gap-3">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
              disabled={!id}
            />
            <Button type="submit" variant="primary" aria-label="Send message" disabled={!id || sendingMessage}>
              {sendingMessage ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Send className="size-5" />
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
