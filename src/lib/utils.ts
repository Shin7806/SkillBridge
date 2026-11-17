import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "./supabase";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function displayName(name?: string | null) {
  return name?.trim() || "SkillBridge member";
}

export function firstName(name?: string | null) {
  return name?.trim().split(/\s+/)[0] || "there";
}

/** `avatar_url` holds either a full URL (Google) or a path inside the avatars bucket. */
export function avatarSrc(value?: string | null) {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  return supabase.storage.from("avatars").getPublicUrl(value).data.publicUrl;
}

export const myTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" });
const dayYearFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

export function formatDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.round((startOfDay(d) - startOfDay(today)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.getFullYear() === today.getFullYear() ? dayFmt.format(d) : dayYearFmt.format(d);
}

export const formatDateTime = (iso: string) => `${formatDay(iso)}, ${formatTime(iso)}`;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDay(iso);
}

/** Value for <input type="datetime-local"> in the viewer's own timezone. */
export function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function sessionEnd(startsAt: string, minutes: number) {
  return new Date(new Date(startsAt).getTime() + minutes * 60_000);
}

/** Turns any thrown value into a sentence a person can act on. */
export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again.") {
  const raw = (err as { message?: string } | null)?.message ?? "";
  if (!raw) return fallback;
  if (/failed to fetch|networkerror|load failed/i.test(raw)) return "You seem to be offline. Check your connection and try again.";
  if (/invalid login credentials/i.test(raw)) return "That email and password don't match.";
  if (/email not confirmed/i.test(raw)) return "Confirm your email first. Check your inbox for the link.";
  if (/user already registered/i.test(raw)) return "An account with this email already exists. Try logging in.";
  if (/rate limit|too many requests/i.test(raw)) return "Too many attempts. Wait a minute and try again.";
  if (/row-level security|permission denied/i.test(raw)) return "You don't have permission to do that.";
  if (/violates check constraint|invalid input syntax/i.test(raw)) return "Some of that information isn't valid. Check it and try again.";
  if (/jwt|not authenticated|signed in/i.test(raw)) return "Your session has expired. Please log in again.";
  return raw;
}

export const isUuid = (v?: string | null): v is string =>
  !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** Only https links are accepted; returns null for anything else. */
export function cleanHttpsUrl(value: string) {
  const v = value.trim();
  if (!v) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Builds and downloads a calendar file for a confirmed session. */
export function downloadIcs(opts: { id: string; title: string; startsAt: string; minutes: number; url?: string | null; description?: string }) {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SkillBridge//Sessions//EN",
    "BEGIN:VEVENT",
    `UID:${opts.id}@skillbridge`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(new Date(opts.startsAt))}`,
    `DTEND:${fmt(sessionEnd(opts.startsAt, opts.minutes))}`,
    `SUMMARY:${esc(opts.title)}`,
    opts.description ? `DESCRIPTION:${esc(opts.description)}` : "",
    opts.url ? `URL:${opts.url}` : "",
    opts.url ? `LOCATION:${esc(opts.url)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = "skillbridge-session.ics";
  a.click();
  URL.revokeObjectURL(href);
}
