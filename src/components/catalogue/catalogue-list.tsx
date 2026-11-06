"use client";

import * as React from "react";
import { Marked } from "@/components/ui/marked";
import Link from "next/link";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { FormationWithModules } from "@/lib/content/types";

// Liste du catalogue. Le filtre par métier n'apparaît qu'à partir de deux métiers.
export function CatalogueList({ formations }: { formations: FormationWithModules[] }) {
  const domains = Array.from(new Set(formations.map((f) => f.domain))).sort((a, b) => a.localeCompare(b, "fr"));
  const [domain, setDomain] = React.useState("");
  const shown = domain ? formations.filter((f) => f.domain === domain) : formations;

  return (
    <div className="space-y-6">
      {domains.length > 1 && (
        <ToggleGroup
          type="single"
          size="sm"
          value={domain || "tous"}
          onValueChange={(v) => setDomain(v === "tous" || !v ? "" : v)}
          aria-label="Filtrer par métier"
          className="flex-wrap gap-1.5"
        >
          <ToggleGroupItem value="tous" className="rounded-full px-3.5 data-[state=on]:bg-foreground data-[state=on]:text-background">Tous les métiers</ToggleGroupItem>
          {domains.map((d) => (
            <ToggleGroupItem key={d} value={d} className="rounded-full px-3.5 data-[state=on]:bg-foreground data-[state=on]:text-background">{d}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}

      <ul className="space-y-2">
        {shown.map((f) => {
          const open = f.modules.filter((m) => m.availability === "open").length;
          return (
            <li key={f.id}>
              <Link
                href={`/app/formations/${f.slug}`}
                className="group grid gap-x-8 gap-y-2 rounded-3xl bg-muted/50 p-6 transition-colors hover:bg-muted sm:grid-cols-[1fr_13rem] sm:p-7"
              >
                <span className="min-w-0 space-y-1">
                  <span className="block text-sm text-muted-foreground">{f.domain}</span>
                  <span className="block text-xl font-semibold tracking-tight">{f.title}</span>
                  <span className="block max-w-[62ch] text-body text-muted-foreground"><Marked text={f.promise} /></span>
                </span>
                <span className="space-y-1 text-sm text-muted-foreground sm:text-right">
                  <span className="block">{f.audience}</span>
                  <span className="block">
                    {f.modules.length} modules, {open} ouvert{open > 1 ? "s" : ""}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
