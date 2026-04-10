import { Link } from "react-router";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/Card";
import { Calendar, Clock, Video, Star, Plus } from "lucide-react";
import { useState } from "react";

const mockSessions = [
  {
    id: 1,
    title: "React Hooks Deep Dive",
    partner: "Sarah Chen",
    avatar: "SC",
    type: "learning",
    date: "2026-03-16",
    time: "15:00",
    duration: "60 min",
    status: "upcoming",
    skill: "React Development",
  },
  {
    id: 2,
    title: "Python for Data Science",
    partner: "Alex Rivera",
    avatar: "AR",
    type: "learning",
    date: "2026-03-18",
    time: "10:00",
    duration: "90 min",
    status: "upcoming",
    skill: "Python",
  },
  {
    id: 3,
    title: "JavaScript Fundamentals",
    partner: "Emily Davis",
    avatar: "ED",
    type: "teaching",
    date: "2026-03-17",
    time: "14:00",
    duration: "60 min",
    status: "upcoming",
    skill: "JavaScript",
  },
  {
    id: 4,
    title: "UI/UX Design Basics",
    partner: "Maya Patel",
    avatar: "MP",
    type: "learning",
    date: "2026-03-12",
    time: "14:00",
    duration: "60 min",
    status: "completed",
    skill: "Design",
    rating: 5,
  },
  {
    id: 5,
    title: "Web Development Basics",
    partner: "Michael Johnson",
    avatar: "MJ",
    type: "teaching",
    date: "2026-03-10",
    time: "16:00",
    duration: "90 min",
    status: "completed",
    skill: "Web Development",
    rating: 5,
  },
];

export default function Sessions() {
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "learning" | "teaching">("all");

  const filteredSessions = mockSessions.filter((session) => {
    const matchesStatus = filter === "all" || session.status === filter;
    const matchesType = typeFilter === "all" || session.type === typeFilter;
    return matchesStatus && matchesType;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Sessions</h1>
          <p className="text-muted-foreground">View and manage your learning sessions</p>
        </div>
        <Link to="/request">
          <Button>
            <Plus className="size-5 mr-2" />
            Book Session
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "primary" : "outline"}
            onClick={() => setFilter("all")}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === "upcoming" ? "primary" : "outline"}
            onClick={() => setFilter("upcoming")}
            size="sm"
          >
            Upcoming
          </Button>
          <Button
            variant={filter === "completed" ? "primary" : "outline"}
            onClick={() => setFilter("completed")}
            size="sm"
          >
            Completed
          </Button>
        </div>

        <div className="h-8 w-px bg-slate-300" />

        <div className="flex gap-2">
          <Button
            variant={typeFilter === "all" ? "primary" : "outline"}
            onClick={() => setTypeFilter("all")}
            size="sm"
          >
            All Sessions
          </Button>
          <Button
            variant={typeFilter === "learning" ? "primary" : "outline"}
            onClick={() => setTypeFilter("learning")}
            size="sm"
          >
            Learning
          </Button>
          <Button
            variant={typeFilter === "teaching" ? "primary" : "outline"}
            onClick={() => setTypeFilter("teaching")}
            size="sm"
          >
            Teaching
          </Button>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredSessions.map((session) => (
          <Card key={session.id} variant="elevated">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <CardTitle>{session.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {session.type === "learning" ? "Learning from" : "Teaching"} {session.partner}
                  </CardDescription>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session.type === "learning"
                      ? "bg-muted text-accent"
                      : "bg-muted text-primary"
                  }`}
                >
                  {session.type === "learning" ? "Learning" : "Teaching"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                  {session.avatar}
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="size-4" />
                    <span>{formatDate(session.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="size-4" />
                    <span>
                      {session.time} • {session.duration}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm">
                {session.skill}
              </div>

              {session.status === "completed" && session.rating && (
                <div className="flex items-center gap-1 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`size-4 ${
                        i < session.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">Rated session</span>
                </div>
              )}
            </CardContent>

            <CardFooter>
              {session.status === "upcoming" && (
                <>
                  <Button variant="primary" className="flex-1">
                    <Video className="size-5 mr-2" />
                    Join Session
                  </Button>
                  <Button variant="outline">Reschedule</Button>
                </>
              )}

              {session.status === "completed" && (
                <>
                  <Button variant="outline" className="flex-1">
                    View Details
                  </Button>
                  <Link to={`/chat/${session.id}`}>
                    <Button variant="ghost">Message</Button>
                  </Link>
                </>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredSessions.length === 0 && (
        <Card variant="bordered" className="text-center py-12">
          <p className="text-muted-foreground mb-4">No sessions found</p>
          <Link to="/matching">
            <Button variant="outline">Find Teachers</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
