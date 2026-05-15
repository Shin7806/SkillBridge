import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/Card";
import { Clock, CheckCircle, XCircle, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getMyRequests, updateRequestStatus, createSession } from "../../services";
import { requireAuthUserId } from "../../lib/requireAuth";
import type { SwapRequest } from "../../types/tables";

export default function Requests() {
  const [filter, setFilter] = useState<"all" | "open" | "pending" | "accepted" | "rejected">("all");
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
        {filteredRequests.map((request) => {
          const isSender = request.sender_id === currentUserId;
          const displayId = isSender ? (request.receiver_id || "Open Request") : request.sender_id;
          const initial = displayId.substring(0, 2).toUpperCase();
          const displayName = isSender 
            ? (request.receiver_id ? `Request to ${request.receiver_id.substring(0, 8)}...` : "Open Request (Looking for teachers)")
            : `Request from ${request.sender_id.substring(0, 8)}...`;

          return (
            <Card key={request.id} variant="elevated">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="size-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                      {initial}
                    </div>
                    <div>
                      <CardTitle>{displayName}</CardTitle>
                      <CardDescription className="mt-1">
                        {request.message || "Swap request"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {request.status === "rejected" ? "declined" : request.status}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>
                    <strong>Requested:</strong> {formatDate(request.created_at)}
                  </span>
                </div>
              </CardContent>

              {request.status === "pending" && !isSender && (
                <CardFooter>
                  <Button
                    variant="primary"
                    onClick={() => handleAccept(request)}
                    disabled={actionLoading === request.id}
                  >
                    {actionLoading === request.id ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : null}
                    Accept Request
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDecline(request)}
                    disabled={actionLoading === request.id}
                  >
                    Decline
                  </Button>
                  <Link to={`/chat/${request.id}`}>
                    <Button variant="ghost">Send Message</Button>
                  </Link>
                </CardFooter>
              )}

              {request.status === "accepted" && (
                <CardFooter>
                  <Link to={`/schedule/${request.id}`}>
                    <Button variant="primary">Schedule Session</Button>
                  </Link>
                  <Link to={`/chat/${request.id}`}>
                    <Button variant="outline">Message</Button>
                  </Link>
                </CardFooter>
              )}
            </Card>
          );
        })}
      </div>

      {filteredRequests.length === 0 && (
        <Card variant="bordered" className="text-center py-12">
          <p className="text-muted-foreground mb-4">No {filter !== "all" && filter} requests found</p>
          <Link to="/matching">
            <Button variant="outline">Find Learning Opportunities</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
