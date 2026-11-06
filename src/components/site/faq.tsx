import { PlusIcon } from "lucide-react";

// FAQ en <details> natifs : accessible au clavier, aucun JavaScript, ouverture en fondu court.
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((it) => (
        <details key={it.q} data-faq className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-5 type-body font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            {it.q}
            <PlusIcon data-faq-icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          </summary>
          <div className="max-w-[var(--text-max)] pb-6 type-body text-foreground/75">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
