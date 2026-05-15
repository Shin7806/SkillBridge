import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/Card";
import { Camera, Loader2, Plus, X } from "lucide-react";

import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useProfile } from "../../hooks/useProfile";

import { getAvatarUrl, getDisplayName } from "../../utils/avatar";
import { updateMyProfile } from "../../services/profile";
import { uploadAvatar } from "../../services/avatar";

import { getUserSkills, replaceUserSkills } from "../../services/userSkills";
import { getAllSkills } from "../../services/skills";

export default function Profile() {
  const user = useCurrentUser();
  const profile = useProfile(user?.id);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    bio: "",
  });

  const [allSkills, setAllSkills] = useState<any[]>([]);
  const [teachSkills, setTeachSkills] = useState<string[]>([]);
  const [learnSkills, setLearnSkills] = useState<string[]>([]);

  // 🔥 SEARCH STATES
  const [teachSearch, setTeachSearch] = useState("");
  const [learnSearch, setLearnSearch] = useState("");

  const [showTeachPicker, setShowTeachPicker] = useState(false);
  const [showLearnPicker, setShowLearnPicker] = useState(false);

  const displayName = getDisplayName(user, profile);
  const avatarUrl = getAvatarUrl(profile?.avatar_url);

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // LOAD PROFILE
  useEffect(() => {
    if (!profile) return;

    setForm({
      name: profile.full_name || "",
      bio: profile.bio || "",
    });
  }, [profile]);

  // LOAD SKILLS
  useEffect(() => {
    const load = async () => {
      const [userSkillsRaw, skills] = await Promise.all([
        getUserSkills(),
        getAllSkills(),
      ]);

      const userSkills = userSkillsRaw as any[];

      setAllSkills(skills);

      const idToName = new Map(skills.map((s: any) => [s.id, s.name]));

      setTeachSkills(
        userSkills
          .filter((s: any) => s.skill_type === "teach")
          .map((s: any) => idToName.get(s.skill_id))
          .filter(Boolean)
      );

      setLearnSkills(
        userSkills
          .filter((s: any) => s.skill_type === "learn")
          .map((s: any) => idToName.get(s.skill_id))
          .filter(Boolean)
      );
    };

    if (user?.id) load();
  }, [user?.id]);

  // SAVE
  const handleSave = async () => {
    try {
      setSaving(true);

      await updateMyProfile({
        full_name: form.name,
        bio: form.bio,
      });

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

      setEditing(false);
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatar = async (file: File) => {
    const path = await uploadAvatar(file);
    await updateMyProfile({ avatar_url: path });
    window.location.reload();
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
    if (type === "teach") {
      setTeachSkills(teachSkills.filter((s) => s !== skill));
    } else {
      setLearnSkills(learnSkills.filter((s) => s !== skill));
    }
  };

  const filterSkills = (search: string) =>
    allSkills.filter((s: any) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );

  return (
  <div className="max-w-6xl mx-auto px-6 py-8">
    {/* HEADER */}
    <div className="flex justify-between mb-8">
      <h1 className="text-3xl font-bold">My Profile</h1>

      {!editing ? (
        <Button onClick={() => setEditing(true)}>Edit Profile</Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {saving && <Loader2 className="size-4 animate-spin mr-2" />}
            Save
          </Button>
        </div>
      )}
    </div>

    <div className="grid lg:grid-cols-3 gap-6">
      {/* LEFT */}
      <div className="lg:col-span-2 space-y-6">
        {/* PROFILE */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Info</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img className="size-20 rounded-full" src={avatarUrl} />
              ) : (
                <div className="size-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl">
                  {initials}
                </div>
              )}

              {editing && (
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatar(file);
                  }}
                />
              )}
            </div>

            <Input
              label="Name"
              value={form.name}
              disabled={!editing}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <Textarea
              label="Bio"
              value={form.bio}
              disabled={!editing}
              onChange={(e) =>
                setForm({ ...form, bio: e.target.value })
              }
            />
          </CardContent>
        </Card>

        {/* SKILLS */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* TEACH */}
          <Card>
            <CardHeader>
              <CardTitle>Skills I Teach</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {teachSkills.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-1"
                  >
                    {s}
                    {editing && (
                      <X
                        className="size-3 cursor-pointer"
                        onClick={() => removeSkill("teach", s)}
                      />
                    )}
                  </span>
                ))}
              </div>

              {editing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTeachPicker(true)}
                  >
                    <Plus className="size-4 mr-1" /> Add Skill
                  </Button>

                  {showTeachPicker && (
                    <div className="mt-3">
                      <input
                        className="w-full px-3 py-2 rounded bg-muted border"
                        placeholder="Search..."
                        value={teachSearch}
                        onChange={(e) => setTeachSearch(e.target.value)}
                      />

                      <div className="mt-2 max-h-40 overflow-y-auto flex flex-wrap gap-2">
                        {filterSkills(teachSearch).map((s: any) => (
                          <button
                            key={s.id}
                            className="px-2 py-1 text-sm bg-muted rounded hover:bg-primary/20"
                            onClick={() => addSkill("teach", s.name)}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* LEARN */}
          <Card>
            <CardHeader>
              <CardTitle>Skills I Learn</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {learnSkills.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded-full text-sm flex items-center gap-1"
                  >
                    {s}
                    {editing && (
                      <X
                        className="size-3 cursor-pointer"
                        onClick={() => removeSkill("learn", s)}
                      />
                    )}
                  </span>
                ))}
              </div>

              {editing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLearnPicker(true)}
                  >
                    <Plus className="size-4 mr-1" /> Add Skill
                  </Button>

                  {showLearnPicker && (
                    <div className="mt-3">
                      <input
                        className="w-full px-3 py-2 rounded bg-muted border"
                        placeholder="Search..."
                        value={learnSearch}
                        onChange={(e) => setLearnSearch(e.target.value)}
                      />

                      <div className="mt-2 max-h-40 overflow-y-auto flex flex-wrap gap-2">
                        {filterSkills(learnSearch).map((s: any) => (
                          <button
                            key={s.id}
                            className="px-2 py-1 text-sm bg-muted rounded hover:bg-yellow-500/20"
                            onClick={() => addSkill("learn", s.name)}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ✅ LOGOUT NOW CORRECTLY INSIDE LEFT COLUMN */}
        <div className="pt-0">
  <button
    onClick={async () => {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }}
    className="
      px-6 py-3
      text-sm font-medium
      text-red-500
      border border-red-500/40
      rounded-md
      hover:bg-red-500 hover:text-white
      transition-all duration-200
    "
  >
    Logout
  </button>
</div>
      </div>

      {/* RIGHT */}
      <div>
        <Card className="bg-gradient-to-br from-muted/40 to-muted/10 border border-border">
          <CardHeader>
            <CardTitle className="text-lg">Stats</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Sessions</p>
              <p className="text-xl font-semibold">0</p>
            </div>

            <div className="p-3 rounded-lg bg-primary/10">
              <p className="text-xs text-muted-foreground">Teaching</p>
              <p className="text-xl font-semibold text-primary">
                {teachSkills.length}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-yellow-500/10">
              <p className="text-xs text-muted-foreground">Learning</p>
              <p className="text-xl font-semibold text-yellow-400">
                {learnSkills.length}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Rating</p>
              <p className="text-xl font-semibold">—</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);
}