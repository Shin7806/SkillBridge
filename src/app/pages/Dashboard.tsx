import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/Card";
import { Calendar, MessageSquare, Star, TrendingUp, Users, BookOpen, Loader2 } from "lucide-react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useProfile } from "../../hooks/useProfile";
import { getDisplayName } from "../../utils/avatar";
import { useState, useEffect } from "react";
import { getMySessions, getMyRequests, getUserSkills } from "../../services";
import type { Session, SwapRequest, UserSkill } from "../../types/tables";
import { requireAuthUserId } from "../../lib/requireAuth";

export default function Dashboard() {
  const user = useCurrentUser();
  const profile = useProfile(user?.id);
  const welcomeName = getDisplayName(user, profile);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const userId = await requireAuthUserId();
        setCurrentUserId(userId);

        const [sessionsData, requestsData, skillsData] = await Promise.all([
          getMySessions(),
          getMyRequests(),
          getUserSkills(),
        ]);

        setSessions(sessionsData);
        setRequests(requestsData);
        setUserSkills(skillsData);
        console.log("[Dashboard] Data loaded:", {
          sessions: sessionsData.length,
          requests: requestsData.length,
          skills: skillsData.length,
        });
      } catch (err) {
        console.error("[Dashboard] Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // Compute stats from real data
  const activeSessions = sessions.filter(
    (s) => s.status === "pending" || s.status === "confirmed"
  ).length;
  const totalSessions = sessions.length;
  const skillsLearning = userSkills.filter((s) => s.skill_type === "learn").length;

  // Connections: unique other-party user IDs from swap requests
  const connectionIds = new Set<string>();
  if (currentUserId) {
    requests.forEach((r) => {
      if (r.sender_id === currentUserId) connectionIds.add(r.receiver_id);
      else connectionIds.add(r.sender_id);
    });
  }
  const connections = connectionIds.size;

  const stats = [
    { label: "Active Sessions", value: String(activeSessions), icon: Calendar, color: "text-primary bg-muted" },
    { label: "Total Sessions", value: String(totalSessions), icon: BookOpen, color: "text-accent bg-muted" },
    { label: "Skills Learning", value: String(skillsLearning), icon: TrendingUp, color: "text-green-600 bg-green-100" },
    { label: "Connections", value: String(connections), icon: Users, color: "text-blue-600 bg-blue-100" },
  ];

  // Upcoming sessions: non-completed, latest 3
  const upcomingSessions = sessions
    .filter((s) => s.status === "pending" || s.status === "confirmed")
    .slice(0, 3);

  const formatSessionDate = (session: Session) => {
    const date = new Date(session.scheduled_date);
    const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const time = session.scheduled_time.substring(0, 5);
    return `${day}, ${time}`;
  };

  // Recent activity: derived from recent requests + sessions
  type ActivityItem = { id: string; type: string; text: string; time: string };
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
      });
    } else if (r.status === "pending") {
      recentActivity.push({
        id: `req-${r.id}`,
        type: "message",
        text: "New swap request pending",
        time: timeAgo,
      });
    }
  });

  // Add recent sessions as activity
  sessions.slice(0, 2).forEach((s) => {
    recentActivity.push({
      id: `ses-${s.id}`,
      type: "session",
      text: s.status === "completed" ? "Completed a session" : "Session scheduled",
      time: getTimeAgo(s.created_at),
    });
  });

  // Sort by most recent and limit to 5
  const sortedActivity = recentActivity.slice(0, 5);

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {welcomeName}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your learning journey</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} variant="bordered">
              <CardContent className="flex items-center gap-4">
                <div className={`size-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <Icon className="size-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Sessions */}
        <div className="lg:col-span-2">
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Sessions</CardTitle>
                <Link to="/sessions">
                  <Button variant="ghost" size="sm">
                    View all
                  </Button>
                </Link>
              </div>
              <CardDescription>Your scheduled learning sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No upcoming sessions. Accept a request to get started!
                </p>
              ) : (
                upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-4 p-4 bg-background rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="size-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                      {session.created_by.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground">Session</h4>
                      <p className="text-sm text-muted-foreground">Status: {session.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{formatSessionDate(session)}</p>
                      <p className="text-sm text-muted-foreground">{session.duration_minutes} min</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter>
              <Link to="/request" className="w-full">
                <Button variant="outline" className="w-full">
                  Request New Session
                </Button>
              </Link>
            </CardFooter>
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
