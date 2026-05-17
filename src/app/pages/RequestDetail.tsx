import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { getSwapRequestById, updateRequestStatus, getOrCreateConversation } from "../../services";
import { requireAuthUserId } from "../../lib/requireAuth";
import { Button } from "../components/Button";
import { Card, CardContent, CardFooter } from "../components/Card";
import { Loader2, ArrowLeft, User, MessageSquare, CheckCircle, XCircle, Clock, X, ChevronDown } from "lucide-react";
import { getAvatarUrl } from "../../utils/avatar";

const LEARNING_GOALS = [
  "Build a personal project",
  "Get a job or promotion",
  "Freelance or earn money",
  "Pass an exam or certification",
  "Start a business",
  "Improve existing skills",
  "Explore a new hobby",
  "Teach others in the future",
  "Create an app or website",
  "Understand fundamentals",
  "Improve communication skills",
  "Switch careers",
  "Academic learning",
  "Creative expression",
  "Personal growth and confidence",
];

const MAX_GOALS = 5;

const DURATION_LABELS: Record<string, string> = {
  "30": "30 minutes",
  "60": "1 hour",
  "90": "1.5 hours",
  "120": "2 hours",
};

const FREQUENCY_LABELS: Record<string, string> = {
  once: "One-time session",
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
};

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [goalsDropdownOpen, setGoalsDropdownOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    skill_learn: "",
    skill_teach: "",
    message: "",
    level: "beginner",
    duration: "30",
    frequency: "weekly",
    goals: [] as string[],
  });

  useEffect(() => {
    const loadRequest = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const userId = await requireAuthUserId();
        setCurrentUserId(userId);
        const data = await getSwapRequestById(id);
        setRequest(data);
        setEditForm({
          skill_learn: data.skill_learn || "",
          skill_teach: data.skill_teach || "",
          message: data.message || "",
          level: data.level || "beginner",
          duration: data.duration || "30",
          frequency: data.frequency || "weekly",
          goals: Array.isArray(data.goals) ? data.goals : [],
        });
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
  const isOpenRequest = !request.receiver_id;

  let displayProfile;
  if (isSender) {
    displayProfile = isOpenRequest ? request.requester : request.receiver;
  } else {
    displayProfile = request.requester;
  }

  displayProfile = displayProfile || { full_name: "Unknown", avatar_url: null };
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
    const otherId = isSender ? request.receiver_id : request.requester_id;
    if (!otherId) return;
    try {
      setActionLoading("message");
      const conversation = await getOrCreateConversation(otherId);
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
          message: editForm.message || null,
          level: editForm.level,
          duration: editForm.duration,
          frequency: editForm.frequency,
          goals: editForm.goals.length > 0 ? editForm.goals : null,
        })
        .eq("id", request.id);

      if (error) throw error;

      setRequest({
        ...request,
        skill_learn: editForm.skill_learn,
        skill_teach: editForm.skill_teach,
        message: editForm.message,
        level: editForm.level,
        duration: editForm.duration,
        frequency: editForm.frequency,
        goals: editForm.goals.length > 0 ? editForm.goals : null,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update request:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleGoal = (goal: string) => {
    const current = editForm.goals;
    if (current.includes(goal)) {
      setEditForm({ ...editForm, goals: current.filter((g) => g !== goal) });
    } else {
      if (current.length >= MAX_GOALS) return;
      setEditForm({ ...editForm, goals: [...current, goal] });
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

  const otherUserId = isSender ? request.receiver_id : request.requester_id;

  const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
  const selectClass = "w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Button variant="ghost" onClick={() => navigate("/requests")} className="mb-6 -ml-4 text-muted-foreground">
        <ArrowLeft className="size-4 mr-2" />
        Back to requests
      </Button>

      <Card variant="elevated" className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5" />

        <CardContent className="relative px-8 pb-8 pt-0">
          <div className="absolute -top-16 left-8">
            <div className="size-32 rounded-full border-4 border-card bg-primary text-primary-foreground flex items-center justify-center text-4xl font-bold shadow-lg overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayProfile.full_name} className="size-full rounded-full object-cover" />
              ) : (
                initial
              )}
            </div>
          </div>

          <div className="pt-20">
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{displayProfile.full_name}</h1>
                <p className="text-muted-foreground mt-1">
                  {isSender ? "You requested a skill swap" : "Requested a skill swap with you"}
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted">
                {getStatusIcon(request.status)}
                <span className="font-medium capitalize">
                  {request.status === "rejected" ? "Declined" : request.status}
                </span>
              </div>
            </div>

            {/* ── EDIT MODE ── */}
            {isEditing ? (
              <div className="mt-8 space-y-6">

                {/* Skills */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">You can teach</label>
                    <input
                      className={inputClass}
                      value={editForm.skill_teach}
                      onChange={(e) => setEditForm({ ...editForm, skill_teach: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">You want to learn</label>
                    <input
                      className={inputClass}
                      value={editForm.skill_learn}
                      onChange={(e) => setEditForm({ ...editForm, skill_learn: e.target.value })}
                    />
                  </div>
                </div>

                {/* Current Level */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Your current level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["beginner", "intermediate", "advanced"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, level })}
                        className={`px-4 py-3 rounded-lg border-2 transition-all font-medium capitalize ${editForm.level === level
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-slate-400 text-foreground"
                          }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration & Frequency */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Session duration</label>
                    <select
                      className={selectClass}
                      value={editForm.duration}
                      onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Frequency</label>
                    <select
                      className={selectClass}
                      value={editForm.frequency}
                      onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                    >
                      <option value="once">One-time session</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Message (optional)</label>
                  <textarea
                    className={`${inputClass} resize-none`}
                    rows={3}
                    value={editForm.message}
                    onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                  />
                </div>

                {/* Learning Goals */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Learning goals{" "}
                    <span className="text-muted-foreground font-normal">(optional · up to {MAX_GOALS})</span>
                  </label>

                  {editForm.goals.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editForm.goals.map((goal) => (
                        <span
                          key={goal}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium"
                        >
                          {goal}
                          <button
                            type="button"
                            onClick={() => toggleGoal(goal)}
                            className="hover:opacity-70 transition-opacity"
                          >
                            <X className="size-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setGoalsDropdownOpen((v) => !v)}
                      disabled={editForm.goals.length >= MAX_GOALS}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground hover:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-muted-foreground">
                        {editForm.goals.length >= MAX_GOALS ? "Maximum goals selected" : "Select a learning goal…"}
                      </span>
                      <ChevronDown
                        className={`size-4 text-muted-foreground transition-transform ${goalsDropdownOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {goalsDropdownOpen && editForm.goals.length < MAX_GOALS && (
                      <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                        <div className="max-h-56 overflow-y-auto py-1">
                          {LEARNING_GOALS.map((goal) => {
                            const selected = editForm.goals.includes(goal);
                            return (
                              <button
                                key={goal}
                                type="button"
                                onClick={() => {
                                  toggleGoal(goal);
                                  if (!selected && editForm.goals.length + 1 >= MAX_GOALS) {
                                    setGoalsDropdownOpen(false);
                                  }
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
                                  }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span
                                    className={`size-4 rounded border flex items-center justify-center shrink-0 ${selected ? "bg-primary border-primary" : "border-border"
                                      }`}
                                  >
                                    {selected && (
                                      <svg className="size-2.5 text-white" viewBox="0 0 10 8" fill="none">
                                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </span>
                                  {goal}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {goalsDropdownOpen && (
                    <div className="fixed inset-0 z-10" onClick={() => setGoalsDropdownOpen(false)} />
                  )}
                </div>

                {/* Save / Cancel */}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button
                    variant="primary"
                    onClick={handleSaveEdit}
                    disabled={actionLoading === "save" || !editForm.skill_learn || !editForm.skill_teach}
                  >
                    {actionLoading === "save" && <Loader2 className="size-4 animate-spin mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </div>

            ) : (
              /* ── VIEW MODE ── */
              <>
                <div className="mt-8 grid sm:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">YOU CAN TEACH</h3>
                    <p className="text-lg font-medium">{request.skill_teach || "Unknown Skill"}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                    <h3 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider mb-2">YOU WANT TO LEARN</h3>
                    <p className="text-lg font-medium">{request.skill_learn || "Unknown Skill"}</p>
                  </div>
                </div>

                {/* Level / Duration / Frequency row */}
                {(request.level || request.duration || request.frequency) && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {request.level && (
                      <span className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium capitalize text-foreground">
                        {request.level}
                      </span>
                    )}
                    {request.duration && DURATION_LABELS[request.duration] && (
                      <span className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium text-foreground">
                        {DURATION_LABELS[request.duration]}
                      </span>
                    )}
                    {request.frequency && FREQUENCY_LABELS[request.frequency] && (
                      <span className="px-3 py-1.5 rounded-full bg-muted text-sm font-medium text-foreground">
                        {FREQUENCY_LABELS[request.frequency]}
                      </span>
                    )}
                  </div>
                )}

                {/* Goals */}
                {Array.isArray(request.goals) && request.goals.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Learning Goals</h3>
                    <div className="flex flex-wrap gap-2">
                      {request.goals.map((goal: string) => (
                        <span
                          key={goal}
                          className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium"
                        >
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message */}
                {request.message && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Message</h3>
                    <div className="p-4 rounded-lg bg-muted/50 text-foreground">
                      <p className="whitespace-pre-wrap">{request.message}</p>
                    </div>
                  </div>
                )}

                <div className="mt-8 text-sm text-muted-foreground">
                  Requested on {new Date(request.created_at).toLocaleDateString()}
                </div>
              </>
            )}
          </div>
        </CardContent>

        <CardFooter className="bg-muted/30 px-8 py-4 flex flex-wrap gap-3">
          {request.status === "pending" && !isSender && (
            <>
              <Button variant="primary" onClick={handleAccept} disabled={actionLoading === "accept"} className="flex-1 sm:flex-none">
                {actionLoading === "accept" && <Loader2 className="size-4 animate-spin mr-2" />}
                Accept
              </Button>
              <Button variant="outline" onClick={handleDecline} disabled={actionLoading === "decline"} className="flex-1 sm:flex-none">
                {actionLoading === "decline" && <Loader2 className="size-4 animate-spin mr-2" />}
                Decline
              </Button>
            </>
          )}

          {isSender && !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Request</Button>
          )}

          {otherUserId && (
            <>
              <Button variant="outline" onClick={() => navigate(`/profile/${otherUserId}`)} className="flex-1 sm:flex-none">
                <User className="size-4 mr-2" />
                View Profile
              </Button>
              <Button variant="outline" onClick={handleMessage} disabled={actionLoading === "message"} className="flex-1 sm:flex-none">
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