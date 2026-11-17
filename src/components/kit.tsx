// The small set of building blocks every screen is made from. Dense, quiet, consistent.
import { Children, forwardRef, Fragment, isValidElement, useId, useState, type ButtonHTMLAttributes, type ChangeEvent, type OptionHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ArrowLeftRight, Check, ChevronDown, Loader2, type LucideIcon } from "lucide-react";
import { avatarSrc, cn, initials } from "@/lib/utils";

// ── Button ───────────────────────────────────────────────────────────────────
type Variant = "primary" | "learn" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] hover:brightness-105",
  learn: "bg-learn text-learn-foreground hover:brightness-105",
  secondary: "bg-raised text-foreground ring-1 ring-inset ring-border hover:bg-accent hover:ring-foreground/15",
  outline: "text-foreground ring-1 ring-inset ring-border hover:bg-accent",
  ghost: "text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground",
  danger: "bg-destructive/12 text-destructive hover:bg-destructive/20",
};
const SIZES: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-md px-2.5 text-[13px] [&_svg]:size-3.5",
  md: "h-9 gap-2 rounded-lg px-3.5 text-sm",
  lg: "h-11 gap-2 rounded-lg px-5 text-[15px]",
  icon: "size-9 rounded-lg",
  "icon-sm": "size-8 rounded-md [&_svg]:size-4",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-medium transition-[background-color,filter,transform,color,box-shadow] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, loading, disabled, className, children, type = "button", ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClass(variant, size, className)} {...props}>
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({ variant, size, className, ...props }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

// ── Form fields ──────────────────────────────────────────────────────────────
const CONTROL =
  "w-full rounded-lg border border-input bg-background px-3 text-foreground placeholder:text-muted-foreground/60 transition-[border-color,box-shadow] duration-150 hover:border-foreground/20 focus-visible:border-primary/70 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/15 disabled:opacity-60 aria-[invalid=true]:border-destructive";

interface FieldShell {
  label?: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
}

function FieldWrap({ id, label, hint, error, optional, children, counter }: FieldShell & { id: string; children: ReactNode; counter?: string }) {
  return (
    <div className={cn(label || counter ? "space-y-1.5" : "contents")}>
      {(label || counter) && <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-foreground">
          {label}
          {optional && <span className="ml-1.5 font-normal text-muted-foreground">optional</span>}
        </label>
        {counter && <span className="text-[11px] tabular-nums text-muted-foreground">{counter}</span>}
      </div>}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, s: FieldShell) => (s.error ? `${id}-error` : s.hint ? `${id}-hint` : undefined);

export const TextField = forwardRef<HTMLInputElement, FieldShell & InputHTMLAttributes<HTMLInputElement> & { trailing?: ReactNode }>(function TextField(
  { label, hint, error, optional, className, trailing, id: idProp, ...props },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  const shell = { label, hint, error, optional };
  return (
    <FieldWrap id={id} {...shell}>
      <div className="relative">
        <input ref={ref} id={id} aria-invalid={!!error} aria-describedby={describedBy(id, shell)} className={cn(CONTROL, "h-10 sm:h-9", trailing && "pr-11", className)} {...props} />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
    </FieldWrap>
  );
});

export function TextArea({ label, hint, error, optional, className, id: idProp, maxLength, value, ...props }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const id = idProp ?? auto;
  const shell = { label, hint, error, optional };
  const counter = maxLength ? `${String(value ?? "").length}/${maxLength}` : undefined;
  return (
    <FieldWrap id={id} counter={counter} {...shell}>
      <textarea id={id} value={value} maxLength={maxLength} aria-invalid={!!error} aria-describedby={describedBy(id, shell)} className={cn(CONTROL, "min-h-20 resize-y py-2 leading-relaxed", className)} {...props} />
    </FieldWrap>
  );
}

type SelectOption = { value: string; label: ReactNode; disabled?: boolean };

/** Reads <option> children so callers keep writing plain options. */
function readOptions(children: ReactNode): SelectOption[] {
  const out: SelectOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<OptionHTMLAttributes<HTMLOptionElement>>(child)) return;
    if (child.type === Fragment) return void out.push(...readOptions((child.props as { children?: ReactNode }).children));
    out.push({ value: String(child.props.value ?? ""), label: child.props.children, disabled: child.props.disabled });
  });
  return out;
}

const EMPTY = "__empty__";

/** Styled, keyboard-accessible select (Radix). Same API as a native select with <option> children. */
export function SelectField({ label, hint, error, optional, className, id: idProp, children, value, onChange, disabled, name, "aria-label": ariaLabel }: FieldShell & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const id = idProp ?? auto;
  const shell = { label, hint, error, optional };
  const options = readOptions(children);
  const toKey = (v: string) => (v === "" ? EMPTY : v);
  const placeholder = options.find((o) => o.value === "")?.label;
  return (
    <FieldWrap id={id} {...shell}>
      <SelectPrimitive.Root
        value={toKey(String(value ?? ""))}
        disabled={disabled}
        name={name}
        onValueChange={(v) => onChange?.({ target: { value: v === EMPTY ? "" : v }, currentTarget: { value: v === EMPTY ? "" : v } } as unknown as ChangeEvent<HTMLSelectElement>)}
      >
        <SelectPrimitive.Trigger
          id={id}
          aria-label={ariaLabel}
          aria-invalid={!!error}
          aria-describedby={describedBy(id, shell)}
          className={cn(CONTROL, "group flex h-10 items-center justify-between gap-2 text-left data-[placeholder]:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:h-9", className)}
        >
          <span className="min-w-0 truncate">
            <SelectPrimitive.Value placeholder={placeholder} />
          </span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className="z-[60] max-h-[min(var(--radix-select-content-available-height),18rem)] w-[var(--radix-select-trigger-width)] min-w-[8rem] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl shadow-black/30 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          >
            <SelectPrimitive.Viewport className="scrollbar-thin p-1">
              {options.map((o) => (
                <SelectPrimitive.Item
                  key={o.value || EMPTY}
                  value={toKey(o.value)}
                  disabled={o.disabled}
                  className="relative flex h-9 cursor-default select-none items-center rounded-md pl-2.5 pr-8 text-[14px] outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-foreground/[0.07] data-[state=checked]:font-medium data-[disabled]:opacity-40 sm:h-8 sm:text-[13px]"
                >
                  <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2.5 inline-flex">
                    <Check className="size-3.5 text-primary" aria-hidden />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </FieldWrap>
  );
}

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive animate-in fade-in-0 duration-200">
      {children}
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_SIZES = { xs: "size-6 text-[9px]", sm: "size-8 text-[11px]", md: "size-10 text-[13px]", lg: "size-14 text-base", xl: "size-20 text-xl" };

export function Avatar({ name, src, size = "md", className }: { name?: string | null; src?: string | null; size?: keyof typeof AVATAR_SIZES; className?: string }) {
  const url = avatarSrc(src);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = url && failedUrl !== url;
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-raised font-semibold text-muted-foreground ring-1 ring-border", AVATAR_SIZES[size], className)} aria-hidden>
      {showImage ? <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover" onError={() => setFailedUrl(url)} /> : initials(name)}
    </span>
  );
}

// ── Skill chip ───────────────────────────────────────────────────────────────
export function SkillChip({ children, tone = "neutral", strong, className }: { children: ReactNode; tone?: "teach" | "learn" | "neutral"; strong?: boolean; className?: string }) {
  const tones = {
    teach: strong ? "bg-primary text-primary-foreground" : "bg-primary/[0.09] text-primary ring-1 ring-inset ring-primary/15",
    learn: strong ? "bg-learn text-learn-foreground" : "bg-learn/[0.09] text-learn ring-1 ring-inset ring-learn/15",
    neutral: "bg-raised text-muted-foreground ring-1 ring-inset ring-border",
  };
  return <span className={cn("inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

// ── Swap indicator: a quiet "teach ⇄ learn" pair. Gold = teach, teal = learn. ──
export function SwapStrip({ teach, learn, teachLabel = "Teach", learnLabel = "Learn", className }: { teach: string; learn: string; teachLabel?: string; learnLabel?: string; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-1.5 text-[13px]", className)}>
      <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md bg-primary/[0.09] px-2 py-1 ring-1 ring-inset ring-primary/15">
        <span className="text-[11px] text-primary/70">{teachLabel}</span>
        <span className="truncate font-medium text-primary">{teach}</span>
      </span>
      <ArrowLeftRight className="size-3.5 shrink-0 text-muted-foreground/70" aria-label="in exchange for" />
      <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md bg-learn/[0.09] px-2 py-1 ring-1 ring-inset ring-learn/15">
        <span className="text-[11px] text-learn/70">{learnLabel}</span>
        <span className="truncate font-medium text-learn">{learn}</span>
      </span>
    </div>
  );
}

// ── Layout helpers ───────────────────────────────────────────────────────────
export function Card({ className, children, as: Tag = "div" }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" | "li" }) {
  return <Tag className={cn("rounded-xl border border-border bg-card", className)}>{children}</Tag>;
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function Page({ children, width = "default" }: { children: ReactNode; width?: "narrow" | "default" | "wide" }) {
  const widths = { narrow: "max-w-2xl", default: "max-w-4xl", wide: "max-w-6xl" };
  return <div className={cn("mx-auto w-full px-4 pb-28 pt-6 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 sm:px-6 sm:pt-8 md:pb-12", widths[width])}>{children}</div>;
}

/** A labelled group inside a page: small heading, optional count and action. */
export function Section({ title, count, action, children, className }: { title: string; count?: number; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-medium tracking-normal text-muted-foreground">
          {title}
          {count !== undefined && <span className="ml-1.5 tabular-nums text-muted-foreground/60">{count}</span>}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <span className="mb-3 grid size-10 place-items-center rounded-lg bg-raised text-muted-foreground ring-1 ring-border">
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <h2 className="text-[15px]">{title}</h2>
      {children && <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{children}</p>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-32 items-center justify-center gap-2 text-[13px] text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}…
    </div>
  );
}

export function LoadError({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2.5 rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-8 text-center">
      <p className="text-sm text-foreground">We couldn't load this.</p>
      <p className="max-w-sm text-[13px] text-muted-foreground">{(error as Error | null)?.message || "Check your connection and try again."}</p>
      {retry && (
        <Button variant="secondary" size="sm" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function SkeletonCards({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3", className)} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "teach" | "learn" | "success" | "danger" }) {
  const tones = {
    neutral: "bg-raised text-muted-foreground ring-1 ring-inset ring-border",
    teach: "bg-primary/12 text-primary",
    learn: "bg-learn/12 text-learn",
    success: "bg-success/12 text-success",
    danger: "bg-destructive/12 text-destructive",
  };
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium", tones[tone])}>{children}</span>;
}

/** Small unread/pending counter. */
export function CountDot({ count, className }: { count?: number; className?: string }) {
  if (!count) return null;
  return (
    <span className={cn("grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground animate-in zoom-in-50 duration-200", className)}>
      {count > 9 ? "9+" : count}
      <span className="sr-only"> waiting for you</span>
    </span>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img src="/logo.png" alt="" className="h-6 w-auto object-contain" />
      {!compact && <span className="text-[15px] font-semibold tracking-tight">SkillBridge</span>}
    </span>
  );
}
