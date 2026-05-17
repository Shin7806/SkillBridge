import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Plus, Loader2, MessageSquare, Trash2, ArrowRight, BookOpen, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { getMyRequests, getOrCreateConversation } from "../../services";
import { requireAuthUserId } from "../../lib/requireAuth";
import { getAvatarUrl } from "../../utils/avatar";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-500",
  pending: "bg-yellow-500/10 text-yellow-500",
  accepted: "bg-green-500/10 text-green-600",
  rejected: "bg-red-500/10 text-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Declined",
};

const DURATION_LABELS: Record<string, string> = {
  "30": "30 min",
  "60": "1 hr",
  "90": "1.5 hrs",
  "120": "2 hrs",
};

const FREQUENCY_LABELS: Record<string, string> = {
  once: "One-time",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
};

export default function Requests() {
  const [filter, setFilter] = useState<"all" | "open" | "pending" | "accepted" | "rejected">("all");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        const userId = await requireAuthUserId();
        setCurrentUserId(userId);
        const data = await getMyRequests();
        setRequests(data);
      } catch (err) {
        console.error("[Requests] Failed to load requests:", err);
        setError("Failed to load requests. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadRequests();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(id);
      const { error } = await supabase.from("swap_requests").delete().eq("id", id);
      if (error) { console.error(error); return; }
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("[Requests] Failed to delete request:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1d ago";
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Skill Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your skill exchange requests</p>
        </div>
        <Link to="/request">
          <Button variant="primary" size="sm">
            <Plus className="size-4 mr-1.5" />
            New Request
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg text-sm">{error}</div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {(["all", "open", "pending", "accepted", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
          >
            {f === "rejected" ? "Declined" : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={`ml-1.5 text-xs ${filter === f ? "opacity-70" : "opacity-50"}`}>
              {f === "all"
                ? requests.length
                : requests.filter((r) => r.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid gap-3">
        {filteredRequests.map((request: any) => {
          const isSender = request.requester_id === currentUserId;
          const isOpenRequest = !request.receiver_id;

          let displayProfile = isSender
            ? isOpenRequest ? request.requester : request.receiver
            : request.requester;

          displayProfile = displayProfile || { full_name: "Unknown User", avatar_url: null };
          const avatarUrl = getAvatarUrl(displayProfile.avatar_url);
          const initial = displayProfile.full_name?.substring(0, 2).toUpperCase() || "U";
          const status = request.status as string;

          // Extra metadata pills
          const meta = [
            request.level && (request.level.charAt(0).toUpperCase() + request.level.slice(1)),
            request.duration && DURATION_LABELS[request.duration],
            request.frequency && FREQUENCY_LABELS[request.frequency],
          ].filter(Boolean) as string[];

          const goals: string[] = Array.isArray(request.goals) ? request.goals : [];

          return (
            <div
              key={request.id}
              className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => navigate(`/requests/${request.id}`)}
            >
              {/* Top row: avatar + name + status + date */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" className="size-full object-cover" />
                      : initial}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground leading-tight">
                      {displayProfile.full_name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(request.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"}`}>
                    {STATUS_LABELS[status] ?? status}
                  </span>
                </div>
              </div>

              {/* Skill swap row — the hero of the card */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-lg px-3 py-2.5">
                  <GraduationCap className="size-3.5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider leading-none mb-0.5">Teaches</p>
                    <p className="text-sm font-semibold text-foreground truncate">{request.skill_teach || "—"}</p>
                  </div>
                </div>

                <ArrowRight className="size-4 text-muted-foreground shrink-0" />

                <div className="flex-1 flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-3 py-2.5">
                  <BookOpen className="size-3.5 text-yellow-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-yellow-600 uppercase tracking-wider leading-none mb-0.5">Learns</p>
                    <p className="text-sm font-semibold text-foreground truncate">{request.skill_learn || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Meta pills: level, duration, frequency */}
              {meta.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {meta.map((m) => (
                    <span key={m} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                      {m}
                    </span>
                  ))}
                </div>
              )}

              {/* Goals preview: show first 2, then "+N more" */}
              {goals.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {goals.slice(0, 2).map((g) => (
                    <span key={g} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                      {g}
                    </span>
                  ))}
                  {goals.length > 2 && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md">
                      +{goals.length - 2} more
                    </span>
                  )}
                </div>
              )}

              {/* Divider + actions */}
              <div className="border-t border-border pt-3 flex items-center justify-end gap-2">
                {isSender ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); navigate(`/requests/${request.id}`); }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                      onClick={(e) => { e.stopPropagation(); handleDelete(request.id); }}
                      disabled={actionLoading === request.id}
                    >
                      {actionLoading === request.id
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <Trash2 className="size-3.5 mr-1" />}
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={startingChat === request.id}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        setStartingChat(request.id);
                        const conversation = await getOrCreateConversation(request.requester_id);
                        if (!conversation?.id) throw new Error("Conversation not created");
                        navigate(`/chat/${conversation.id}`);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setStartingChat(null);
                      }
                    }}
                  >
                    {startingChat === request.id
                      ? <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      : <MessageSquare className="size-3.5 mr-1.5" />}
                    Message
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRequests.length === 0 && (
        <Card variant="bordered" className="text-center py-16 mt-4">
          <p className="text-muted-foreground text-sm mb-4">No requests here yet.</p>
          <Link to="/request">
            <Button variant="outline" size="sm">Create a Request</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}