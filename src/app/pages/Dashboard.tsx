import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/Card";
import { Calendar, MessageSquare, Star, TrendingUp, Users, BookOpen, Loader2 } from "lucide-react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useProfile } from "../../hooks/useProfile";
import { getDisplayName } from "../../utils/avatar";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { getMyRequests, getUserSkills } from "../../services";
import type { SwapRequest, UserSkill } from "../../types/tables";
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

        const [requestsData, skillsData, { data: convData }, { count: reqCount }] = await Promise.all([
          getMyRequests(),
          getUserSkills(),
          supabase.from("conversations").select("*").or(`user_1.eq.${userId},user_2.eq.${userId}`),
          supabase.from("swap_requests").select("*", { count: "exact", head: true }).eq("requester_id", userId)
        ]);

        const uniqueUsers = new Set();
        convData?.forEach(c => {
          const other = c.user_1 === userId ? c.user_2 : c.user_1;
          uniqueUsers.add(other);
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

    // Setup realtime subscription for swap_requests
    let channel: ReturnType<typeof supabase.channel> | null = null;
    requireAuthUserId().then(userId => {
      channel = supabase
        .channel("dashboard-requests")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "swap_requests", filter: `requester_id=eq.${userId}` },
          () => {
            loadDashboardData();
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const skillsLearning = userSkills.filter((s) => s.skill_type === "learn").length;

  const stats = [
    { label: "Active Requests", value: String(activeRequestsCount), icon: Calendar, color: "text-primary bg-muted" },
    { label: "Total Courses (Chats)", value: String(totalChats), icon: BookOpen, color: "text-accent bg-muted" },
    { label: "Skills Learning", value: String(skillsLearning), icon: TrendingUp, color: "text-green-600 bg-green-100" },
    { label: "Connections", value: String(connections), icon: Users, color: "text-blue-600 bg-blue-100" },
  ];

  const currentRequests = requests
    .filter((r) => r.requester_id === currentUserId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 1);



  // Recent activity: derived from recent requests + sessions
  type ActivityItem = { id: string; type: string; text: string; time: string; rawDate: string };
  const recentActivity: ActivityItem[] = [];

  // Add recent requests as activity
  requests.slice(0, 3).forEach((r) => {
    const timeAgo = getTimeAgo(r.created_at);
    if (r.status === "accepted") {
      recentActivity.push({
        id: `req-${r.id}`,
        type: "session",
        text: "Swap request accepted",
        time: timeAgo,
        rawDate: r.created_at,
      });
    } else if (r.status === "pending") {
      recentActivity.push({
        id: `req-${r.id}`,
        type: "message",
        text: "New swap request pending",
        time: timeAgo,
        rawDate: r.created_at,
      });
    }
  });

  // Sort by most recent and limit to 5
  const sortedActivity = recentActivity
    .sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-10 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent blur-3xl -z-10 -m-8" />
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70 mb-3 tracking-tight">
          Welcome back, {welcomeName}!
        </h1>
        <p className="text-lg text-muted-foreground font-medium">Here's what's happening with your learning journey</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} variant="bordered" className="hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 border border-border/50 shadow-md hover:shadow-xl bg-card overflow-hidden group">
              <CardContent className="flex items-center gap-5 relative z-10 p-6">
                <div className={`size-14 rounded-2xl ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="size-7" />
                </div>
                <div>
                  <p className="text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Requests */}
        <div className="lg:col-span-2">
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Requests</CardTitle>
              </div>
              <CardDescription>Your active skill requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-muted/20 rounded-xl border border-dashed border-border">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Calendar className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No requests yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Check back later or start exploring.</p>
                </div>
              ) : (
                currentRequests.map((request: any) => (
                  <div
                    key={request.id}
                    className="p-5 bg-gradient-to-br from-background to-muted/30 border border-border/60 rounded-xl hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => navigate("/requests")}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">Skill Swap Request</h4>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary tracking-wide">
                        PENDING
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-card border border-border/50 rounded-lg shadow-sm">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Learning</p>
                        <p className="font-medium text-foreground truncate">{request.skill_learn || request.requested_skill?.name || "..."}</p>
                      </div>
                      <div className="p-3 bg-card border border-border/50 rounded-lg shadow-sm">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Teaching</p>
                        <p className="font-medium text-foreground truncate">{request.skill_teach || request.offered_skill?.name || "..."}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/matching" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="size-5 mr-2" />
                  Find Teachers
                </Button>
              </Link>
              <Link to="/chat" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="size-5 mr-2" />
                  Messages
                </Button>
              </Link>
              <Link to="/profile" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Star className="size-5 mr-2" />
                  Update Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sortedActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No recent activity
                </p>
              ) : (
                sortedActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="size-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-foreground">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}
