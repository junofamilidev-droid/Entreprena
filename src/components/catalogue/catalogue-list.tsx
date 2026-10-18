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
          variant="outline"
          size="sm"
          value={domain || "tous"}
          onValueChange={(v) => setDomain(v === "tous" || !v ? "" : v)}
          aria-label="Filtrer par métier"
          className="flex-wrap"
        >
          <ToggleGroupItem value="tous" className="px-3">Tous les métiers</ToggleGroupItem>
          {domains.map((d) => (
            <ToggleGroupItem key={d} value={d} className="px-3">{d}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}

      <ul className="divide-y border-y">
        {shown.map((f) => {
          const open = f.modules.filter((m) => m.availability === "open").length;
          return (
            <li key={f.id}>
              <Link
                href={`/formations/${f.slug}`}
                className="grid gap-x-8 gap-y-2 py-6 transition-colors hover:bg-muted/50 sm:grid-cols-[1fr_13rem] sm:px-3"
              >
                <span className="min-w-0 space-y-1">
                  <span className="block text-sm text-muted-foreground">{f.domain}</span>
                  <span className="block font-serif text-xl font-semibold">{f.title}</span>
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
