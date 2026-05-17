import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import {
  Calendar, MessageSquare, Star, TrendingUp,
  Users, BookOpen, Loader2, ArrowRight, Zap,
  Clock, CheckCircle2,
} from "lucide-react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useProfile } from "../../hooks/useProfile";
import { getDisplayName } from "../../utils/avatar";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { getMyRequests, getUserSkills } from "../../services";
import type { UserSkill } from "../../types/tables";
import { requireAuthUserId } from "../../lib/requireAuth";

export default function Dashboard() {
  const user = useCurrentUser();
  const { profile } = useProfile(user?.id);
  const welcomeName = getDisplayName(user, profile);

  const [requests, setRequests] = useState<any[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [totalChats, setTotalChats] = useState(0);
  const [activeRequestsCount, setActiveRequestsCount] = useState(0);
  const [connections, setConnections] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const userId = await requireAuthUserId();
        setCurrentUserId(userId);

        const [requestsData, skillsData, { data: convData }, { count: reqCount }] =
          await Promise.all([
            getMyRequests(),
            getUserSkills(),
            supabase
              .from("conversations")
              .select("*")
              .or(`user_1.eq.${userId},user_2.eq.${userId}`),
            supabase
              .from("swap_requests")
              .select("*", { count: "exact", head: true })
              .eq("requester_id", userId),
          ]);

        const uniqueUsers = new Set<string>();
        convData?.forEach((c) => {
          uniqueUsers.add(c.user_1 === userId ? c.user_2 : c.user_1);
        });

        setRequests(requestsData);
        setUserSkills(skillsData);
        setConnections(uniqueUsers.size);
        setTotalChats(uniqueUsers.size);
        setActiveRequestsCount(reqCount || 0);
      } catch (err) {
        console.error("[Dashboard] Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    requireAuthUserId().then((userId) => {
      channel = supabase
        .channel("dashboard-requests")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "swap_requests", filter: `requester_id=eq.${userId}` },
          () => loadDashboardData()
        )
        .subscribe();
    });

    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const skillsLearning = userSkills.filter((s) => s.skill_type === "learn").length;

  const stats = [
    { label: "Active Requests", value: activeRequestsCount, icon: Calendar, accent: "text-primary", bg: "bg-primary/10" },
    { label: "Total Chats", value: totalChats, icon: BookOpen, accent: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Skills Learning", value: skillsLearning, icon: TrendingUp, accent: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Connections", value: connections, icon: Users, accent: "text-sky-400", bg: "bg-sky-400/10" },
  ];

  const myRequests = requests
    .filter((r) => r.requester_id === currentUserId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  // Recent activity derived from requests
  type ActivityItem = { id: string; icon: typeof Clock; text: string; time: string; rawDate: string; color: string };
  const recentActivity: ActivityItem[] = requests
    .slice(0, 5)
    .flatMap((r): ActivityItem[] => {
      if (r.status === "accepted") {
        return [{ id: `req-${r.id}`, icon: CheckCircle2, text: "Swap request accepted", time: getTimeAgo(r.created_at), rawDate: r.created_at, color: "text-emerald-400" }];
      }
      if (r.status === "pending") {
        return [{ id: `req-${r.id}`, icon: Clock, text: "Swap request pending", time: getTimeAgo(r.created_at), rawDate: r.created_at, color: "text-amber-400" }];
      }
      return [];
    })
    .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())
    .slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm px-6 py-6 sm:py-7">
        {/* Decorative glow */}
        <div className="absolute -top-8 -right-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Dashboard</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-snug">
            Welcome back, <span className="text-primary">{welcomeName}</span>!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening with your learning journey.
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, accent, bg }) => (
          <div
            key={label}
            className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-4 sm:p-5 hover:-translate-y-0.5 hover:border-border/70 transition-all duration-200 group"
          >
            <div className={`size-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`size-4 ${accent}`} />
            </div>
            <p className={`text-2xl sm:text-3xl font-black ${accent}`}>{value}</p>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* ── Requests (2/3 width) ── */}
        <div className="lg:col-span-2 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
            <div>
              <h2 className="font-bold text-foreground text-sm">Requests</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Your active skill swaps</p>
            </div>
            <Link
              to="/requests"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-70 transition-opacity"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="p-4 space-y-3">
            {myRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed border-border/40 bg-muted/10">
                <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                  <Calendar className="size-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">No requests yet</p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-4">Start by finding a match.</p>
                <Link to="/matching">
                  <Button variant="outline" size="sm">Find Matches</Button>
                </Link>
              </div>
            ) : (
              myRequests.map((request: any) => {
                const statusColor =
                  request.status === "accepted" ? "bg-emerald-500/15 text-emerald-400" :
                    request.status === "rejected" ? "bg-red-500/15 text-red-400" :
                      "bg-primary/15 text-primary";

                return (
                  <div
                    key={request.id}
                    onClick={() => navigate("/requests")}
                    className="cursor-pointer rounded-xl border border-border/30 bg-background/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 p-4 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                        Skill Swap Request
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusColor}`}>
                        {request.status || "pending"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/20">
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Learning</p>
                        <p className="font-semibold text-foreground text-xs truncate">
                          {request.skill_learn || request.requested_skill?.name || "—"}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border/20">
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Teaching</p>
                        <p className="font-semibold text-foreground text-xs truncate">
                          {request.skill_teach || request.offered_skill?.name || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right column (1/3 width) ── */}
        <div className="space-y-4">

          {/* Quick Actions */}
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border/30">
              <Zap className="size-3.5 text-primary" />
              <h2 className="font-bold text-foreground text-sm">Quick Actions</h2>
            </div>
            <div className="p-2.5 space-y-0.5">
              {[
                { to: "/matching", icon: Users, label: "Find Teachers" },
                { to: "/chat", icon: MessageSquare, label: "Messages" },
                { to: "/profile", icon: Star, label: "Update Profile" },
              ].map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 hover:text-primary transition-colors group"
                >
                  <div className="size-7 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <Icon className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  {label}
                  <ArrowRight className="size-3 ml-auto text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border/30">
              <h2 className="font-bold text-foreground text-sm">Recent Activity</h2>
            </div>
            <div className="p-3 space-y-0.5">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((a) => {
                  const Icon = a.icon;
                  return (
                    <div key={a.id} className="flex items-start gap-3 px-2 py-2.5 rounded-xl hover:bg-muted/30 transition-colors">
                      <div className={`mt-0.5 size-6 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`size-3 ${a.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground leading-snug">{a.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{a.time}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffH = Math.floor(diffMins / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return diffD === 1 ? "1 day ago" : `${diffD} days ago`;
}