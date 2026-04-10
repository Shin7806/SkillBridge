import { useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/Card";
import { Textarea } from "../components/Input";
import { Calendar, Clock, Video } from "lucide-react";

export default function SessionScheduling() {
  const { id } = useParams();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");

  const teacher = {
    name: "Sarah Chen",
    avatar: "SC",
    skill: "React Development",
  };

  const availableDates = [
    "2026-03-16",
    "2026-03-17",
    "2026-03-18",
    "2026-03-20",
    "2026-03-21",
  ];

  const availableTimes = [
    "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle session booking
    window.location.href = "/sessions";
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Schedule a Session</h1>
        <p className="text-muted-foreground">
          Book a learning session with {teacher.name}
        </p>
      </div>

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
                  disabled={!selectedDate || !selectedTime}
                >
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
                  {teacher.avatar}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{teacher.name}</p>
                  <p className="text-sm text-muted-foreground">{teacher.skill}</p>
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
