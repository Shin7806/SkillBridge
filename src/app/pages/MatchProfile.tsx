import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { MessageSquare, Loader2, ArrowLeft, GraduationCap, BookOpen, CalendarDays } from "lucide-react";
import { useState, useEffect } from "react";
import { getAvatarUrl } from "../../utils/avatar";
import { getProfileById, getUserSkillsById, getOrCreateConversation } from "../../services";
import type { Profile } from "../../types/tables";

type SkillWithName = {
  id: string;
  skill_type: string;
  level: string | null;
  skills: { name: string } | null;
};

export default function MatchProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<{ teach: string[]; learn: string[] }>({ teach: [], learn: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const [profileData, skillsData] = await Promise.all([
          getProfileById(id),
          getUserSkillsById(id),
        ]);
        if (!profileData) { setError("Profile not found"); return; }
        setProfile(profileData);
        const typed = skillsData as SkillWithName[];
        setSkills({
          teach: [...new Set(typed.filter((s) => s.skill_type === "teach").map((s) => s.skills?.name).filter(Boolean) as string[])],
          learn: [...new Set(typed.filter((s) => s.skill_type === "learn").map((s) => s.skills?.name).filter(Boolean) as string[])],
        });
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <p className="text-muted-foreground mb-4">{error || "Profile not found"}</p>
        <Link to="/matching"><Button variant="outline" size="sm">Back to Matches</Button></Link>
      </div>
    );
  }

  const displayName = profile.full_name || profile.username || "User";
  const initials = displayName.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const avatarUrl = getAvatarUrl(profile.avatar_url);
  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const handleMessage = async () => {
    try {
      setStartingChat(true);
      const convo = await getOrCreateConversation(id!);
      if (!convo?.id) throw new Error("No conversation");
      navigate(`/chat/${convo.id}`);
    } catch (err) {
      console.error("Failed to start chat", err);
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      {/* Profile hero */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-5">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5" />

        <div className="px-5 pb-5">
          {/* Avatar + name row */}
          <div className="flex items-end justify-between gap-3 -mt-10 mb-4 flex-wrap">
            <div className="size-20 rounded-full border-4 border-card overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0">
              {avatarUrl && !imgError
                ? <img src={avatarUrl} alt={displayName} className="size-full object-cover" onError={() => setImgError(true)} />
                : initials}
            </div>

            {/* Message button — always visible */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleMessage}
              disabled={startingChat}
              className="shrink-0"
            >
              {startingChat
                ? <Loader2 className="size-3.5 animate-spin mr-1.5" />
                : <MessageSquare className="size-3.5 mr-1.5" />}
              Message
            </Button>
          </div>

          <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
          {profile.headline && (
            <p className="text-sm text-muted-foreground mt-0.5">{profile.headline}</p>
          )}

          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            Joined {joinedDate}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</p>
          <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* Skills */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4 space-y-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skills</p>

        {/* Teach */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <GraduationCap className="size-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Can Teach</span>
          </div>
          {skills.teach.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.teach.map((s) => (
                <span key={s} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">None listed</p>
          )}
        </div>

        {/* Learn */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <BookOpen className="size-3.5 text-yellow-500" />
            <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">Wants to Learn</span>
          </div>
          {skills.learn.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.learn.map((s) => (
                <span key={s} className="text-xs bg-yellow-500/10 text-yellow-600 px-3 py-1.5 rounded-lg font-medium">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">None listed</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-primary">{skills.teach.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Teaching</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-yellow-500">{skills.learn.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Learning</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-foreground">{skills.teach.length + skills.learn.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Skills</p>
        </div>
      </div>
    </div>
  );
}