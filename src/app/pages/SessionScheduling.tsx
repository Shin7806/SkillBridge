import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/Card";
import { Textarea } from "../components/Input";
import { Calendar, Clock, Video, Loader2 } from "lucide-react";
import { createSession, getProfileById, getUserSkills, getUserSkillsById, sendSwapRequest } from "../../services";
import type { Profile } from "../../types/tables";

export default function SessionScheduling() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Generate upcoming available dates (next 5 weekdays from today)
  const availableDates = (() => {
    const dates: string[] = [];
    const now = new Date();
    let d = new Date(now);
    d.setDate(d.getDate() + 1); // Start from tomorrow
    while (dates.length < 5) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) {
        // Weekdays only
        dates.push(d.toISOString().split("T")[0]);
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  })();

  const availableTimes = [
    "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  ];

  // Load the other user's profile if this is a match profile route param
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const p = await getProfileById(id);
        if (p) setProfile(p);
      } catch {
        // Not critical — sidebar will show fallback
      }
    })();
  }, [id]);

  const displayName = profile?.full_name || profile?.username || "User";
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedDate || !selectedTime) return;

    try {
      setSubmitting(true);
      setError(null);

      // 1. Fetch skills to create a valid swap_request
      // We need one skill the sender offers, and one the receiver offers.
      const [mySkills, theirSkills] = await Promise.all([
        getUserSkills(),
        getUserSkillsById(id)
      ]);

      let offeredSkillId = mySkills.find(s => s.skill_type === "teach")?.skill_id;
      let requestedSkillId = theirSkills.find(s => s.skill_type === "teach")?.skill_id;

      // Fallbacks if they don't have teach skills
      if (!offeredSkillId && mySkills.length > 0) offeredSkillId = mySkills[0].skill_id;
      if (!requestedSkillId && theirSkills.length > 0) requestedSkillId = theirSkills[0].skill_id;

      if (!offeredSkillId || !requestedSkillId) {
        throw new Error("Both users must have at least one skill set up to connect.");
      }

      // If offered and requested happen to be the exact same skill UUID, pick another if possible
      if (offeredSkillId === requestedSkillId) {
        const altSkill = mySkills.find(s => s.skill_id !== requestedSkillId);
        if (altSkill) offeredSkillId = altSkill.skill_id;
        else throw new Error("Cannot offer and request the exact same skill.");
      }

      // 2. Create the Swap Request
      const request = await sendSwapRequest({
        receiver_id: id,
        offered_skill_id: offeredSkillId,
        requested_skill_id: requestedSkillId,
        message: notes.trim() || null
      });
      console.log("[SessionScheduling] Swap request created:", request.id);

      // 3. Create the Session tied to the new Swap Request
      const session = await createSession({
        request_id: request.id,
        scheduled_date: selectedDate,
        scheduled_time: `${selectedTime}:00`, // "HH:MM" → "HH:MM:SS"
        duration_minutes: parseInt(duration, 10),
        notes: notes.trim() || null,
        status: "pending",
      });
      console.log("[SessionScheduling] Session created:", session.id);

      // Navigate to sessions page using React Router
      navigate("/sessions");
    } catch (err) {
      console.error("[SessionScheduling] Failed to book session:", err);
      const msg = err instanceof Error ? err.message : "Failed to book session. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Schedule a Session</h1>
        <p className="text-muted-foreground">
          Book a learning session with {displayName}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="md:col-span-2">
          <Card variant="elevated">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  <Calendar className="inline size-5 mr-2" />
                  Select a date
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {availableDates.map((date) => {
                    const dateObj = new Date(date);
                    const day = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                    const dayNum = dateObj.getDate();

                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedDate === date
                            ? "border-primary bg-muted text-primary"
                            : "border-border hover:border-slate-400"
                        }`}
                      >
                        <div className="text-xs font-medium">{day}</div>
                        <div className="text-lg font-bold">{dayNum}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  <Clock className="inline size-5 mr-2" />
                  Select a time
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      disabled={!selectedDate}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedTime === time
                          ? "border-primary bg-muted text-primary"
                          : "border-border hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Session duration
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {["30", "60", "90", "120"].map((min) => (
                    <button
                      key={min}
                      type="button"
                      onClick={() => setDuration(min)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        duration === min
                          ? "border-primary bg-muted text-primary"
                          : "border-border hover:border-slate-400"
                      }`}
                    >
                      {min} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Textarea
                  label="Session notes (optional)"
                  placeholder="Share any specific topics you'd like to cover or questions you have..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Link to={`/match/${id}`}>
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={!selectedDate || !selectedTime || submitting}
                >
                  {submitting && <Loader2 className="size-4 animate-spin mr-2" />}
                  Book Session
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div>
          <Card variant="bordered" className="sticky top-6">
            <CardHeader>
              <CardTitle>Session Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Teacher */}
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="size-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {initials || "U"}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {profile?.headline || "SkillBridge Member"}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date</p>
                  <p className="font-medium text-foreground">
                    {selectedDate
                      ? new Date(selectedDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })
                      : "Not selected"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Time</p>
                  <p className="font-medium text-foreground">
                    {selectedTime || "Not selected"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="font-medium text-foreground">{duration} minutes</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Format</p>
                  <div className="flex items-center gap-2 text-foreground">
                    <Video className="size-4" />
                    <span className="font-medium">Video call</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
