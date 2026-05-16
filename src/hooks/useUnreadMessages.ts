import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getUnreadCount } from "../services/messages";
import { requireAuthUserId } from "../lib/requireAuth";

export function useUnreadMessages() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setup = async () => {
      try {
        const userId = await requireAuthUserId();
        if (!mounted) return;

        // Initial fetch
        const count = await getUnreadCount();
        if (mounted) setUnreadCount(count);

        // Subscribe to messages changes
        channel = supabase
          .channel("public:messages:unread")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "messages",
              filter: `receiver_id=eq.${userId}`,
            },
            async () => {
              // Just refetch the count on any change to our messages to be safe
              const newCount = await getUnreadCount();
              if (mounted) setUnreadCount(newCount);
            }
          )
          .subscribe();
      } catch (err) {
        console.error("Failed to setup unread messages subscription", err);
      }
    };

    setup();

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return unreadCount;
}
