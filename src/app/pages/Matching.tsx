import { Link } from "react-router";
import { Button } from "../components/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/Card";
import { Input } from "../components/Input";
import { Search, Star, MessageSquare, Calendar } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FilterDrawer, DEFAULT_MATCHING_FILTERS, MatchingFilterState, countActiveMatchingFilters } from "../components/filters/FilterDrawer";
import { SKILL_SUGGESTIONS } from "../data/skills";

const mockMatches = [
  {
    id: 1,
    name: "Sarah Chen",
    avatar: "SC",
    skills: ["React.js", "TypeScript", "Tailwind CSS"],
    teachSkills: ["React.js", "TypeScript", "Tailwind CSS"],
    learnSkills: ["Product Management"],
    bio: "Frontend developer with 5 years of experience. Love teaching modern web development.",
    rating: 4.9,
    sessions: 47,
    experienceLevel: "advanced",
    availability: "weekdays",
    mode: "online",
    lastActiveDaysAgo: 1,
  },
  {
    id: 2,
    name: "Alex Rivera",
    avatar: "AR",
    skills: ["Python", "Machine Learning", "Data Science"],
    teachSkills: ["Python", "Machine Learning", "Data Science"],
    learnSkills: ["UI/UX Design"],
    bio: "Data scientist passionate about making ML accessible to everyone.",
    rating: 4.8,
    sessions: 32,
    experienceLevel: "intermediate",
    availability: "flexible",
    mode: "online",
    lastActiveDaysAgo: 3,
  },
  {
    id: 3,
    name: "Maya Patel",
    avatar: "MP",
    skills: ["UI/UX Design", "Figma", "Product Design"],
    teachSkills: ["UI/UX Design", "Figma", "Product Design"],
    learnSkills: ["React.js"],
    bio: "Product designer helping people create beautiful user experiences.",
    rating: 5.0,
    sessions: 28,
    experienceLevel: "advanced",
    availability: "weekends",
    mode: "offline",
    lastActiveDaysAgo: 0,
  },
  {
    id: 4,
    name: "Jordan Lee",
    avatar: "JL",
    skills: ["JavaScript", "Node.js", "GraphQL"],
    teachSkills: ["JavaScript", "Node.js", "GraphQL"],
    learnSkills: ["Kubernetes"],
    bio: "Full-stack engineer who enjoys mentoring junior developers.",
    rating: 4.7,
    sessions: 55,
    experienceLevel: "beginner",
    availability: "weekdays",
    mode: "online",
    lastActiveDaysAgo: 7,
  },
];

type Match = (typeof mockMatches)[number];

const FILTER_STORAGE_KEY = "skillbridge.matchingFilters.v1";

function normalizeSkill(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

function matchesAnySelectedSkill(match: Match, selected: string[], types: ("teach" | "learn")[]) {
  if (selected.length === 0) return true;
  const selectedNorm = selected.map((s) => normalizeSkill(s).toLowerCase());

  const haystacks: string[][] = [];
  if (types.length === 0) {
    haystacks.push(match.teachSkills, match.learnSkills);
  } else {
    if (types.includes("teach")) haystacks.push(match.teachSkills);
    if (types.includes("learn")) haystacks.push(match.learnSkills);
  }

  const combined = haystacks.flat().map((s) => s.toLowerCase());
  return selectedNorm.some((s) => combined.includes(s));
}

export default function Matching() {
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<MatchingFilterState>(DEFAULT_MATCHING_FILTERS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FILTER_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as MatchingFilterState;
      setFilters({ ...DEFAULT_MATCHING_FILTERS, ...parsed });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // ignore
    }
  }, [filters]);

  const activeFilterCount = countActiveMatchingFilters(filters);

  const filteredMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = mockMatches.filter((m) => {
      if (q) {
        const inName = m.name.toLowerCase().includes(q);
        const inSkills = m.skills.some((s) => s.toLowerCase().includes(q));
        const inBio = m.bio.toLowerCase().includes(q);
        if (!inName && !inSkills && !inBio) return false;
      }

      if (!matchesAnySelectedSkill(m, filters.skills, filters.skillType)) return false;

      if (filters.experienceLevel && m.experienceLevel !== filters.experienceLevel) return false;
      if (filters.availability && m.availability !== filters.availability) return false;
      if (filters.mode && m.mode !== filters.mode) return false;

      if (filters.ratingAtLeast) {
        const min = Number(filters.ratingAtLeast);
        if (Number.isFinite(min) && m.rating < min) return false;
      }

      return true;
    });

    const sorted = [...result];
    if (filters.sortBy === "highest_rated") {
      sorted.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === "recently_active") {
      sorted.sort((a, b) => a.lastActiveDaysAgo - b.lastActiveDaysAgo);
    } else {
      // best_match: simple heuristic
      const selected = filters.skills.map((s) => normalizeSkill(s).toLowerCase());
      const score = (m: Match) => {
        const combined = [...m.teachSkills, ...m.learnSkills].map((s) => s.toLowerCase());
        const skillHits = selected.length ? selected.filter((s) => combined.includes(s)).length : 0;
        return skillHits * 10 + m.rating * 2 + Math.min(m.sessions, 50) / 10 - m.lastActiveDaysAgo / 10;
      };
      sorted.sort((a, b) => score(b) - score(a));
    }
    return sorted;
  }, [filters, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Find Your Perfect Match</h1>
        <p className="text-muted-foreground">
          Discover skilled teachers ready to help you learn
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
          <Input
            placeholder="Search by skill, name, or expertise..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setDrawerOpen(true)}
          className={activeFilterCount ? "border-primary text-primary" : undefined}
        >
          Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
        </Button>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <Card variant="bordered" className="text-center py-12">
          <p className="text-muted-foreground mb-2">No results found</p>
          <p className="text-sm text-muted-foreground">Try adjusting filters</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredMatches.map((match) => (
          <Card key={match.id} variant="elevated">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="size-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl flex-shrink-0">
                  {match.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle>{match.name}</CardTitle>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="size-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-foreground">{match.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{match.sessions} sessions</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {match.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-muted text-primary rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <CardDescription>{match.bio}</CardDescription>
            </CardContent>

            <CardFooter>
              <Link to={`/match/${match.id}`} className="flex-1">
                <Button variant="primary" className="w-full">
                  View Profile
                </Button>
              </Link>
              <Button variant="outline" aria-label="Send message">
                <MessageSquare className="size-5" />
              </Button>
              <Button variant="outline" aria-label="Schedule session">
                <Calendar className="size-5" />
              </Button>
            </CardFooter>
          </Card>
          ))}
        </div>
      )}

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initial={filters}
        onApply={(next) => setFilters(next)}
        onReset={() => setFilters(DEFAULT_MATCHING_FILTERS)}
        skillSuggestions={SKILL_SUGGESTIONS}
      />
    </div>
  );
}
