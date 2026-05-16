import { useEffect, useRef, useState } from "react";
import { Bell, Inbox } from "lucide-react";
import { useUnreadMessages } from "../../hooks/useUnreadMessages";

import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { requireAuthUserId } from "../../lib/requireAuth";
import { toast } from "react-hot-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

export function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const chatUnreadCount = useUnreadMessages();

  const unreadCount = notifications.filter((n) => !n.read).length + chatUnreadCount;

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      const userId = await requireAuthUserId();
      if (!mounted) return;

      channel = supabase
        .channel("global-messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            const msg = payload.new;

            if (msg.receiver_id === userId) {
              // 🔔 Notification
              toast("New message received");

              setNotifications((prev) => [
                {
                  id: msg.id || String(Date.now()),
                  title: "New Message",
                  message: msg.content,
                  time: "Just now",
                  read: false,
                  link: `/chat/${msg.conversation_id}`
                },
                ...prev,
              ]);
            }
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

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    // Defer listener to avoid catching the opening click
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell trigger */}
      <button
        id="notification-bell"
        onClick={() => setIsOpen((v) => !v)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Toggle notifications"
        aria-expanded={isOpen}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[20px] font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <div
        className={`absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden origin-top-right transition-all duration-200 ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
        role="dialog"
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
              {unreadCount} new
            </span>
          )}
        </div>

        {/* Body */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <Inbox className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground">
                You're all caught up! We'll notify you when something happens.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => {
                    setIsOpen(false);
                    if (n.link) navigate(n.link);
                  }}
                  className={`px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!n.read && (
                      <span className="mt-1.5 size-2 bg-primary rounded-full shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {n.time}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
