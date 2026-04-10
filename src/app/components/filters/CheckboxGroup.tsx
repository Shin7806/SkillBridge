type Option = { value: string; label: string };

export function CheckboxGroup({
  value,
  onChange,
  options,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: Option[];
}) {
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const checked = value.includes(opt.value);
        return (
          <label
            key={opt.value}
            className="flex items-center gap-2 text-sm text-foreground select-none cursor-pointer"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(opt.value)}
              className="size-4 rounded border border-border bg-card accent-primary"
            />
            <span className={checked ? "text-primary" : undefined}>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

