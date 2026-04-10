import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "./Input";

type SkillAutocompleteProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
  maxResults?: number;
  onEnter?: () => void;
};

export function SkillAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  suggestions,
  required,
  disabled,
  className,
  maxResults = 8,
  onEnter,
}: SkillAutocompleteProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const normalizedValue = value.trim().toLowerCase();
  const hasQuery = normalizedValue.length > 0;
  const filtered = useMemo(() => {
    if (!normalizedValue) return [];
    return suggestions
      .filter((s) => s.toLowerCase().includes(normalizedValue))
      .slice(0, maxResults);
  }, [maxResults, normalizedValue, suggestions]);

  const hasResults = filtered.length > 0;
  const exactMatch = useMemo(() => {
    if (!normalizedValue) return null;
    return suggestions.find((s) => s.toLowerCase() === normalizedValue) ?? null;
  }, [normalizedValue, suggestions]);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      setIsOpen(false);
      setActiveIndex(-1);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const select = (skill: string) => {
    onChange(skill);
    setIsOpen(false);
    setActiveIndex(-1);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        ref={(node) => {
          inputRef.current = node;
        }}
        label={label}
        placeholder={placeholder}
        value={value}
        required={required}
        disabled={disabled}
        autoComplete="off"
        className={className}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onFocus={() => setIsOpen(hasQuery)}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          setIsOpen(next.trim().length > 0);
          setActiveIndex(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setIsOpen(false);
            setActiveIndex(-1);
            return;
          }

          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!hasQuery) return;
            if (!isOpen) setIsOpen(true);
            if (!hasResults) return;
            setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
            return;
          }

          if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!hasQuery) return;
            if (!isOpen) setIsOpen(true);
            if (!hasResults) return;
            setActiveIndex((i) => Math.max(i - 1, 0));
            return;
          }

          if (e.key === "Enter") {
            if (isOpen && activeIndex >= 0 && activeIndex < filtered.length) {
              e.preventDefault();
              select(filtered[activeIndex]);
              return;
            }

            if (onEnter) {
              e.preventDefault();
              onEnter();
            }
          }
        }}
      />

      {isOpen && hasQuery && !disabled && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg"
        >
          {hasResults ? (
            <div className="max-h-56 overflow-auto py-1">
              {filtered.map((skill, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={skill}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      isActive ? "bg-muted text-foreground" : "text-foreground hover:bg-muted"
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseDown={(ev) => {
                      // Prevent input blur before click
                      ev.preventDefault();
                    }}
                    onClick={() => select(skill)}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
          )}
        </div>
      )}
    </div>
  );
}

