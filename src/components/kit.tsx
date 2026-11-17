// The small set of building blocks every screen is made from.
import { forwardRef, useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { ArrowLeftRight, Loader2, type LucideIcon } from "lucide-react";
import { avatarSrc, cn, initials } from "@/lib/utils";

// ── Button ───────────────────────────────────────────────────────────────────
type Variant = "primary" | "learn" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:brightness-110 font-semibold",
  learn: "bg-learn text-learn-foreground hover:brightness-110 font-semibold",
  secondary: "bg-secondary text-foreground border border-border hover:bg-accent",
  outline: "border border-border text-foreground hover:bg-accent",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-accent",
  danger: "bg-destructive/12 text-destructive hover:bg-destructive/20",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
  icon: "size-11 rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-[background-color,filter,transform,color] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
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
  "w-full rounded-xl border border-input bg-background px-3.5 text-foreground placeholder:text-muted-foreground/70 transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 aria-[invalid=true]:border-destructive";

interface FieldShell {
  label: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
}

function FieldWrap({ id, label, hint, error, optional, children, counter }: FieldShell & { id: string; children: ReactNode; counter?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {optional && <span className="ml-1.5 font-normal text-muted-foreground">optional</span>}
        </label>
        {counter && <span className="text-xs tabular-nums text-muted-foreground">{counter}</span>}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
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
        <input ref={ref} id={id} aria-invalid={!!error} aria-describedby={describedBy(id, shell)} className={cn(CONTROL, "h-11", trailing && "pr-12", className)} {...props} />
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
      <textarea id={id} value={value} maxLength={maxLength} aria-invalid={!!error} aria-describedby={describedBy(id, shell)} className={cn(CONTROL, "min-h-24 resize-y py-2.5 leading-relaxed", className)} {...props} />
    </FieldWrap>
  );
}

export function SelectField({ label, hint, error, optional, className, id: idProp, children, ...props }: FieldShell & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const id = idProp ?? auto;
  const shell = { label, hint, error, optional };
  return (
    <FieldWrap id={id} {...shell}>
      <select id={id} aria-invalid={!!error} aria-describedby={describedBy(id, shell)} className={cn(CONTROL, "h-11 appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9", className)}
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239da3ab' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}
        {...props}
      >
        {children}
      </select>
    </FieldWrap>
  );
}

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {children}
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_SIZES = { xs: "size-7 text-[10px]", sm: "size-9 text-xs", md: "size-11 text-sm", lg: "size-16 text-lg", xl: "size-24 text-2xl" };

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
    teach: strong ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
    learn: strong ? "bg-learn text-learn-foreground" : "bg-learn/10 text-learn ring-1 ring-inset ring-learn/20",
    neutral: "bg-raised text-muted-foreground ring-1 ring-inset ring-border",
  };
  return <span className={cn("inline-flex max-w-full items-center gap-1 truncate rounded-full px-2.5 py-1 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

// ── Swap strip: the signature element. Gold = teach, teal = learn, joined in the middle. ──
export function SwapStrip({ teach, learn, teachLabel = "You teach", learnLabel = "You learn", className }: { teach: string; learn: string; teachLabel?: string; learnLabel?: string; className?: string }) {
  return (
    <div className={cn("relative grid grid-cols-2 overflow-hidden rounded-xl ring-1 ring-inset ring-border", className)}>
      <div className="min-w-0 bg-primary/[0.09] py-2.5 pl-3.5 pr-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-primary/75">{teachLabel}</p>
        <p className="truncate font-semibold text-primary">{teach}</p>
      </div>
      <div className="min-w-0 bg-learn/[0.09] py-2.5 pl-6 pr-3.5 text-right">
        <p className="text-[11px] font-medium uppercase tracking-wider text-learn/75">{learnLabel}</p>
        <p className="truncate font-semibold text-learn">{learn}</p>
      </div>
      <span className="absolute left-1/2 top-1/2 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-background text-muted-foreground ring-1 ring-border" aria-hidden>
        <ArrowLeftRight className="size-3.5" />
      </span>
    </div>
  );
}

// ── Layout helpers ───────────────────────────────────────────────────────────
export function Card({ className, children, as: Tag = "div" }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" | "li" }) {
  return <Tag className={cn("rounded-2xl border border-border bg-card", className)}>{children}</Tag>;
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function Page({ children, width = "default" }: { children: ReactNode; width?: "narrow" | "default" | "wide" }) {
  const widths = { narrow: "max-w-2xl", default: "max-w-4xl", wide: "max-w-6xl" };
  return <div className={cn("mx-auto w-full px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-12", widths[width])}>{children}</div>;
}

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-raised text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <h2 className="font-sans text-base font-semibold tracking-normal">{title}</h2>
      {children && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-40 items-center justify-center gap-2.5 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}…
    </div>
  );
}

export function LoadError({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-10 text-center">
      <p className="text-sm text-foreground">We couldn't load this.</p>
      <p className="max-w-sm text-sm text-muted-foreground">{(error as Error | null)?.message || "Check your connection and try again."}</p>
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
    <div className={cn("grid gap-4", className)} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-card" />
      ))}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "teach" | "learn" | "success" | "danger" }) {
  const tones = {
    neutral: "bg-raised text-muted-foreground",
    teach: "bg-primary/12 text-primary",
    learn: "bg-learn/12 text-learn",
    success: "bg-success/12 text-success",
    danger: "bg-destructive/12 text-destructive",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img src="/logo.png" alt="" className="size-8 object-contain" />
      <span className="font-display text-lg font-bold tracking-tight">SkillBridge</span>
    </span>
  );
}
