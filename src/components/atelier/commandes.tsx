"use client";

import * as React from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { commandeACopier, type CommandeOutil } from "@/lib/sessions/atelier";

/* ---------------- Les commandes de l'outil ---------------- */

/** « /approfondir <compte> » : la partie à compléter est mise en évidence. */
function CommandeText({ text }: { text: string }) {
  return text.split(/(<[^>]*>)/g).map((part, i) =>
    /^<.*>$/.test(part) ? (
      <span key={i} className="text-primary/80 italic">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

export function CommandeRow({ c }: { c: CommandeOutil }) {
  const [copied, setCopied] = React.useState(false);
  const toFill = /<[^>]*>/.test(c.commande);
  async function copy() {
    try {
      await navigator.clipboard.writeText(commandeACopier(c.commande));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success(toFill ? "Commande copiée : collez-la dans Claude et complétez la partie entre < >." : "Commande copiée : collez-la dans Claude.");
    } catch {
      toast.error("La copie n'a pas fonctionné : sélectionnez le texte à la main.");
    }
  }
  return (
    <li className="space-y-2 rounded-2xl bg-muted/50 p-4">
      <button
        type="button"
        onClick={copy}
        className="group flex w-full items-center justify-between gap-3 rounded-xl bg-background px-3 py-2 text-left shadow-xs ring-1 ring-foreground/5 transition-colors hover:ring-primary/40"
        aria-label={`Copier la commande ${c.commande}`}
      >
        <code className="min-w-0 truncate font-mono text-[0.875rem] font-semibold">
          <CommandeText text={c.commande} />
        </code>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
          {copied ? <CheckIcon className="size-3.5" aria-hidden /> : <CopyIcon className="size-3.5" aria-hidden />}
          {copied ? "Copiée" : "Copier"}
        </span>
      </button>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm leading-relaxed">
        <dt className="text-muted-foreground">Quand</dt>
        <dd>{c.quand}</dd>
        <dt className="text-muted-foreground">Rend</dt>
        <dd>{c.rend}</dd>
      </dl>
    </li>
  );
}

