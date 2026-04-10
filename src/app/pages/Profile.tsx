import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/Card";
import { LogOut, Plus, X, Camera, Star } from "lucide-react";
import { SkillAutocomplete } from "../components/SkillAutocomplete";
import { SKILL_SUGGESTIONS } from "../data/skills";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useProfile } from "../../hooks/useProfile";
import { getAvatarUrlForUser, getDisplayName } from "../../utils/avatar";
import { updateMyProfile } from "../../services/profile";
import { getAllSkills } from "../../services/skills";
import { getUserSkills, saveUserSkills, type UserSkillInput } from "../../services/userSkills";
import { signOut } from "../../services/auth";

export default function Profile() {
  const user = useCurrentUser();
  const profile = useProfile(user?.id);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    location: "",
  });

  const [skillsToTeach, setSkillsToTeach] = useState<string[]>([]);
  const [skillsToLearn, setSkillsToLearn] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [avatarImgFailed, setAvatarImgFailed] = useState(false);

  const displayName = getDisplayName(user, profile);
  const avatarSrc = getAvatarUrlForUser(user, profile);
  const avatarInitials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    if (!user) return;
    setFormData({
      name:
        profile?.full_name ??
        (user.user_metadata as { full_name?: string })?.full_name ??
        "",
      email: user.email ?? "",
      bio: profile?.bio ?? "",
      location: profile?.headline ?? "",
    });
  }, [user, profile]);

  useEffect(() => {
    setAvatarImgFailed(false);
  }, [avatarSrc]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    (async () => {
      try {
        const [userSkills, allSkills] = await Promise.all([getUserSkills(), getAllSkills()]);
        if (cancelled) return;
        const idToName = new Map(allSkills.map((s) => [s.id, s.name]));
        const teach = userSkills
          .filter((u) => u.skill_type === "teach")
          .map((u) => idToName.get(u.skill_id))
          .filter(Boolean) as string[];
        const learn = userSkills
          .filter((u) => u.skill_type === "learn")
          .map((u) => idToName.get(u.skill_id))
          .filter(Boolean) as string[];
        setSkillsToTeach(teach);
        setSkillsToLearn(learn);
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const stats = {
    rating: 4.8,
    totalSessions: 24,
    skillsTaught: skillsToTeach.length,
    skillsLearned: skillsToLearn.length,
  };

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

  const removeSkill = (type: "teach" | "learn", skill: string) => {
    if (type === "teach") {
      setSkillsToTeach(skillsToTeach.filter((s) => s !== skill));
    } else {
      setSkillsToLearn(skillsToLearn.filter((s) => s !== skill));
    }
  };

  const handleSave = async () => {
    setIsEditing(false);
    try {
      await updateMyProfile({
        full_name: formData.name,
        bio: formData.bio,
        headline: formData.location || null,
      });

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

      if (entries.length) await saveUserSkills(entries);
    } catch (e) {
      console.error(e);
    }
  };

  const clearAuthLikeLocalState = () => {
    const clearKeys = (storage: Storage) => {
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key) continue;
        if (/(supabase|auth|session|token|access|refresh)/i.test(key)) keys.push(key);
      }
      keys.forEach((k) => storage.removeItem(k));
    };

    try {
      clearKeys(window.localStorage);
    } catch {
      // ignore
    }
    try {
      clearKeys(window.sessionStorage);
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      const { error } = await signOut();
      if (error) throw error;
      clearAuthLikeLocalState();

      window.location.href = "/login";
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Logout failed. Please try again.";
      setLogoutError(message);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and skills</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                {avatarImgFailed ? (
                  <div className="size-20 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-3xl border border-border">
                    {avatarInitials || "U"}
                  </div>
                ) : (
                  <img
                    src={avatarSrc}
                    alt=""
                    className="size-20 rounded-full object-cover bg-muted border border-border"
                    onError={() => setAvatarImgFailed(true)}
                  />
                )}
                {isEditing && (
                  <Button variant="outline" size="sm">
                    <Camera className="size-4 mr-2" />
                    Change Photo
                  </Button>
                )}
              </div>

              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
              />

              <Input label="Email" type="email" value={formData.email} disabled />

              <Input
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={!isEditing}
              />

              <Textarea
                label="Bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Skills I Teach */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Skills I Teach</CardTitle>
              <CardDescription>Share your expertise with others</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing && (
                <div className="flex gap-2 mb-4">
                  <SkillAutocomplete
                    placeholder="Add a skill..."
                    value={newSkill}
                    onChange={setNewSkill}
                    suggestions={SKILL_SUGGESTIONS}
                    onEnter={() => addSkill("teach")}
                  />
                  <Button type="button" onClick={() => addSkill("teach")}>
                    <Plus className="size-5" />
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {skillsToTeach.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-primary rounded-lg"
                  >
                    {skill}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeSkill("teach", skill)}
                        className="hover:opacity-80"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skills I Want to Learn */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Skills I Want to Learn</CardTitle>
              <CardDescription>What you're interested in learning</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing && (
                <div className="flex gap-2 mb-4">
                  <SkillAutocomplete
                    placeholder="Add a skill..."
                    value={newSkill}
                    onChange={setNewSkill}
                    suggestions={SKILL_SUGGESTIONS}
                    onEnter={() => addSkill("learn")}
                  />
                  <Button type="button" onClick={() => addSkill("learn")}>
                    <Plus className="size-5" />
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {skillsToLearn.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted text-accent rounded-lg"
                  >
                    {skill}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeSkill("learn", skill)}
                        className="hover:opacity-80"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <div className="pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-destructive text-destructive hover:bg-muted"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="size-5 mr-2" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>

              {logoutError && (
                <p className="text-sm text-destructive max-w-[260px]" role="alert">
                  {logoutError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="size-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-foreground">{stats.rating}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Sessions</span>
                <span className="font-semibold text-foreground">{stats.totalSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Skills Taught</span>
                <span className="font-semibold text-foreground">{stats.skillsTaught}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Skills Learned</span>
                <span className="font-semibold text-foreground">{stats.skillsLearned}</span>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <span className="text-xl">🏆</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Top Teacher</p>
                  <p className="text-xs text-muted-foreground">10+ sessions taught</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-xl">🎓</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Fast Learner</p>
                  <p className="text-xs text-muted-foreground">5+ skills learned</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <span className="text-xl">⭐</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">5-Star Rated</p>
                  <p className="text-xs text-muted-foreground">Excellent feedback</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
