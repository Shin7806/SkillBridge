import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getSwapRequestById, updateRequestStatus, getOrCreateConversation } from "../../services";
import { requireAuthUserId } from "../../lib/requireAuth";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/Card";
import { Loader2, ArrowLeft, User, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { getAvatarUrl } from "../../utils/avatar";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ skill_learn: "", skill_teach: "" });

  useEffect(() => {
    const loadRequest = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const userId = await requireAuthUserId();
        setCurrentUserId(userId);
        const data = await getSwapRequestById(id);
        setRequest(data);
        setEditForm({ skill_learn: data.skill_learn || "", skill_teach: data.skill_teach || "" });
        console.log("REQUEST:", data);
      } catch (err) {
        console.error("Failed to load request detail:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRequest();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-2">Request not found</h2>
        <Button onClick={() => navigate("/requests")}>Back to Requests</Button>
      </div>
    );
  }

  const isSender = request.requester_id === currentUserId;
  const otherProfile = isSender ? request.receiver : request.sender;

  if (!otherProfile && isSender) {
    // Open request edge case
  }

  const displayProfile = otherProfile || { full_name: "Open Request", id: "open" };
  const avatarUrl = getAvatarUrl(displayProfile.avatar_url);
  const initial = displayProfile.full_name?.substring(0, 2).toUpperCase() || "U";

  const handleAccept = async () => {
    try {
      setActionLoading("accept");
      await updateRequestStatus({ request_id: request.id, status: "accepted" });
      setRequest((prev: any) => ({ ...prev, status: "accepted" }));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    try {
      setActionLoading("decline");
      await updateRequestStatus({ request_id: request.id, status: "rejected" });
      setRequest((prev: any) => ({ ...prev, status: "rejected" }));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessage = async () => {
    if (!otherProfile?.id) return;
    try {
      setActionLoading("message");
      const conversation = await getOrCreateConversation(otherProfile.id);
      navigate(`/chat/${conversation.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setActionLoading("save");
      const { error } = await supabase
        .from("swap_requests")
        .update({
          skill_learn: editForm.skill_learn,
          skill_teach: editForm.skill_teach,
        })
        .eq("id", request.id);

      if (error) throw error;
      setRequest({ ...request, skill_learn: editForm.skill_learn, skill_teach: editForm.skill_teach });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update request:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
      case "pending": return <Clock className="size-5 text-yellow-600" />;
      case "accepted": return <CheckCircle className="size-5 text-green-600" />;
      case "rejected": return <XCircle className="size-5 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Button variant="ghost" onClick={() => navigate("/requests")} className="mb-6 -ml-4 text-muted-foreground">
        <ArrowLeft className="size-4 mr-2" />
        Back to requests
      </Button>

      <Card variant="elevated" className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5"></div>
        
        <CardContent className="relative px-8 pb-8 pt-0">
          <div className="absolute -top-16 left-8">
            <div className="size-32 rounded-full border-4 border-card bg-primary text-primary-foreground flex items-center justify-center text-4xl font-bold shadow-lg">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayProfile.full_name} className="size-full rounded-full object-cover" />
              ) : (
                initial
              )}
            </div>
          </div>

          <div className="pt-20">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{displayProfile.full_name}</h1>
                <p className="text-muted-foreground mt-1">
                  {isSender ? "You requested a skill swap" : "Requested a skill swap with you"}
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted">
                {getStatusIcon(request.status)}
                <span className="font-medium capitalize">{request.status === "rejected" ? "declined" : request.status}</span>
              </div>
            </div>

            {isEditing ? (
              <div className="mt-8 grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">You can teach</label>
                  <input
                    className="w-full px-3 py-2 bg-background border border-border rounded-md"
                    value={editForm.skill_teach}
                    onChange={(e) => setEditForm({ ...editForm, skill_teach: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">You want to learn</label>
                  <input
                    className="w-full px-3 py-2 bg-background border border-border rounded-md"
                    value={editForm.skill_learn}
                    onChange={(e) => setEditForm({ ...editForm, skill_learn: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button 
                    variant="primary" 
                    onClick={handleSaveEdit}
                    disabled={actionLoading === "save" || !editForm.skill_learn || !editForm.skill_teach}
                  >
                    {actionLoading === "save" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-8 grid sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 relative group">
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
                    {isSender ? "You can teach" : "They are offering"}
                  </h3>
                  <p className="text-lg font-medium">{request.skill_teach || "Unknown Skill"}</p>
                </div>
                
                <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                  <h3 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-2">
                    {isSender ? "You want to learn" : "They want to learn"}
                  </h3>
                  <p className="text-lg font-medium">{request.skill_learn || "Unknown Skill"}</p>
                </div>
              </div>
            )}

            {request.message && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Message</h3>
                <div className="p-4 rounded-lg bg-muted/50 text-foreground">
                  <p className="whitespace-pre-wrap">{request.message}</p>
                </div>
              </div>
            )}
            
            <div className="mt-8 text-sm text-muted-foreground">
              Requested on {new Date(request.created_at).toLocaleDateString()}
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/30 px-8 py-4 flex flex-wrap gap-3">
          {request.status === "pending" && !isSender && (
            <>
              <Button 
                variant="primary" 
                onClick={handleAccept}
                disabled={actionLoading === "accept"}
                className="flex-1 sm:flex-none"
              >
                {actionLoading === "accept" && <Loader2 className="size-4 animate-spin mr-2" />}
                Accept
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDecline}
                disabled={actionLoading === "decline"}
                className="flex-1 sm:flex-none"
              >
                {actionLoading === "decline" && <Loader2 className="size-4 animate-spin mr-2" />}
                Decline
              </Button>
            </>
          )}

          {isSender && !isEditing && (
             <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Request</Button>
          )}

          {otherProfile?.id && (
            <>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/profile/${otherProfile.id}`)}
                className="flex-1 sm:flex-none"
              >
                <User className="size-4 mr-2" />
                View Profile
              </Button>
              <Button 
                variant="outline" 
                onClick={handleMessage}
                disabled={actionLoading === "message"}
                className="flex-1 sm:flex-none"
              >
                {actionLoading === "message" ? <Loader2 className="size-4 animate-spin mr-2" /> : <MessageSquare className="size-4 mr-2" />}
                Message
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
