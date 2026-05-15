import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/Card";
import { Star, Calendar, MessageSquare, Award, Clock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getProfileById, getUserSkillsById } from "../../services";
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
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const skillNames = (skillsData as SkillWithName[])
          .map((s) => s.skills?.name)
          .filter(Boolean) as string[];
        // Deduplicate
        setSkills([...new Set(skillNames)]);

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

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <Card variant="elevated" className="mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="size-32 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-5xl flex-shrink-0">
            {initials || "U"}
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
                <span className="text-muted-foreground">({skills.length} skills)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-5" />
                <span>Member since {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={`/schedule/${id}`}>
                <Button variant="primary" size="lg">
                  <Calendar className="size-5 mr-2" />
                  Schedule Session
                </Button>
              </Link>
              <Link to="/chat">
                <Button variant="outline" size="lg">
                  <MessageSquare className="size-5 mr-2" />
                  Send Message
                </Button>
              </Link>
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
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-4 py-2 bg-muted text-primary rounded-lg font-medium"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-muted-foreground">No skills listed yet</p>
                )}
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
                  <span className="font-semibold text-foreground">{skills.length}</span>
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
