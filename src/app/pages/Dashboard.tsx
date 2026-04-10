import React from "react";
import { Link } from "react-router";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/Card";
import { Calendar, MessageSquare, Star, TrendingUp, Users, BookOpen } from "lucide-react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useProfile } from "../../hooks/useProfile";
import { getDisplayName } from "../../utils/avatar";

export default function Dashboard() {
  const user = useCurrentUser();
  const profile = useProfile(user?.id);
  const welcomeName = getDisplayName(user, profile);
  const stats = [
    { label: "Active Sessions", value: "3", icon: Calendar, color: "text-primary bg-muted" },
    { label: "Total Sessions", value: "24", icon: BookOpen, color: "text-accent bg-muted" },
    { label: "Skills Learning", value: "5", icon: TrendingUp, color: "text-green-600 bg-green-100" },
    { label: "Connections", value: "12", icon: Users, color: "text-blue-600 bg-blue-100" },
  ];

  const upcomingSessions = [
    {
      id: 1,
      title: "React Hooks Deep Dive",
      teacher: "Sarah Chen",
      date: "Tomorrow, 3:00 PM",
      duration: "60 min",
      avatar: "SC",
    },
    {
      id: 2,
      title: "Python for Data Science",
      teacher: "Alex Rivera",
      date: "Mar 18, 10:00 AM",
      duration: "90 min",
      avatar: "AR",
    },
    {
      id: 3,
      title: "UI/UX Design Principles",
      teacher: "Maya Patel",
      date: "Mar 20, 2:00 PM",
      duration: "60 min",
      avatar: "MP",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "session",
      text: "Completed session with Sarah Chen",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "message",
      text: "New message from Alex Rivera",
      time: "5 hours ago",
    },
    {
      id: 3,
      type: "review",
      text: "You received a 5-star review",
      time: "1 day ago",
    },
  ];

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
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-4 p-4 bg-background rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="size-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                    {session.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">{session.title}</h4>
                    <p className="text-sm text-muted-foreground">with {session.teacher}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{session.date}</p>
                    <p className="text-sm text-muted-foreground">{session.duration}</p>
                  </div>
                </div>
              ))}
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
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="size-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
