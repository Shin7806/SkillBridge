import { useEffect, useRef, useState } from "react";
import { Bell, Inbox, MessageSquare, Zap } from "lucide-react";
import { useUnreadMessages } from "../../hooks/useUnreadMessages";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { requireAuthUserId } from "../../lib/requireAuth";
import { toast } from "react-hot-toast";
import { getAvatarUrl } from "../../utils/avatar";

interface Notification {
  id: string;
  type: "message" | "match";
  title: string;
  message: string;
  time: string;
  rawDate: number;
  read: boolean;
  link?: string;
  senderName?: string;
  senderAvatar?: string | null;
  senderId?: string;
}

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const chatUnreadCount = useUnreadMessages();
  const unreadCount = notifications.filter((n) => !n.read).length + chatUnreadCount;

  /* ── Realtime: new messages ── */
  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      const userId = await requireAuthUserId();
      if (!mounted) return;

      channel = supabase
        .channel("notification-messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          async (payload) => {
            const msg = payload.new;
            if (msg.receiver_id !== userId) return;

            // Fetch sender profile for avatar + name
            let senderName = "Someone";
            let senderAvatar: string | null = null;
            let senderId = msg.sender_id;

            try {
              const { data: prof } = await supabase
                .from("profiles")
                .select("full_name, avatar_url")
                .eq("id", msg.sender_id)
                .maybeSingle();

              if (prof) {
                senderName = prof.full_name || "Someone";
                senderAvatar = prof.avatar_url || null;
              }
            } catch (_) { }

            const newNotif: Notification = {
              id: msg.id || String(Date.now()),
              type: "message",
              title: "New Message",
              message: msg.content?.length > 60
                ? msg.content.slice(0, 60) + "…"
                : msg.content,
              time: "Just now",
              rawDate: Date.now(),
              read: false,
              link: `/chat/${msg.conversation_id}`,
              senderName,
              senderAvatar,
              senderId,
            };

            if (mounted) {
              setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
            }

            toast.custom(() => (
              <div className="flex items-center gap-3 bg-card border border-border/60 rounded-xl px-4 py-3 shadow-xl backdrop-blur-sm max-w-xs">
                <Avatar name={senderName} avatarUrl={senderAvatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{senderName}</p>
                  <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                </div>
                <button
                  onClick={() => navigate(`/chat/${msg.conversation_id}`)}
                  className="text-xs font-semibold text-primary shrink-0 hover:opacity-70 transition-opacity"
                >
                  View
                </button>
              </div>
            ), { duration: 4000 });
          }
        )
        .subscribe();
    };

    setup();
    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  /* ── Close on outside click ── */
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      const handler = (e: MouseEvent) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node))
          setIsOpen(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  /* ── Close on Escape ── */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={panelRef}>

      {/* ── Bell trigger ── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative size-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        aria-label="Toggle notifications"
        aria-expanded={isOpen}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full ring-2 ring-background" />
        )}
      </button>

      {/* ── Dropdown panel ── */}
      <div
        className={`
          absolute right-0 top-full mt-2
          w-80 max-w-[calc(100vw-1.5rem)]
          bg-card/95 backdrop-blur-xl
          border border-border/50
          rounded-2xl shadow-2xl z-50 overflow-hidden
          origin-top-right transition-all duration-200
          ${isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
          }
        `}
        role="dialog"
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-red-500/15 text-red-500 px-2 py-0.5 rounded-full font-semibold">
                {unreadCount} new
              </span>
            )}
          </div>
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Body */}
        <div className="max-h-[340px] overflow-y-auto">
          {notifications.length === 0 && chatUnreadCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="size-11 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Inbox className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll notify you when something happens.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/30">

              {/* Unread chat count row (from useUnreadMessages hook) */}
              {chatUnreadCount > 0 && (
                <li
                  onClick={() => { setIsOpen(false); navigate("/chat"); }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer bg-primary/5"
                >
                  <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {chatUnreadCount} unread message{chatUnreadCount > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">Tap to open chats</p>
                  </div>
                  <span className="text-xs font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                  </span>
                </li>
              )}

              {/* Individual notifications */}
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => {
                    setIsOpen(false);
                    setNotifications((prev) =>
                      prev.map((x) => x.id === n.id ? { ...x, read: true } : x)
                    );
                    if (n.link) navigate(n.link);
                  }}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}
                >
                  {/* Sender avatar or type icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {n.senderName ? (
                      <Avatar name={n.senderName} avatarUrl={n.senderAvatar ?? null} size="md" />
                    ) : (
                      <div className="size-9 rounded-full bg-muted flex items-center justify-center">
                        <Zap className="size-4 text-primary" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {n.senderName || n.title}
                      </p>
                      {!n.read && (
                        <span className="size-1.5 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[10px] text-muted-foreground/60">{n.time}</p>
                      {n.link && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            navigate(n.link!);
                          }}
                          className="text-[10px] font-semibold text-primary hover:opacity-70 transition-opacity"
                        >
                          View →
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border/30 flex justify-center">
            <button
              onClick={() => { setIsOpen(false); navigate("/chat"); }}
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              View all messages
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Small reusable avatar ── */
function Avatar({
  name,
  avatarUrl,
  size = "md",
}: {
  name: string;
  avatarUrl: string | null;
  size?: "sm" | "md";
}) {
  const [err, setErr] = useState(false);
  const initials = name.substring(0, 2).toUpperCase();
  const processed = getAvatarUrl(avatarUrl);
  const sz = size === "sm" ? "size-8" : "size-9";

  return (
    <div className={`${sz} rounded-full overflow-hidden bg-primary/20 flex items-center justify-center flex-shrink-0 ring-1 ring-border/40`}>
      {processed && !err ? (
        <img
          src={processed}
          alt={name}
          className="size-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <span className="text-xs font-bold text-primary">{initials}</span>
      )}
    </div>
  );
}