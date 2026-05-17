import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Button } from "../components/Button";
import { Camera, Loader2, Plus, X, GraduationCap, BookOpen, LogOut, Pencil, Check } from "lucide-react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useProfile } from "../../hooks/useProfile";
import { getAvatarUrl, getDisplayName } from "../../utils/avatar";
import { uploadAvatar } from "../../services/avatar";
import { getUserSkills, replaceUserSkills } from "../../services/userSkills";
import { getAllSkills } from "../../services/skills";
import { updateMyProfile, getUserSkillsById } from "../../services/profile";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const targetUserId = id || user?.id;
  const isMyProfile = !id || id === user?.id;
  const { profile, refetch } = useProfile(targetUserId);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", headline: "" });

  const [allSkills, setAllSkills] = useState<any[]>([]);
  const [teachSkills, setTeachSkills] = useState<string[]>([]);
  const [learnSkills, setLearnSkills] = useState<string[]>([]);
  const [teachSearch, setTeachSearch] = useState("");
  const [learnSearch, setLearnSearch] = useState("");
  const [showTeachPicker, setShowTeachPicker] = useState(false);
  const [showLearnPicker, setShowLearnPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const displayName = getDisplayName(user, profile);
  const savedAvatarUrl = getAvatarUrl(profile?.avatar_url);
  const displayAvatarUrl = avatarPreview ?? savedAvatarUrl;
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.full_name || "",
      bio: profile.bio || "",
      headline: (profile as any).headline || "",
    });
  }, [profile]);

  useEffect(() => {
    if (!targetUserId) return;
    const load = async () => {
      const skills = await getAllSkills();
      setAllSkills(skills);
      const idToName = new Map(skills.map((s: any) => [s.id, s.name]));

      if (isMyProfile) {
        const userSkillsRaw = await getUserSkills();
        const userSkills = userSkillsRaw as any[];
        setTeachSkills(
          userSkills
            .filter((s: any) => s.skill_type === "teach")
            .map((s: any) => idToName.get(s.skill_id))
            .filter(Boolean) as string[]
        );
        setLearnSkills(
          userSkills
            .filter((s: any) => s.skill_type === "learn")
            .map((s: any) => idToName.get(s.skill_id))
            .filter(Boolean) as string[]
        );
      } else {
        // getUserSkillsById returns joined data with skills.name
        const userSkillsRaw = await getUserSkillsById(targetUserId);
        const userSkills = userSkillsRaw as any[];
        setTeachSkills(
          userSkills
            .filter((s: any) => s.skill_type === "teach")
            .map((s: any) => s.skills?.name)
            .filter(Boolean) as string[]
        );
        setLearnSkills(
          userSkills
            .filter((s: any) => s.skill_type === "learn")
            .map((s: any) => s.skills?.name)
            .filter(Boolean) as string[]
        );
      }
    };
    load();
  }, [targetUserId, isMyProfile]);

  useEffect(
    () => () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    },
    [avatarPreview]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (avatarFile) {
        const path = await uploadAvatar(avatarFile);
        await updateMyProfile({ avatar_url: path });
        setAvatarFile(null);
        if (avatarPreview) {
          URL.revokeObjectURL(avatarPreview);
          setAvatarPreview(null);
        }
      }
      await updateMyProfile({
        full_name: form.name,
        bio: form.bio,
        headline: form.headline,
      } as any);
      const nameToId = new Map(allSkills.map((s: any) => [s.name, s.id]));
      const entries = [
        ...teachSkills.map((name) => ({
          skill_id: nameToId.get(name),
          skill_type: "teach" as const,
        })),
        ...learnSkills.map((name) => ({
          skill_id: nameToId.get(name),
          skill_type: "learn" as const,
        })),
      ].filter((e) => e.skill_id);
      await replaceUserSkills(entries);
      await refetch();
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      setAvatarFile(null);
    }
    if (profile)
      setForm({
        name: profile.full_name || "",
        bio: profile.bio || "",
        headline: (profile as any).headline || "",
      });
  };

  const addSkill = (type: "teach" | "learn", skill: string) => {
    if (type === "teach") {
      if (!teachSkills.includes(skill)) setTeachSkills([...teachSkills, skill]);
      setShowTeachPicker(false);
      setTeachSearch("");
    } else {
      if (!learnSkills.includes(skill)) setLearnSkills([...learnSkills, skill]);
      setShowLearnPicker(false);
      setLearnSearch("");
    }
  };

  const removeSkill = (type: "teach" | "learn", skill: string) => {
    if (type === "teach") setTeachSkills(teachSkills.filter((s) => s !== skill));
    else setLearnSkills(learnSkills.filter((s) => s !== skill));
  };

  const filterSkills = (search: string) =>
    allSkills.filter((s: any) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );

  const inputClass =
    "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile hero card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-5">
        <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5" />

        <div className="px-5 pb-5">
          <div className="flex items-end justify-between gap-3 -mt-10 mb-4 flex-wrap">
            <div className="relative group">
              <div className="size-20 rounded-full border-4 border-card overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0">
                {displayAvatarUrl ? (
                  <img
                    src={displayAvatarUrl}
                    className="size-full object-cover"
                    alt={displayName}
                  />
                ) : (
                  initials
                )}
              </div>
              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity"
                >
                  <Camera className="text-white size-4" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileSelect}
            />

            {isMyProfile &&
              (editing ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={cancelEdit}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Check className="size-3.5 mr-1.5" />
                    )}
                    Save
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="size-3.5 mr-1.5" /> Edit
                </Button>
              ))}
          </div>

          {editing ? (
            <div className="space-y-2.5">
              <input
                className={inputClass}
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className={inputClass}
                placeholder="Headline (e.g. Full-stack developer)"
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
              />
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
              {(profile as any)?.headline && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {(profile as any).headline}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          About
        </p>
        {editing ? (
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            placeholder="Tell others about yourself…"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        ) : (
          <p className="text-sm text-foreground leading-relaxed">
            {profile?.bio || (
              <span className="text-muted-foreground">No bio added yet.</span>
            )}
          </p>
        )}
      </div>

      {/* Skills */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4 space-y-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Skills
        </p>

        {/* Teach */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <GraduationCap className="size-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Can Teach
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {teachSkills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium"
              >
                {s}
                {editing && (
                  <button onClick={() => removeSkill("teach", s)}>
                    <X className="size-3 hover:opacity-70" />
                  </button>
                )}
              </span>
            ))}
            {teachSkills.length === 0 && !editing && (
              <p className="text-xs text-muted-foreground">None listed</p>
            )}
            {editing && (
              <button
                onClick={() => {
                  setShowTeachPicker((v) => !v);
                  setShowLearnPicker(false);
                }}
                className="inline-flex items-center gap-1 text-xs border border-dashed border-border text-muted-foreground px-3 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="size-3" /> Add
              </button>
            )}
          </div>
          {showTeachPicker && editing && (
            <div className="mt-2 bg-background border border-border rounded-lg p-2">
              <input
                className={`${inputClass} mb-2`}
                placeholder="Search skills…"
                value={teachSearch}
                onChange={(e) => setTeachSearch(e.target.value)}
                autoFocus
              />
              <div className="max-h-36 overflow-y-auto flex flex-wrap gap-1.5">
                {filterSkills(teachSearch).map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => addSkill("teach", s.name)}
                    className="text-xs px-2.5 py-1 bg-muted rounded-md hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Learn */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <BookOpen className="size-3.5 text-yellow-500" />
            <span className="text-xs font-semibold text-yellow-600 uppercase tracking-wider">
              Wants to Learn
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {learnSkills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-600 px-3 py-1.5 rounded-lg font-medium"
              >
                {s}
                {editing && (
                  <button onClick={() => removeSkill("learn", s)}>
                    <X className="size-3 hover:opacity-70" />
                  </button>
                )}
              </span>
            ))}
            {learnSkills.length === 0 && !editing && (
              <p className="text-xs text-muted-foreground">None listed</p>
            )}
            {editing && (
              <button
                onClick={() => {
                  setShowLearnPicker((v) => !v);
                  setShowTeachPicker(false);
                }}
                className="inline-flex items-center gap-1 text-xs border border-dashed border-border text-muted-foreground px-3 py-1.5 rounded-lg hover:border-yellow-500 hover:text-yellow-600 transition-colors"
              >
                <Plus className="size-3" /> Add
              </button>
            )}
          </div>
          {showLearnPicker && editing && (
            <div className="mt-2 bg-background border border-border rounded-lg p-2">
              <input
                className={`${inputClass} mb-2`}
                placeholder="Search skills…"
                value={learnSearch}
                onChange={(e) => setLearnSearch(e.target.value)}
                autoFocus
              />
              <div className="max-h-36 overflow-y-auto flex flex-wrap gap-1.5">
                {filterSkills(learnSearch).map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => addSkill("learn", s.name)}
                    className="text-xs px-2.5 py-1 bg-muted rounded-md hover:bg-yellow-500/10 hover:text-yellow-600 transition-colors"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-primary">{teachSkills.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Teaching</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-yellow-500">{learnSkills.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Learning</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xl font-bold text-foreground">
            {teachSkills.length + learnSkills.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Total</p>
        </div>
      </div>

      {/* Logout */}
      {isMyProfile && (
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/login";
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 text-red-500 text-sm hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      )}
    </div>
  );
}