import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/Card";
import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { SkillAutocomplete } from "../components/SkillAutocomplete";
import { SKILL_SUGGESTIONS } from "../data/skills";
import { supabase } from "../../lib/supabase";
import { getAllSkills } from "../../services/skills";
import { saveUserSkills, type UserSkillInput } from "../../services/userSkills";
import { updateMyProfile } from "../../services/profile";

export default function SkillProfileSetup() {
  const [step, setStep] = useState(1);
  const [skillsToTeach, setSkillsToTeach] = useState<string[]>([]);
  const [skillsToLearn, setSkillsToLearn] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [bio, setBio] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        window.location.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", data.session.user.id)
        .maybeSingle();

      if (cancelled) return;
      if (profile?.onboarding_completed === true) {
        window.location.replace("/dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizeSkill = (s: string) => s.trim().replace(/\s+/g, " ");

  const addSkill = (type: "teach" | "learn") => {
    const skill = normalizeSkill(newSkill);
    if (!skill) return;

    if (type === "teach") {
      if (skillsToTeach.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        setNewSkill("");
        return;
      }
      setSkillsToTeach([...skillsToTeach, skill]);
    } else {
      if (skillsToLearn.some((s) => s.toLowerCase() === skill.toLowerCase())) {
        setNewSkill("");
        return;
      }
      setSkillsToLearn([...skillsToLearn, skill]);
    }
    setNewSkill("");
  };

  const removeSkill = (type: "teach" | "learn", index: number) => {
    if (type === "teach") {
      setSkillsToTeach(skillsToTeach.filter((_, i) => i !== index));
    } else {
      setSkillsToLearn(skillsToLearn.filter((_, i) => i !== index));
    }
  };

  const handleCompleteSetup = async () => {
    if (skillsToTeach.length === 0 || skillsToLearn.length === 0) return;

    setIsCompleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        window.location.replace("/login");
        return;
      }

      const allSkills = await getAllSkills();
      const nameToId = new Map(allSkills.map((s) => [s.name.trim().toLowerCase(), s.id]));
      const entries: UserSkillInput[] = [
        ...skillsToTeach.map((name) => {
          const id = nameToId.get(name.trim().toLowerCase());
          return id ? { skill_id: id, skill_type: "teach" as const } : null;
        }),
        ...skillsToLearn.map((name) => {
          const id = nameToId.get(name.trim().toLowerCase());
          return id ? { skill_id: id, skill_type: "learn" as const } : null;
        }),
      ].filter(Boolean) as UserSkillInput[];

      if (entries.length > 0) {
        await saveUserSkills(entries);
      } else {
        console.warn(
          "Setup: skill names did not match any row in public.skills. Completing onboarding; add skills from Profile after seeding skills."
        );
      }

      await updateMyProfile({
        bio: bio.trim() || null,
        onboarding_completed: true,
      });

      window.location.replace("/dashboard");
    } catch (e) {
      console.error(e);
      setIsCompleting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Set up your profile</h1>
        <p className="text-muted-foreground">Tell us about your skills and what you'd like to learn</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((num) => (
          <div key={num} className="flex items-center">
            <div
              className={`size-10 rounded-full flex items-center justify-center font-semibold ${
                step >= num
                  ? "bg-primary text-primary-foreground"
                  : "bg-slate-200 text-muted-foreground"
              }`}
            >
              {num}
            </div>
            {num < 3 && (
              <div
                className={`w-16 h-1 ${
                  step > num ? "bg-primary" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card variant="elevated">
        {step === 1 && (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle>Skills I can teach</CardTitle>
              <CardDescription>
                What skills would you like to share with others?
              </CardDescription>
            </CardHeader>

            <div className="flex gap-2">
              <SkillAutocomplete
                placeholder="e.g., JavaScript, Guitar, Spanish"
                value={newSkill}
                onChange={setNewSkill}
                suggestions={SKILL_SUGGESTIONS}
                onEnter={() => addSkill("teach")}
              />
              <Button type="button" onClick={() => addSkill("teach")} variant="primary">
                <Plus className="size-5" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {skillsToTeach.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-primary rounded-lg"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill("teach", index)}
                    className="hover:opacity-80"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="size-4" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={skillsToTeach.length === 0}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle>Skills I want to learn</CardTitle>
              <CardDescription>
                What would you like to learn from others?
              </CardDescription>
            </CardHeader>

            <div className="flex gap-2">
              <SkillAutocomplete
                placeholder="e.g., Python, Photography, French"
                value={newSkill}
                onChange={setNewSkill}
                suggestions={SKILL_SUGGESTIONS}
                onEnter={() => addSkill("learn")}
              />
              <Button type="button" onClick={() => addSkill("learn")} variant="primary">
                <Plus className="size-5" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {skillsToLearn.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-accent rounded-lg"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill("learn", index)}
                    className="hover:opacity-80"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="size-4" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex justify-between">
              <Button onClick={() => setStep(1)} variant="outline">
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={skillsToLearn.length === 0}>
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle>Tell us about yourself</CardTitle>
              <CardDescription>
                Share a bit about your background and interests
              </CardDescription>
            </CardHeader>

            <Textarea
              label="Bio"
              placeholder="I'm a software developer who loves teaching programming and wants to learn design..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={6}
            />

            <div className="flex justify-between">
              <Button onClick={() => setStep(2)} variant="outline">
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => void handleCompleteSetup()}
                disabled={
                  isCompleting ||
                  skillsToTeach.length === 0 ||
                  skillsToLearn.length === 0
                }
              >
                {isCompleting ? "Saving…" : "Complete Setup"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
