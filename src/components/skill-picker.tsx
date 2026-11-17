import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { addSkill, type SkillChoice } from "@/lib/api";
import { LEVELS, type Level, type Skill } from "@/lib/types";
import { cn, errorMessage } from "@/lib/utils";

interface Props {
  tone: "teach" | "learn";
  label: string;
  hint?: string;
  value: SkillChoice[];
  onChange: (next: SkillChoice[]) => void;
  skills: Skill[];
  /** Skills that cannot be picked here because they are on the other list. */
  exclude?: string[];
  max?: number;
}

/** Searchable skill selector with a level for each pick. New skills are created on the fly. */
export function SkillPicker({ tone, label, hint, value, onChange, skills, exclude = [], max = 12 }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const byId = useMemo(() => new Map(skills.map((s) => [s.id, s])), [skills]);
  const taken = useMemo(() => new Set([...value.map((v) => v.skill_id), ...exclude]), [value, exclude]);
  const available = skills.filter((s) => !taken.has(s.id));
  const term = search.trim().replace(/\s+/g, " ");
  const exact = skills.find((s) => s.name.toLowerCase() === term.toLowerCase());
  const full = value.length >= max;

  const pick = (id: string) => {
    onChange([...value, { skill_id: id, level: null }]);
    setSearch("");
    setOpen(false);
  };

  const createAndPick = async () => {
    setAdding(true);
    try {
      const skill = await addSkill(term);
      await queryClient.invalidateQueries({ queryKey: ["skills"] });
      if (taken.has(skill.id)) toast.info(`${skill.name} is already on one of your lists.`);
      else pick(skill.id);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const isTeach = tone === "teach";

  return (
    <fieldset className="space-y-2">
      <legend className="text-[13px] font-medium">{label}</legend>
      {hint && <p className="text-[13px] text-muted-foreground">{hint}</p>}

      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((choice) => {
            const name = byId.get(choice.skill_id)?.name ?? "Skill";
            return (
              <li key={choice.skill_id} className={cn("flex items-center gap-2 rounded-lg py-1 pl-3 pr-1 ring-1 ring-inset", isTeach ? "bg-primary/[0.07] ring-primary/20" : "bg-learn/[0.07] ring-learn/20")}>
                <span className={cn("min-w-0 flex-1 truncate text-[13px] font-medium", isTeach ? "text-primary" : "text-learn")}>{name}</span>
                <select
                  aria-label={`${isTeach ? "Your level in" : "Your current level in"} ${name}`}
                  value={choice.level ?? ""}
                  onChange={(e) => onChange(value.map((v) => (v.skill_id === choice.skill_id ? { ...v, level: (e.target.value || null) as Level | null } : v)))}
                  className="h-8 rounded-md border border-input bg-background px-1.5 text-[16px] text-foreground sm:text-[13px]"
                >
                  <option value="">Level</option>
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() => onChange(value.filter((v) => v.skill_id !== choice.skill_id))}
                  className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open ? (
        // Inline rather than a floating popover, so it works inside dialogs and bottom sheets and never covers the keyboard.
        <div className="overflow-hidden rounded-lg border border-input bg-popover" onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), setOpen(false))}>
          <Command shouldFilter>
            <CommandInput autoFocus placeholder="Search skills…" value={search} onValueChange={setSearch} />
            <CommandList className="max-h-56">
              <CommandEmpty className="px-3 py-4 text-sm text-muted-foreground">{term.length < 2 ? "Type to search." : "No existing skill matches."}</CommandEmpty>
              <CommandGroup>
                {available.map((s) => (
                  <CommandItem key={s.id} value={s.name} onSelect={() => pick(s.id)} className="min-h-10">
                    {s.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              {term.length >= 2 && !exact && (
                <CommandGroup forceMount heading="Not listed?">
                  <CommandItem forceMount value={`__create__${term}`} disabled={adding} onSelect={createAndPick} className="min-h-10">
                    <Plus className="size-4" aria-hidden />
                    {adding ? "Adding…" : `Add “${term}”`}
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
          <button type="button" onClick={() => { setOpen(false); setSearch(""); }} className="h-10 w-full border-t border-border text-sm text-muted-foreground hover:text-foreground">
            Close
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={full}
          onClick={() => setOpen(true)}
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-dashed border-input px-3.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden />
          {full ? `Up to ${max} skills` : value.length ? "Add another skill" : "Add a skill"}
        </button>
      )}
    </fieldset>
  );
}
