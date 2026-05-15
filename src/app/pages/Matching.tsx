import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/Card";
import { Input } from "../components/Input";
import { Search, MessageSquare, Calendar, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { findMatches } from "../../services";
import { getAvatarUrl } from "../../utils/avatar";
import { supabase } from "../../lib/supabase";
import { requireAuthUserId } from "../../lib/requireAuth";

type DisplayMatch = {
  id: string;
  name: string;
  avatar: string;
  avatarUrl: string | null;
  skills: string[];
  bio: string;
  teachMatchCount: number;
  learnMatchCount: number;
};

export default function Matching() {
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<DisplayMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState<string | null>(null);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const data = await findMatches({ limit: 20 });

        const mapped = data.map((m: any) => {
          const name = m.user.name || "User";

          const initials = name
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return {
            id: m.user.id,
            name,
            avatar: initials,
            avatarUrl: m.user.avatar_url || null,
            skills: [...m.teachSkills, ...m.learnSkills],
            bio: m.user.bio || "No bio available",
            teachMatchCount: m.teachMatchCount,
            learnMatchCount: m.learnMatchCount,
          };
        });

        setMatches(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return matches.filter((m) => {
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q) ||
        m.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [matches, searchQuery]);

  const handleMessage = async (targetUserId: string) => {
    try {
      setMessageLoading(targetUserId);
      const currentUserId = await requireAuthUserId();

      const { data: existing } = await supabase
        .from("swap_requests")
        .select("id")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUserId})`
        )
        .maybeSingle();

      if (existing) {
        window.location.href = `/chat/${existing.id}`;
        return;
      }

      const { data: newRequest } = await supabase
        .from("swap_requests")
        .insert({
          sender_id: currentUserId,
          receiver_id: targetUserId,
          status: "pending",
        })
        .select("id")
        .maybeSingle();

      if (!newRequest) throw new Error("Request failed");

      window.location.href = `/chat/${newRequest.id}`;
    } catch (err) {
      console.error(err);
    } finally {
      setMessageLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin size-8" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Input
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-6"
      />

      <div className="grid md:grid-cols-2 gap-6">
        {filtered.map((m) => (
          <Card key={m.id}>
            <CardHeader>
              <div className="flex gap-4 items-center">
                <div className="size-14 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {m.avatarUrl ? (
                    <img
                      src={getAvatarUrl(m.avatarUrl) || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{m.avatar}</span>
                  )}
                </div>

                <div>
                  <CardTitle>{m.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {m.teachMatchCount} teach • {m.learnMatchCount} learn
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <CardDescription>{m.bio}</CardDescription>
            </CardContent>

            <CardFooter className="flex gap-2">
              <Link to={`/match/${m.id}`} className="flex-1">
                <Button className="w-full">View Profile</Button>
              </Link>

              <Button onClick={() => handleMessage(m.id)}>
                {messageLoading === m.id ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <MessageSquare />
                )}
              </Button>

              <Button>
                <Calendar />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}