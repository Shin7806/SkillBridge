import { useEffect, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as api from "./api";
import { supabase } from "./supabase";
import { displayName, errorMessage, isUuid } from "./utils";
import type { AppNotification, Message, NotificationType } from "./types";

// ── Queries ──────────────────────────────────────────────────────────────────
export const useSkills = () => useQuery({ queryKey: ["skills"], queryFn: api.listSkills, staleTime: 10 * 60_000 });
export const useCategories = () => useQuery({ queryKey: ["categories"], queryFn: api.listCategories, staleTime: Infinity });
export const useMatches = () => useQuery({ queryKey: ["matches"], queryFn: api.findMatches });
export const useExplore = (query: string, categoryId: string | null) =>
  useQuery({ queryKey: ["explore", query, categoryId], queryFn: () => api.explorePeople(query, categoryId), placeholderData: (prev) => prev });
export const usePerson = (id: string | undefined) =>
  useQuery({ queryKey: ["person", id], queryFn: () => api.getPerson(id!), enabled: isUuid(id) });
export const useSwaps = () => useQuery({ queryKey: ["swaps"], queryFn: api.listSwaps });
export const useSwap = (id: string | undefined) => useQuery({ queryKey: ["swap", id], queryFn: () => api.getSwap(id!), enabled: isUuid(id) });
export const useSessions = (swapId?: string) =>
  useQuery({ queryKey: swapId ? ["sessions", swapId] : ["sessions"], queryFn: () => api.listSessions(swapId) });
export const useAsks = () => useQuery({ queryKey: ["asks"], queryFn: api.listAsks });
export const useNotifications = () => useQuery({ queryKey: ["notifications"], queryFn: api.listNotifications });
export const useBlocked = () => useQuery({ queryKey: ["blocked"], queryFn: api.listBlocked });
export const usePublicStats = () => useQuery({ queryKey: ["stats"], queryFn: api.getPublicStats, staleTime: 5 * 60_000, retry: 1 });

export function useMessages(swapId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["messages", swapId],
    enabled: isUuid(swapId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => api.listMessages(swapId!, pageParam),
    // Pages are fetched newest-first; the "next" page is the one before the oldest message we hold.
    getNextPageParam: (lastPage) => (lastPage.length === api.MESSAGE_PAGE ? lastPage[0].created_at : undefined),
    select: (data) => [...data.pages].reverse().flat(),
  });
}

function appendMessage(queryClient: QueryClient, message: Message) {
  queryClient.setQueryData<InfiniteData<Message[], string | undefined>>(["messages", message.swap_id], (old) => {
    if (!old) return old;
    if (old.pages.some((page) => page.some((m) => m.id === message.id))) return old;
    const [newest, ...older] = old.pages;
    return { ...old, pages: [[...newest, message], ...older] };
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────
/**
 * One helper for every write: runs it, refreshes the listed queries, and reports failure as a toast.
 * Success feedback is left to the caller so nothing claims success that did not happen.
 */
export function useAction<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  options: { invalidate?: string[]; success?: string | ((result: TResult) => string | undefined); onSuccess?: (result: TResult, args: TArgs) => void } = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (result, args) => {
      await Promise.all((options.invalidate ?? []).map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
      const text = typeof options.success === "function" ? options.success(result) : options.success;
      if (text) toast.success(text);
      options.onSuccess?.(result, args);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

export function useSendMessage(swapId: string, senderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.sendMessage(swapId, senderId, body),
    onSuccess: (message) => {
      appendMessage(queryClient, message);
      queryClient.invalidateQueries({ queryKey: ["swaps"] });
    },
    onError: (err) => toast.error(errorMessage(err, "Your message was not sent. Try again.")),
  });
}

// ── Notifications as sentences ───────────────────────────────────────────────
const NOTIFICATION_TEXT: Record<NotificationType, string> = {
  swap_proposed: "proposed a swap with you",
  swap_accepted: "accepted your swap proposal",
  swap_declined: "declined your swap proposal",
  swap_ended: "ended your swap",
  message: "sent you a message",
  session_proposed: "suggested a session time",
  session_confirmed: "confirmed your session",
  session_declined: "can't make the session you suggested",
  session_rescheduled: "suggested a new time for a session",
  session_cancelled: "cancelled a session",
  session_completed: "marked a session as done",
  vouch_received: "vouched for your teaching",
};

export function describeNotification(n: Pick<AppNotification, "type" | "swap_id" | "actor">) {
  const who = displayName(n.actor?.full_name);
  const href =
    n.type === "vouch_received"
      ? "/profile"
      : !n.swap_id
        ? "/home"
        : n.type === "message"
          ? `/messages/${n.swap_id}`
          : n.type === "swap_proposed" || n.type === "swap_declined"
            ? "/swaps"
            : `/swaps/${n.swap_id}`;
  return { who, text: NOTIFICATION_TEXT[n.type] ?? "sent you an update", href };
}

// ── Realtime: one channel per signed-in user keeps every list fresh ──────────
export function useRealtime(userId: string, navigate: (to: string) => void) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const refresh = (...keys: string[]) => keys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));

    const channel = supabase
      .channel(`user:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        appendMessage(queryClient, payload.new as Message);
        refresh("swaps", "swap");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "swaps" }, () => refresh("swaps", "swap", "matches"))
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => refresh("sessions", "swaps", "swap"))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` }, async (payload) => {
        refresh("notifications");
        const row = payload.new as { type: NotificationType; swap_id: string | null; actor_id: string | null };
        const { href, text } = describeNotification({ type: row.type, swap_id: row.swap_id, actor: null });
        // No toast for a message in the conversation you are already reading.
        if (row.type === "message" && window.location.pathname === href) return;
        const { data: actor } = row.actor_id
          ? await supabase.from("profiles").select("full_name").eq("id", row.actor_id).maybeSingle()
          : { data: null };
        toast(`${displayName(actor?.full_name)} ${text}`, { action: { label: "View", onClick: () => navigate(href) } });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, navigate]);
}

// ── Small UI hooks ───────────────────────────────────────────────────────────
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

export function useDebounced<T>(value: T, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · SkillBridge` : "SkillBridge";
  }, [title]);
}
