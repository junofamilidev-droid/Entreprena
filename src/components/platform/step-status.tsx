"use client";

import { CheckIcon } from "lucide-react";
import { useProgress, useProgressReady } from "@/lib/progress/store";

// État d'une étape pour l'apprenant : terminée, en cours ou à faire.
export function StepStatus({ stepKey }: { stepKey: string }) {
  const ready = useProgressReady();
  const p = useProgress()[stepKey];
  if (!ready) return <span className="text-sm text-muted-foreground">&nbsp;</span>;
  if (p?.done)
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
        <CheckIcon className="size-4" strokeWidth={3} aria-hidden /> Terminé
      </span>
    );
  return <span className="text-sm text-muted-foreground">{p ? "En cours" : "À faire"}</span>;
}
