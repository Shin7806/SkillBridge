import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "../Button";
import { SkillAutocomplete } from "../SkillAutocomplete";
import { FilterSection } from "./FilterSection";
import { SelectDropdown } from "./SelectDropdown";

export type MatchingFilterState = {
  skills: string[];
  skillType: ("teach" | "learn")[]; // empty = both
  experienceLevel: "" | "beginner" | "intermediate" | "advanced";
  availability: "" | "weekdays" | "weekends" | "flexible";
  mode: "" | "online" | "offline";
  ratingAtLeast: "" | "3" | "4";
  sortBy: "best_match" | "recently_active" | "highest_rated";
};

export const DEFAULT_MATCHING_FILTERS: MatchingFilterState = {
  skills: [],
  skillType: [],
  experienceLevel: "",
  availability: "",
  mode: "",
  ratingAtLeast: "",
  sortBy: "best_match",
};

export function countActiveMatchingFilters(state: MatchingFilterState) {
  let count = 0;
  if (state.skills.length) count += 1;
  if (state.skillType.length) count += 1;
  if (state.experienceLevel) count += 1;
  if (state.availability) count += 1;
  if (state.mode) count += 1;
  if (state.ratingAtLeast) count += 1;
  if (state.sortBy !== "best_match") count += 1;
  return count;
}

function PillGroup({
  value,
  onChange,
  options,
  multi,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? "" : opt.value)}
            className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
              active
                ? "border-primary text-primary bg-muted"
                : "border-border text-foreground hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiPillGroup({
  value,
  onChange,
  options,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: { value: string; label: string }[];
}) {
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
              active
                ? "border-primary text-primary bg-muted"
                : "border-border text-foreground hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function normalizeSkill(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

export function FilterDrawer({
  open,
  onClose,
  initial,
  onApply,
  onReset,
  skillSuggestions,
}: {
  open: boolean;
  onClose: () => void;
  initial: MatchingFilterState;
  onApply: (state: MatchingFilterState) => void;
  onReset: () => void;
  skillSuggestions: string[];
}) {
  const [draft, setDraft] = useState<MatchingFilterState>(initial);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (open) setDraft(initial);
  }, [initial, open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const skillTypeValue = useMemo(() => {
    const next: ("teach" | "learn")[] = [];
    if (draft.skillType.includes("teach")) next.push("teach");
    if (draft.skillType.includes("learn")) next.push("learn");
    return next;
  }, [draft.skillType]);

  const addSkill = (raw: string) => {
    const skill = normalizeSkill(raw);
    if (!skill) return;
    if (draft.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setSkillInput("");
      return;
    }
    setDraft((d) => ({ ...d, skills: [...d.skills, skill] }));
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setDraft((d) => ({ ...d, skills: d.skills.filter((s) => s !== skill) }));
  };

  return (
    <>
      {/* Centered Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {/* Overlay (outside click closes) */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          onMouseDown={onClose}
          aria-hidden="true"
        />
        <div
          className={`relative z-10 w-full max-w-[500px] h-[80vh] max-h-[80vh] bg-[#2A2E34] border border-[#3B3F46] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.4)] overflow-hidden transform transition-transform duration-200 ${
            open ? "scale-100" : "scale-95"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div className="h-full flex flex-col min-h-0">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#3B3F46] flex items-center justify-between">
              <div className="text-lg font-semibold text-foreground">Filters</div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close filters"
              >
                <X className="size-5 text-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-auto px-5 py-4 space-y-6 pb-6 overscroll-contain">
              <FilterSection title="Skills">
                <div className="space-y-3">
                  <SkillAutocomplete
                    placeholder="Search or add skills..."
                    value={skillInput}
                    onChange={setSkillInput}
                    suggestions={skillSuggestions}
                    onEnter={() => addSkill(skillInput)}
                  />
                  {draft.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {draft.skills.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/60 text-foreground rounded-full text-sm border border-[#3B3F46]"
                        >
                          <span className="text-primary">{s}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(s)}
                            className="hover:opacity-80"
                            aria-label={`Remove ${s}`}
                          >
                            <X className="size-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </FilterSection>

              <FilterSection title="Skill Type">
                <MultiPillGroup
                  value={skillTypeValue}
                  onChange={(next) => setDraft((d) => ({ ...d, skillType: next as ("teach" | "learn")[] }))}
                  options={[
                    { value: "teach", label: "Can Teach" },
                    { value: "learn", label: "Wants to Learn" },
                  ]}
                />
              </FilterSection>

              <FilterSection title="Experience Level">
                <PillGroup
                  value={draft.experienceLevel}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, experienceLevel: v as MatchingFilterState["experienceLevel"] }))
                  }
                  options={[
                    { value: "beginner", label: "Beginner" },
                    { value: "intermediate", label: "Intermediate" },
                    { value: "advanced", label: "Advanced" },
                  ]}
                />
              </FilterSection>

              <FilterSection title="Availability">
                <PillGroup
                  value={draft.availability}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, availability: v as MatchingFilterState["availability"] }))
                  }
                  options={[
                    { value: "weekdays", label: "Weekdays" },
                    { value: "weekends", label: "Weekends" },
                    { value: "flexible", label: "Flexible" },
                  ]}
                />
              </FilterSection>

              <FilterSection title="Mode of Learning">
                <PillGroup
                  value={draft.mode}
                  onChange={(v) => setDraft((d) => ({ ...d, mode: v as MatchingFilterState["mode"] }))}
                  options={[
                    { value: "online", label: "Online" },
                    { value: "offline", label: "Offline" },
                  ]}
                />
              </FilterSection>

              <FilterSection title="Rating">
                <SelectDropdown
                  value={draft.ratingAtLeast}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, ratingAtLeast: v as MatchingFilterState["ratingAtLeast"] }))
                  }
                  options={[
                    { value: "", label: "Any rating" },
                    { value: "3", label: "3★ and above" },
                    { value: "4", label: "4★ and above" },
                  ]}
                />
              </FilterSection>

              <FilterSection title="Sort By">
                <SelectDropdown
                  value={draft.sortBy}
                  onChange={(v) => setDraft((d) => ({ ...d, sortBy: v as MatchingFilterState["sortBy"] }))}
                  options={[
                    { value: "best_match", label: "Best Match" },
                    { value: "recently_active", label: "Recently Active" },
                    { value: "highest_rated", label: "Highest Rated" },
                  ]}
                />
              </FilterSection>
            </div>

            {/* Sticky Footer */}
            <div className="px-5 py-4 border-t border-[#3B3F46] bg-[#2A2E34] shrink-0">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setDraft(DEFAULT_MATCHING_FILTERS);
                    setSkillInput("");
                    onReset();
                  }}
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-[#F5B301] text-[#1E2328] hover:opacity-90"
                  onClick={() => {
                    onApply(draft);
                    onClose();
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

