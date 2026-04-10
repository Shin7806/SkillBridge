import { useState } from "react";
import { useParams } from "react-router";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Card } from "../components/Card";
import { Send, Search, MoreVertical } from "lucide-react";

const mockConversations = [
  {
    id: "1",
    name: "Sarah Chen",
    avatar: "SC",
    lastMessage: "That sounds great! Let's schedule for tomorrow.",
    timestamp: "2m ago",
    unread: 2,
  },
  {
    id: "2",
    name: "Alex Rivera",
    avatar: "AR",
    lastMessage: "I've sent you the resources we discussed.",
    timestamp: "1h ago",
    unread: 0,
  },
  {
    id: "3",
    name: "Maya Patel",
    avatar: "MP",
    lastMessage: "Thanks for the session! Really helpful.",
    timestamp: "3h ago",
    unread: 0,
  },
];

const mockMessages = [
  {
    id: 1,
    sender: "other",
    text: "Hi! I saw your request for learning React. I'd love to help!",
    timestamp: "10:30 AM",
  },
  {
    id: 2,
    sender: "me",
    text: "That's great! I'm especially interested in hooks and state management.",
    timestamp: "10:32 AM",
  },
  {
    id: 3,
    sender: "other",
    text: "Perfect! We can start with the basics and work our way up to more advanced patterns.",
    timestamp: "10:35 AM",
  },
  {
    id: 4,
    sender: "me",
    text: "Sounds good. When are you available?",
    timestamp: "10:36 AM",
  },
  {
    id: 5,
    sender: "other",
    text: "I'm free tomorrow evening or Saturday morning. What works best for you?",
    timestamp: "10:38 AM",
  },
  {
    id: 6,
    sender: "me",
    text: "Tomorrow evening works perfectly!",
    timestamp: "10:40 AM",
  },
  {
    id: 7,
    sender: "other",
    text: "That sounds great! Let's schedule for tomorrow.",
    timestamp: "10:41 AM",
  },
];

export default function Chat() {
  const { id } = useParams();
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const activeConversation = mockConversations.find((c) => c.id === id) || mockConversations[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    // Handle sending message
    setMessage("");
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
          {mockConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => window.location.href = `/chat/${conv.id}`}
              className={`w-full p-4 flex items-start gap-3 hover:bg-background transition-colors border-b border-slate-100 ${
                conv.id === id ? "bg-muted" : ""
              }`}
            >
              <div className="size-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                {conv.avatar}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-foreground">{conv.name}</p>
                  <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <div className="size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium flex-shrink-0">
                  {conv.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              {activeConversation.avatar}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{activeConversation.name}</h3>
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
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md ${
                  msg.sender === "me"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                } rounded-2xl px-4 py-2`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-card border-t border-border p-4">
          <form onSubmit={handleSend} className="flex gap-3">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="primary" aria-label="Send message">
              <Send className="size-5" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
