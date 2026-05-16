import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/Card";
import { Clock, CheckCircle, XCircle, Plus, Loader2, User, MessageSquare, Edit2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { getMyRequests, updateRequestStatus, createSession, getOrCreateConversation } from "../../services";
import { requireAuthUserId } from "../../lib/requireAuth";
import type { SwapRequest } from "../../types/tables";
import { getAvatarUrl } from "../../utils/avatar";

export default function Requests() {
  const [filter, setFilter] = useState<"all" | "open" | "pending" | "accepted" | "rejected">("all");
  const [requests, setRequests] = useState<SwapRequest[]>([]);
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

  const handleAccept = async (request: SwapRequest) => {
    try {
      setActionLoading(request.id);
      await updateRequestStatus({ request_id: request.id, status: "accepted" });
      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: "accepted" as const } : r))
      );
    } catch (err) {
      console.error("[Requests] Failed to accept request:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (request: SwapRequest) => {
    try {
      setActionLoading(request.id);
      await updateRequestStatus({ request_id: request.id, status: "rejected" });
      setRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: "rejected" as const } : r))
      );
    } catch (err) {
      console.error("[Requests] Failed to decline request:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(id);
      const { error } = await supabase.from("swap_requests").delete().eq("id", id);
      if (error) {
        console.error(error);
        return;
      }
      // UI update instantly
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("[Requests] Failed to delete request:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
      case "pending":
        return <Clock className="size-5 text-yellow-600" />;
      case "accepted":
        return <CheckCircle className="size-5 text-green-600" />;
      case "rejected":
        return <XCircle className="size-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "accepted":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-muted text-foreground";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Skill Requests</h1>
          <p className="text-muted-foreground">Manage your skill exchange requests</p>
        </div>
        <Link to="/request">
          <Button>
            <Plus className="size-5 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "primary" : "outline"}
          onClick={() => setFilter("all")}
          size="sm"
        >
          All
        </Button>
        <Button
          variant={filter === "open" ? "primary" : "outline"}
          onClick={() => setFilter("open")}
          size="sm"
        >
          Open
        </Button>
        <Button
          variant={filter === "pending" ? "primary" : "outline"}
          onClick={() => setFilter("pending")}
          size="sm"
        >
          Pending
        </Button>
        <Button
          variant={filter === "accepted" ? "primary" : "outline"}
          onClick={() => setFilter("accepted")}
          size="sm"
        >
          Accepted
        </Button>
        <Button
          variant={filter === "rejected" ? "primary" : "outline"}
          onClick={() => setFilter("rejected")}
          size="sm"
        >
          Declined
        </Button>
      </div>

      {/* Requests Grid */}
      <div className="grid gap-6">
        {filteredRequests.map((request: any) => {
          const isSender = request.requester_id === currentUserId;
          const otherProfile = isSender ? request.receiver : request.requester;
          
          const displayProfile = otherProfile || { full_name: "Unknown User", id: "open" };
          const avatarUrl = getAvatarUrl(displayProfile.avatar_url);
          const initial = displayProfile.full_name?.substring(0, 2).toUpperCase() || "U";
          
          return (
            <div key={request.id} className="rounded-xl border border-border hover:bg-muted/40 transition p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card">
              {/* LEFT */}
              <div className="flex items-center gap-4 flex-shrink-0 md:w-1/3">
                <div className="size-12 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{displayProfile.full_name || "Unknown"}</h3>
                  <p className="text-xs text-muted-foreground">{formatDate(request.created_at)}</p>
                </div>
              </div>

              {/* CENTER */}
              <div className="flex-1 min-w-0 md:text-center text-sm">
                <p><span className="text-muted-foreground">Wants to learn:</span> <span className="font-medium text-foreground">{request.skill_learn || request.requested_skill?.name || "Unknown"}</span></p>
                <p><span className="text-muted-foreground">Can teach:</span> <span className="font-medium text-foreground">{request.skill_teach || request.offered_skill?.name || "Unknown"}</span></p>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-2 flex-shrink-0 md:w-1/3 justify-end">
                {isSender ? (
                  <>
                    <Button variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/requests/${request.id}`); }}>
                      <Edit2 className="size-4 mr-2" /> Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                      onClick={(e) => { e.stopPropagation(); handleDelete(request.id); }}
                      disabled={actionLoading === request.id}
                    >
                      {actionLoading === request.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 mr-2" />}
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="primary"
                      className="w-full md:w-auto"
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
                      {startingChat === request.id ? <Loader2 className="size-4 animate-spin mr-2" /> : <MessageSquare className="size-4 mr-2" />}
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRequests.length === 0 && (
        <Card variant="bordered" className="text-center py-12">
          <p className="text-muted-foreground mb-4">No requests found. Create one to start learning!</p>
          <Link to="/matching">
            <Button variant="outline">Find Learning Opportunities</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
