import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Search, MessageSquare, Loader2, GraduationCap, BookOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { findMatches, getOrCreateConversation } from "../../services";
import { getAvatarUrl } from "../../utils/avatar";

type DisplayMatch = {
  id: string;
  name: string;
  avatar: string;
  avatarUrl: string | null;
  teachSkills: string[];
  learnSkills: string[];
  bio: string;
  teachMatchCount: number;
  learnMatchCount: number;
};

export default function Matching() {
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<DisplayMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await findMatches({ limit: 20 });
        setMatches(
          data.map((m: any) => {
            const name = m.user.name || "User";
            return {
              id: m.user.id,
              name,
              avatar: name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
              avatarUrl: m.user.avatar_url || null,
              teachSkills: m.teachSkills || [],
              learnSkills: m.learnSkills || [],
              bio: m.user.bio || "",
              teachMatchCount: m.teachMatchCount,
              learnMatchCount: m.learnMatchCount,
            };
          })
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return matches;
    return matches.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q) ||
        [...m.teachSkills, ...m.learnSkills].some((s) => s.toLowerCase().includes(q))
    );
  }, [matches, searchQuery]);

  const handleMessage = async (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    try {
      setMessageLoading(userId);
      const convo = await getOrCreateConversation(userId);
      navigate(`/chat/${convo.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setMessageLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin size-7 text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Find a Match</h1>
        <p className="text-sm text-muted-foreground mt-1">
          People with skills you want — who want skills you have
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          placeholder="Search by name or skill…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No matches found. Try a different search.
        </div>
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((m) => {
          const resolvedAvatar = getAvatarUrl(m.avatarUrl);
          return (
            <Link
              key={m.id}
              to={`/profile/${m.id}`}
              className="group bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all block"
            >
              {/* Top: avatar + name + match counts */}
              <div className="flex items-center gap-3 mb-4">
                <div className="size-11 rounded-full overflow-hidden bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                  {resolvedAvatar
                    ? <img src={resolvedAvatar} alt={m.name} className="size-full object-cover" />
                    : m.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <span className="text-primary font-medium">{m.teachMatchCount}</span> teach match
                    {m.teachMatchCount !== 1 ? "es" : ""} ·{" "}
                    <span className="text-yellow-500 font-medium">{m.learnMatchCount}</span> learn match
                    {m.learnMatchCount !== 1 ? "es" : ""}
                  </p>
                </div>
              </div>

              {/* Skills preview */}
              <div className="space-y-2 mb-4">
                {m.teachSkills.length > 0 && (
                  <div className="flex items-start gap-2">
                    <GraduationCap className="size-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {m.teachSkills.slice(0, 3).map((s) => (
                        <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md font-medium">
                          {s}
                        </span>
                      ))}
                      {m.teachSkills.length > 3 && (
                        <span className="text-xs text-muted-foreground px-1">+{m.teachSkills.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
                {m.learnSkills.length > 0 && (
                  <div className="flex items-start gap-2">
                    <BookOpen className="size-3.5 text-yellow-500 mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {m.learnSkills.slice(0, 3).map((s) => (
                        <span key={s} className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-md font-medium">
                          {s}
                        </span>
                      ))}
                      {m.learnSkills.length > 3 && (
                        <span className="text-xs text-muted-foreground px-1">+{m.learnSkills.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bio */}
              {m.bio && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{m.bio}</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <span className="flex-1 text-xs text-primary font-medium group-hover:underline">
                  View profile →
                </span>
                <button
                  onClick={(e) => handleMessage(e, m.id)}
                  disabled={messageLoading === m.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {messageLoading === m.id
                    ? <Loader2 className="size-3 animate-spin" />
                    : <MessageSquare className="size-3" />}
                  Message
                </button>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}