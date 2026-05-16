import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Star, Calendar, MessageSquare, Clock, Loader2, User } from "lucide-react";
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<{ teach: string[], learn: string[] }>({ teach: [], learn: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileData, skillsData] = await Promise.all([
          getProfileById(id),
          getUserSkillsById(id),
        ]);

        if (!profileData) {
          setError("Profile not found");
          return;
        }

        setProfile(profileData);

        // Extract skill names from the joined data
        const teach = (skillsData as SkillWithName[])
          .filter(s => s.skill_type === "teach")
          .map((s) => s.skills?.name)
          .filter(Boolean) as string[];

        const learn = (skillsData as SkillWithName[])
          .filter(s => s.skill_type === "learn")
          .map((s) => s.skills?.name)
          .filter(Boolean) as string[];

        setSkills({
          teach: [...new Set(teach)],
          learn: [...new Set(learn)]
        });

        console.log("[MatchProfile] Profile loaded:", profileData.id);
      } catch (err) {
        console.error("[MatchProfile] Failed to load profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 text-center">
        <p className="text-muted-foreground">{error || "Profile not found"}</p>
        <Link to="/matching" className="mt-4 inline-block">
          <Button variant="outline">Back to Matches</Button>
        </Link>
      </div>
    );
  }

  const displayName = profile.full_name || profile.username || "User";
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl = getAvatarUrl(profile.avatar_url);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <Card variant="elevated" className="mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="size-32 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-5xl flex-shrink-0 ring-4 ring-primary/20">
            {avatarUrl && !imgError ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              initials || "U"
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-1">{displayName}</h1>
            <p className="text-lg text-muted-foreground mb-4">
              {profile.headline || "SkillBridge Member"}
            </p>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Star className="size-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">—</span>
                <span className="text-muted-foreground">({skills.teach.length + skills.learn.length} skills)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-5" />
                <span>Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">

              <Button 
                variant="outline" 
                size="lg"
                disabled={startingChat}
                onClick={async () => {
                  try {
                    setStartingChat(true);
                    const conversation = await getOrCreateConversation(id);
                    if (!conversation?.id) throw new Error("Conversation not created");
                    console.log("OTHER USER:", id);
                    console.log("CONVERSATION RESULT:", conversation);
                    navigate(`/chat/${conversation.id}`);
                  } catch (err) {
                    console.error("Failed to start chat", err);
                  } finally {
                    setStartingChat(false);
                  }
                }}
              >
                {startingChat ? <Loader2 className="size-5 mr-2 animate-spin" /> : <MessageSquare className="size-5 mr-2" />}
                Send Message
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* About */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed">
                {profile.bio || "This user hasn't added a bio yet."}
              </p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Teaching Section */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    What they can teach
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.teach.length > 0 ? (
                      skills.teach.map((skill) => (
                        <span
                          key={skill}
                          className="px-4 py-2 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20 rounded-lg font-medium"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No teaching skills listed</p>
                    )}
                  </div>
                </div>

                {/* Learning Section */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary/60"></span>
                    What they want to learn
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.learn.length > 0 ? (
                      skills.learn.map((skill) => (
                        <span
                          key={skill}
                          className="px-4 py-2 bg-muted text-foreground border border-border rounded-lg font-medium"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No learning goals listed</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-4">
                No reviews yet
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Availability */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="size-4 text-primary" />
                  <span>Contact to arrange</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {profile.username && (
                  <div className="text-foreground">@{profile.username}</div>
                )}
                <div className="text-muted-foreground text-sm">
                  Joined {new Date(profile.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Skills Listed</span>
                  <span className="font-semibold text-foreground">{skills.teach.length + skills.learn.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-semibold text-foreground">
                    {new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
