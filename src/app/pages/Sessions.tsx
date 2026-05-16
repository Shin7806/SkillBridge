import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/Card";
import { Calendar, Clock, Video, Star, Plus, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { getMySessions, updateSessionStatus, getOrCreateConversation } from "../../services";
import { requireAuthUserId } from "../../lib/requireAuth";
import type { Session, SessionStatus } from "../../types/tables";

// Extended session type that may include swap_requests join data
type SessionWithRequest = Session & {
  swap_requests?: {
    id: string;
    requester_id: string;
    receiver_id: string;
    offered_skill_id: string;
    requested_skill_id: string;
    status: string;
  };
};

export default function Sessions() {
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "learning" | "teaching">("all");
  const [sessions, setSessions] = useState<SessionWithRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const userId = await requireAuthUserId();
        setCurrentUserId(userId);
        const data = await getMySessions();
        setSessions(data as SessionWithRequest[]);
        console.log("[Sessions] Loaded:", data.length);
      } catch (err) {
        console.error("[Sessions] Failed to load sessions:", err);
        setError("Failed to load sessions. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, []);

  const handleSessionAction = async (sessionId: string, status: SessionStatus) => {
    try {
      setActionLoading(sessionId);
      await updateSessionStatus({ session_id: sessionId, status });
      console.log(`[Sessions] Session ${sessionId} → ${status}`);

      // Update local state
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status } : s))
      );
    } catch (err) {
      console.error("[Sessions] Failed to update session:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const getSessionStatusCategory = (session: Session): "upcoming" | "completed" => {
    return session.status === "completed" ? "completed" : "upcoming";
  };

  // Check if current user is the receiver (they can accept/decline pending sessions)
  const isReceiver = (session: SessionWithRequest): boolean => {
    if (!currentUserId || !session.swap_requests) return false;
    // The session creator sent it; the other party (receiver in swap_requests context) accepts
    return session.created_by !== currentUserId;
  };

  const filteredSessions = sessions.filter((session) => {
    const category = getSessionStatusCategory(session);
    const matchesStatus = filter === "all" || category === filter;
    return matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    // timeStr is "HH:MM:SS" from Postgres
    return timeStr.substring(0, 5);
  };

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-muted text-primary";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-muted text-foreground";
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

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

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

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
        {filteredSessions.map((session) => {
          const category = getSessionStatusCategory(session);
          const receiverCanAct = isReceiver(session) && session.status === "pending";
          const otherUserId = session.swap_requests 
            ? (session.swap_requests.requester_id === currentUserId ? session.swap_requests.receiver_id : session.swap_requests.requester_id)
            : session.created_by; // fallback

          return (
            <Card key={session.id} variant="elevated">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle>Session</CardTitle>
                    <CardDescription className="mt-1">
                      {session.created_by === currentUserId ? "Created by you" : "Invited to join"}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(session.status)}`}
                  >
                    {session.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {session.created_by.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="size-4" />
                      <span>{formatDate(session.scheduled_date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="size-4" />
                      <span>
                        {formatTime(session.scheduled_time)} • {session.duration_minutes} min
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-foreground rounded-lg text-sm">
                  {session.duration_minutes} min session
                </div>

                {session.notes && (
                  <p className="text-sm text-muted-foreground mt-3">{session.notes}</p>
                )}
              </CardContent>

              <CardFooter>
                {/* Pending session: receiver can accept/decline */}
                {receiverCanAct && (
                  <>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => handleSessionAction(session.id, "confirmed")}
                      disabled={actionLoading === session.id}
                    >
                      {actionLoading === session.id ? (
                        <Loader2 className="size-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="size-5 mr-2" />
                      )}
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSessionAction(session.id, "cancelled")}
                      disabled={actionLoading === session.id}
                    >
                      <XCircle className="size-5 mr-2" />
                      Decline
                    </Button>
                  </>
                )}

                {/* Pending session: creator sees "Waiting" */}
                {session.status === "pending" && !receiverCanAct && (
                  <div className="flex-1 text-sm text-muted-foreground text-center py-1">
                    Waiting for confirmation...
                  </div>
                )}

                {/* Confirmed session */}
                {session.status === "confirmed" && (
                  <>
                    <Button variant="primary" className="flex-1">
                      <Video className="size-5 mr-2" />
                      Join Session
                    </Button>
                    <Button variant="outline">Reschedule</Button>
                  </>
                )}

                {/* Completed session */}
                {category === "completed" && session.status === "completed" && (
                  <>
                    <Button variant="outline" className="flex-1">
                      View Details
                    </Button>
                    <Button 
                      variant="ghost"
                      disabled={startingChat === session.id}
                      onClick={async () => {
                        if (!otherUserId) return;
                        try {
                          setStartingChat(session.id);
                          const conversation = await getOrCreateConversation(otherUserId);
                          if (!conversation?.id) throw new Error("Conversation not created");
                          navigate(`/chat/${conversation.id}`);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setStartingChat(null);
                        }
                      }}
                    >
                      {startingChat === session.id ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                      Message
                    </Button>
                  </>
                )}

                {/* Cancelled session */}
                {session.status === "cancelled" && (
                  <div className="flex-1 text-sm text-muted-foreground text-center py-1">
                    Session was declined
                  </div>
                )}
              </CardFooter>
            </Card>
          );
        })}
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
