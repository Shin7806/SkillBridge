import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/Card";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { SkillAutocomplete } from "../components/SkillAutocomplete";
import { SKILL_SUGGESTIONS } from "../data/skills";
import { getAllSkills } from "../../services/skills";
import { supabase } from "../../lib/supabase";
import { getUserSkills } from "../../services/userSkills";
import { sendSwapRequest } from "../../services/swapRequests";

export default function SkillRequest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    requestedSkill: "",
    offeredSkill: "",
    description: "",
    level: "beginner",
    duration: "30",
    frequency: "weekly",
  });

  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState("");

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setGoals([...goals, newGoal]);
    setNewGoal("");
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;

      if (!currentUser) {
        console.error("No user logged in");
        return;
      }

      if (!formData.requestedSkill.trim() || !formData.offeredSkill.trim()) {
        setError("Both skills must be provided");
        return;
      }

      if (formData.requestedSkill.trim().toLowerCase() === formData.offeredSkill.trim().toLowerCase()) {
        throw new Error("You cannot request and offer the same skill");
      }

      const { data, error } = await supabase
        .from("swap_requests")
        .insert({
          requester_id: currentUser.id,
          skill_learn: formData.requestedSkill.trim(),
          skill_teach: formData.offeredSkill.trim(),
          message: formData.description.trim() || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("REQUEST ERROR:", error);
        setError(error.message);
        return;
      }

      navigate("/requests");
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(err instanceof Error ? err.message : "Failed to create request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Request a Skill</h1>
        <p className="text-muted-foreground">
          Tell us what you'd like to learn and create an open request
        </p>
      </div>

      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

      <Card variant="elevated">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <SkillAutocomplete
              label="What skill do you want to learn?"
              placeholder="e.g., Python, Guitar, Spanish"
              value={formData.requestedSkill}
              onChange={(skill) => setFormData({ ...formData, requestedSkill: skill })}
              suggestions={SKILL_SUGGESTIONS}
              required
            />
            <SkillAutocomplete
              label="What skill can you teach?"
              placeholder="e.g., JavaScript, Piano, French"
              value={formData.offeredSkill}
              onChange={(skill) => setFormData({ ...formData, offeredSkill: skill })}
              suggestions={SKILL_SUGGESTIONS}
              required
            />
          </div>

          {/* Current Level */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Your current level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["beginner", "intermediate", "advanced"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, level })}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    formData.level === level
                      ? "border-primary bg-muted text-primary"
                      : "border-border hover:border-slate-400"
                  }`}
                >
                  <span className="font-medium capitalize">{level}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Textarea
              label="Describe what you want to learn"
              placeholder="Tell us more about what you want to achieve and any specific areas you'd like to focus on..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          {/* Learning Goals */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Learning goals (optional)
            </label>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="e.g., Build a personal website"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addGoal())}
              />
              <Button type="button" onClick={addGoal} variant="primary">
                <Plus className="size-5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {goals.map((goal, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-accent rounded-lg"
                >
                  {goal}
                  <button
                    type="button"
                    onClick={() => removeGoal(index)}
                    className="hover:opacity-80"
                    aria-label={`Remove ${goal}`}
                  >
                    <X className="size-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Session Preferences */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Preferred session duration
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="once">One-time session</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Link to="/dashboard">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Request"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
