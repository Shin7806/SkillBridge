import { ReactNode } from "react";

export function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

